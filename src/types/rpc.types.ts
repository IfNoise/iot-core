// packages/mqtt-core/src/rpc-types.ts

import { rpcSchemas } from "../schemas/rpc-methods.schemas";

/**
 * Базовые типы для RPC механизма
 * Определяет структуры запросов, ответов и методов для MQTT и WebSocket RPC
 */

/**
 * Основная структура RPC запроса
 */
export interface RpcRequest {
  /** Уникальный идентификатор запроса */
  id: string;
  /** Идентификатор целевого устройства */
  deviceId: string;
  /** Название RPC метода для выполнения */
  method: string;
  /** Параметры для метода (опционально) */
  params?: any;
}

/**
 * Структура RPC ответа
 */
export interface RpcResponse {
  /** Идентификатор запроса (совпадает с RpcRequest.id) */
  id: string;
  /** Результат выполнения метода (при успехе) */
  result?: any;
  /** Информация об ошибке (при неудаче) */
  error?: {
    /** Код ошибки */
    code: number;
    /** Описание ошибки */
    message: string;
  };
}

/**
 * MQTT-специфичная структура RPC запроса с топиком
 */
export interface MqttRpcRequest {
  /** MQTT топик для отправки сообщения */
  topic: string;
  /** RPC сообщение */
  message: RpcRequest;
}

/**
 * Союзный тип всех доступных RPC методов
 * Используется для типобезопасности при валидации
 */
export type RpcMethod =
  | "turnOnLed"
  | "reboot"
  | "getSensors"
  | "getDeviceState"
  | "updateDevice"
  | "updateDiscreteTimer"
  | "updateAnalogTimer"
  | "updateDiscreteRegulator"
  | "updateAnalogRegulator"
  | "updateIrrigator";

/**
 * Союзный тип параметров для RPC методов
 * Параметры зависят от конкретного метода
 */
export type RpcMethodParams = any; // TODO: Типизировать под конкретные методы
