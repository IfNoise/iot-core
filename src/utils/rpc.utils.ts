import { rpcSchemas } from "../schemas/rpc-methods.schemas";
import { MqttRpcRequest, RpcRequest } from "../types/rpc.types";

export const getRequestTopic = (userId: string, deviceId: string): string =>
  `users/${userId}/devices/${deviceId}/rpc/request`;

export const getResponseTopic = (userId: string, deviceId: string): string =>
  `users/${userId}/devices/${deviceId}/rpc/response`;

// Validate an RPC request against known method schemas
export function validateRpc(method: string, params?: any): void {
  // Проверяем, существует ли метод в схеме
  if (method in rpcSchemas) {
    const schema = rpcSchemas[method as keyof typeof rpcSchemas];
    schema.parse(params);
  } else {
    throw new Error(`Unknown RPC method: ${method}`);
  }
}

// Wrapper for publishing RPC requests with validation
export function createValidatedRpcRequest(
  userId: string,
  deviceId: string,
  method: string,
  params?: any
): MqttRpcRequest {
  validateRpc(method, params);

  return {
    topic: getRequestTopic(userId, deviceId),
    message: {
      id: crypto.randomUUID(),
      deviceId,
      method,
      params,
    },
  };
}

// Wrapper for creating WS RPC requests with validation
export function createValidatedWsRpcRequest(
  deviceId: string,
  method: string,
  params?: any
): RpcRequest {
  validateRpc(method, params);

  return {
    id: crypto.randomUUID(),
    deviceId,
    method,
    params,
  };
}
