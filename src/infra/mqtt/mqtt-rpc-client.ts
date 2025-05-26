import mqtt from "mqtt";
import type {
  MqttRpcRequest,
  RpcMethod,
  RpcMethodParams,
  RpcRequest,
  RpcResponse,
} from "../../types/rpc.types";
import {
  createValidatedRpcRequest,
  getResponseTopic,
} from "../../utils/rpc.utils";

type Logger = {
  log: (...args: any[]) => any;
  warn: (...args: any[]) => any;
  error: (...args: any[]) => any;
};

type MqttClient = ReturnType<typeof mqtt.connect>;
type MqttOptions = Parameters<typeof mqtt.connect>[1];
type IClientPublishOptions = Parameters<MqttClient["publish"]>[2];
type IClientSubscribeOptions = Parameters<MqttClient["subscribe"]>[1];

type MqttRpcClientOptions = {
  brokerUrl: string;
  userId: string;
  deviceId: string;
  token?: string;
  username?: string;
  qos?: 0 | 1 | 2;
  willPayload?: string;
  logger?: Logger;
};

export class MqttRpcClient {
  private client: MqttClient;
  private options: MqttRpcClientOptions;
  private responseListeners: Map<string, (response: RpcResponse) => void> =
    new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(options: MqttRpcClientOptions) {
    this.options = options;

    const mqttOptions: MqttOptions = {
      username: options.username ?? "jwt",
      password: options.token,
      reconnectPeriod: 2000,
      will: options.willPayload
        ? {
            topic: `users/${options.userId}/devices/${options.deviceId}/status`,
            payload: options.willPayload,
            qos: options.qos ?? 1,
            retain: true,
          }
        : undefined,
    };

    this.client = mqtt.connect(options.brokerUrl, mqttOptions);

    this.attachDefaultListeners();
    this.attachMessageHandler();

    this.cleanupInterval = setInterval(
      () => this.cleanupStaleListeners(),
      60000
    );
  }

  private log(...args: any[]) {
    this.options.logger?.log?.(...args);
  }

  private warn(...args: any[]) {
    this.options.logger?.warn?.(...args);
  }

  private error(...args: any[]) {
    this.options.logger?.error?.(...args);
  }

  private attachDefaultListeners() {
    this.client.on("connect", () => {
      this.log("[MQTT] Connected");
    });
    this.client.on("reconnect", () => {
      this.log("[MQTT] Reconnecting...");
    });
    this.client.on("error", (err: Error) => {
      this.error("[MQTT] Error:", err.message);
    });
    this.client.on("close", () => {
      this.warn("[MQTT] Connection closed");
    });
    this.client.on("offline", () => {
      this.warn("[MQTT] Offline");
    });
  }

  private attachMessageHandler() {
    this.client.on("message", (topic: string, message: Buffer) => {
      try {
        const parsed = JSON.parse(message.toString()) as RpcResponse;
        const cb = this.responseListeners.get(parsed.deviceId);
        if (cb) cb(parsed);
      } catch (e) {
        this.error("[MQTT] Invalid RPC response:", e);
      }
    });
  }

  onConnect(callback: () => void) {
    this.client.on("connect", callback);
  }

  sendCommand(
    userId: string,
    deviceId: string,
    command: RpcMethod,
    params: RpcMethodParams
  ): void {
    const request: MqttRpcRequest = createValidatedRpcRequest(
      userId,
      deviceId,
      command,
      params
    );
    const payload = JSON.stringify(request.message);

    if (!this.client.connected) {
      this.warn("[MQTT] Not connected, cannot send command.");
      return;
    }

    const publishOptions: IClientPublishOptions = {
      qos: this.options.qos ?? 1,
    };

    this.client.publish(request.topic, payload, publishOptions, (err) => {
      if (err) {
        this.error("[MQTT] Failed to publish:", err.message);
      }
    });
  }

  async sendCommandAsync(
    userId: string,
    deviceId: string,
    command: RpcMethod,
    params: RpcMethodParams,
    timeout = 5000
  ): Promise<RpcResponse> {
    const response = createValidatedRpcRequest(
      userId,
      deviceId,
      command,
      params
    );
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.responseListeners.delete(response.message.id);
        this.warn("[MQTT] RPC timeout for command:", command);
        reject(new Error("RPC timeout"));
      }, timeout);

      this.responseListeners.set(response.message.id, (resp) => {
        clearTimeout(timer);
        this.responseListeners.delete(response.message.id);
        resolve(resp);
      });

      this.client.publish(
        response.topic,
        JSON.stringify(response.message),
        { qos: this.options.qos ?? 1 },
        (err) => {
          if (err) {
            this.error("[MQTT] Failed to publish command:", err.message);
            this.responseListeners.delete(response.message.id);
            reject(err);
          } else {
            this.log("[MQTT] Command sent:", command, params);
          }
        }
      );
    });
  }

  onResponseTopic(): void {
    const topic = getResponseTopic(this.options.userId, this.options.deviceId);
    const subscribeOptions: IClientSubscribeOptions = {
      qos: this.options.qos ?? 1,
    };

    this.client.subscribe(topic, subscribeOptions, (err: Error | null) => {
      if (err) {
        this.error("[MQTT] Subscribe error:", err.message);
      } else {
        this.log(`[MQTT] Subscribed to response topic: ${topic}`);
      }
    });
  }

  private cleanupStaleListeners(): void {
    // Расширяемая логика очистки старых callback'ов (например, через Map<string, { timestamp, cb }>)
  }

  isConnected(): boolean {
    return this.client.connected;
  }

  disconnect(force = false): void {
    clearInterval(this.cleanupInterval);
    this.client.end(force, {}, () => {
      this.log("[MQTT] Disconnected");
    });
  }
}
