// packages/mqtt-core/src/rpc-types.ts

import { rpcSchemas } from "../schemas/rpc-methods.schemas";

export interface RpcRequest {
  id: string;
  method: string;
  params?: Record<string, any>;
  deviceId: string;
}

export interface RpcResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
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
