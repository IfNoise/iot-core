import { jest } from "@jest/globals";
import mqtt from "mqtt";
import { MqttRpcClient } from "./mqtt-rpc-client";
import { getRequestTopic, getResponseTopic } from "../../utils/rpc.utils";
import type { MqttClient } from "mqtt";
import type { RpcRequest, RpcResponse } from "../../types";

// ---------- Моки ----------
jest.mock("mqtt", () => ({
  connect: jest.fn(),
}));

jest.mock("../../utils/rpc.utils", () => ({
  getRequestTopic: jest.fn(),
  getResponseTopic: jest.fn(),
}));

// ---------- Настройки ----------
const mockOptions = {
  brokerUrl: "mqtt://localhost:1883",
  userId: "user123",
  deviceId: "device456",
  token: "jwt-token",
};

let mockClient: jest.Mocked<MqttClient>;

beforeEach(() => {
  jest.clearAllMocks();

  mockClient = {
    on: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    end: jest.fn(),
    connected: true,
  } as unknown as jest.Mocked<MqttClient>;

  (mqtt.connect as jest.Mock).mockReturnValue(mockClient);
  (getRequestTopic as jest.Mock).mockImplementation(
    (userId, deviceId) => `users/${userId}/devices/${deviceId}/command`
  );
  (getResponseTopic as jest.Mock).mockImplementation(
    (userId, deviceId) => `users/${userId}/devices/${deviceId}/response`
  );
});

