// packages/mqtt-core/src/rpc-types.ts

import { rpcSchemas } from "../schemas/rpc-methods.schemas";

export interface RpcRequest {
  id: string; // Уникальный идентификатор запроса
  method: string;
  params?: Record<string, any>;
  deviceId: string;
}

export type MqttRpcRequest = {
  topic: string; // Топик для отправки запроса
  message: RpcRequest; // Сообщение запроса
};

export interface RpcResponse {
  id: string; // Уникальный идентификатор запроса, к которому относится ответ
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  deviceId: string;
}

/**
 * Типы RPC методов
 *
 * @example
 * ```ts
 * import { RpcMethod } from 'iot-core/schemas/rpc-methods';
 *
 * const method: RpcMethod = 'turnOnLed'; // допустимо
 * const invalidMethod: RpcMethod = 'unknownMethod'; // ошибка компиляции
 * ```
 */
export type RpcMethod = keyof typeof rpcSchemas;
export type RpcMethodParams = (typeof rpcSchemas)[RpcMethod] extends {
  parse: (data: any) => infer R;
}
  ? R
  : never;
