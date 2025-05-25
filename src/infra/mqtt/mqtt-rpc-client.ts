import mqtt from "mqtt";
import type { RpcRequest, RpcResponse } from "../../types/rpc.types";
import { getRequestTopic, getResponseTopic } from "../../utils/rpc.utils";

type Logger = {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
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
        const cb = this.responseListeners.get(parsed.id);
        if (cb) cb(parsed);
      } catch (e) {
        this.error("[MQTT] Invalid RPC response:", e);
      }
    });
  }

  onConnect(callback: () => void) {
    this.client.on("connect", callback);
  }

  sendCommand(command: RpcRequest): void {
    const topic = getRequestTopic(this.options.userId, command.deviceId);
    const payload = JSON.stringify(command);

    if (!this.client.connected) {
      this.warn("[MQTT] Not connected, cannot send command.");
      return;
    }

    const publishOptions: IClientPublishOptions = {
      qos: this.options.qos ?? 1,
    };

    this.client.publish(topic, payload, publishOptions, (err: Error) => {
      if (err) {
        this.error("[MQTT] Failed to publish:", err.message);
      }
    });
  }

  async sendCommandAsync(
    command: RpcRequest,
    timeout = 5000
  ): Promise<RpcResponse> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.responseListeners.delete(command.id);
        reject(new Error("RPC timeout"));
      }, timeout);

      this.responseListeners.set(command.id, (resp) => {
        clearTimeout(timer);
        this.responseListeners.delete(command.id);
        resolve(resp);
      });

      this.sendCommand(command);
    });
  }

  onResponseTopic(): void {
    const topic = getResponseTopic(this.options.userId, this.options.deviceId);
    const subscribeOptions: IClientSubscribeOptions = {
      qos: this.options.qos ?? 1,
    };

    this.client.subscribe(topic, subscribeOptions, (err: Error) => {
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