// ---------- Тесты ----------
describe("MqttRpcClient", () => {
  it("должен подключаться к брокеру с правильными параметрами", () => {
    new MqttRpcClient(mockOptions);

    expect(mqtt.connect).toHaveBeenCalledWith(mockOptions.brokerUrl, {
      username: "jwt",
      password: mockOptions.token,
      reconnectPeriod: 2000,
      will: undefined,
    });

    expect(mockClient.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith(
      "reconnect",
      expect.any(Function)
    );
    expect(mockClient.on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith("close", expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("должен конфигурировать will, если задан willPayload", () => {
    const optionsWithWill = {
      ...mockOptions,
      willPayload: "offline",
      qos: 1 as const,
    };

    new MqttRpcClient(optionsWithWill);

    expect(mqtt.connect).toHaveBeenCalledWith(optionsWithWill.brokerUrl, {
      username: "jwt",
      password: optionsWithWill.token,
      reconnectPeriod: 2000,
      will: {
        topic: `users/${optionsWithWill.userId}/devices/${optionsWithWill.deviceId}/status`,
        payload: "offline",
        qos: 1,
        retain: true,
      },
    });
  });

  it("должен отправлять команду на правильный топик", () => {
    const client = new MqttRpcClient(mockOptions);

    const command: RpcRequest = {
      id: "123",
      method: "test",
      params: {},
      deviceId: mockOptions.deviceId,
    };

    const topic = `users/${mockOptions.userId}/devices/${command.deviceId}/command`;
    (getRequestTopic as jest.Mock).mockReturnValue(topic);

    client.sendCommand(command);

    expect(mockClient.publish).toHaveBeenCalledWith(
      topic,
      JSON.stringify(command),
      { qos: 1 },
      expect.any(Function)
    );
  });

  it("не должен отправлять команду, если клиент отключен", () => {
    mockClient.connected = false;
    const client = new MqttRpcClient(mockOptions);

    const command: RpcRequest = {
      id: "123",
      method: "test",
      params: {},
      deviceId: mockOptions.deviceId,
    };

    client.sendCommand(command);

    expect(mockClient.publish).not.toHaveBeenCalled();
  });

  it("должен отправлять команду асинхронно и получать ответ", async () => {
    jest.useFakeTimers();
    let messageHandler: ((topic: string, msg: Buffer) => void) | undefined;

    mockClient.on.mockImplementation((event, cb) => {
      if (event === "message")
        messageHandler = cb as (topic: string, msg: Buffer) => void;
      return mockClient;
    });

    const client = new MqttRpcClient(mockOptions);
    const command: RpcRequest = {
      id: "123",
      method: "test",
      params: {},
      deviceId: mockOptions.deviceId,
    };

    const response: RpcResponse = {
      id: "123",
      result: "success",
      error: undefined,
    };

    const promise = client.sendCommandAsync(command);
    if (messageHandler) {
      messageHandler("response/topic", Buffer.from(JSON.stringify(response)));
    }

    await expect(promise).resolves.toEqual(response);
  });

  it("должен завершаться по таймауту, если ответа нет", async () => {
    jest.useFakeTimers();
    const client = new MqttRpcClient(mockOptions);
    const command: RpcRequest = {
      id: "123",
      method: "timeoutTest",
      params: {},
      deviceId: mockOptions.deviceId,
    };

    const promise = client.sendCommandAsync(command, 1000);
    jest.advanceTimersByTime(1001);

    await expect(promise).rejects.toThrow("RPC timeout");
  });

  it("должен подписываться на топик ответа", () => {
    const client = new MqttRpcClient(mockOptions);
    const topic = `users/${mockOptions.userId}/devices/${mockOptions.deviceId}/response`;
    (getResponseTopic as jest.Mock).mockReturnValue(topic);

    client.onResponseTopic();

    expect(mockClient.subscribe).toHaveBeenCalledWith(
      topic,
      { qos: 1 },
      expect.any(Function)
    );
  });

  it("должен правильно возвращать статус подключения", () => {
    mockClient.connected = true;
    const client = new MqttRpcClient(mockOptions);
    expect(client.isConnected()).toBe(true);

    mockClient.connected = false;
    expect(client.isConnected()).toBe(false);
  });

  it("должен корректно отключаться", () => {
    const client = new MqttRpcClient(mockOptions);
    client.disconnect();
    expect(mockClient.end).toHaveBeenCalledWith(
      false,
      {},
      expect.any(Function)
    );
  });

  it("должен игнорировать невалидный JSON в сообщении", async () => {
    let messageHandler: ((topic: string, msg: Buffer) => void) | undefined;

    mockClient.on.mockImplementation((event, cb) => {
      if (event === "message")
        messageHandler = cb as (topic: string, msg: Buffer) => void;
      return mockClient;
    });

    new MqttRpcClient(mockOptions);

    expect(() => {
      messageHandler?.("some/topic", Buffer.from("{ invalid json"));
    }).not.toThrow();
  });

  it("должен игнорировать ответ с другим id", async () => {
    let messageHandler: ((topic: string, msg: Buffer) => void) | undefined;

    mockClient.on.mockImplementation((event, cb) => {
      if (event === "message")
        messageHandler = cb as (topic: string, msg: Buffer) => void;
      return mockClient;
    });

    const client = new MqttRpcClient(mockOptions);

    const command: RpcRequest = {
      id: "abc",
      method: "test",
      params: {},
      deviceId: mockOptions.deviceId,
    };

    const promise = client.sendCommandAsync(command, 500);

    if (messageHandler) {
      messageHandler(
        "some/topic",
        Buffer.from(JSON.stringify({ id: "wrong-id", result: "nope" }))
      );
    }

    jest.advanceTimersByTime(501);
    await expect(promise).rejects.toThrow("RPC timeout");
  });

  it("должен обрабатывать несколько параллельных команд", async () => {
    let messageHandler: ((topic: string, msg: Buffer) => void) | undefined;

    mockClient.on.mockImplementation((event, cb) => {
      if (event === "message")
        messageHandler = cb as (topic: string, msg: Buffer) => void;
      return mockClient;
    });

    const client = new MqttRpcClient(mockOptions);

    const cmd1: RpcRequest = {
      id: "1",
      method: "a",
      params: {},
      deviceId: mockOptions.deviceId,
    };
    const cmd2: RpcRequest = {
      id: "2",
      method: "b",
      params: {},
      deviceId: mockOptions.deviceId,
    };

    const promise1 = client.sendCommandAsync(cmd1);
    const promise2 = client.sendCommandAsync(cmd2);

    messageHandler?.(
      "topic",
      Buffer.from(JSON.stringify({ id: "1", result: "ok1" }))
    );
    messageHandler?.(
      "topic",
      Buffer.from(JSON.stringify({ id: "2", result: "ok2" }))
    );

    await expect(promise1).resolves.toEqual({ id: "1", result: "ok1" });
    await expect(promise2).resolves.toEqual({ id: "2", result: "ok2" });
  });

  it("должен обработать ошибку при публикации команды", () => {
    const client = new MqttRpcClient(mockOptions);

    const command: RpcRequest = {
      id: "123",
      method: "error",
      params: {},
      deviceId: mockOptions.deviceId,
    };

    const error = new Error("Publish failed");

    mockClient.publish.mockImplementation((...args: any[]) => {
      const cb = args[args.length - 1];
      if (typeof cb === "function") {
        cb(error);
      }
      return mockClient;
    });

    expect(() => client.sendCommand(command)).not.toThrow();
  });
});
