// packages/mqtt-core/src/rpc-methods.ts

import { z } from "zod";
import {
  UpdateAnalogRegulatorSchema,
  UpdateAnalogTimerSchema,
  UpdateDeviceSchema,
  UpdateDiscreteRegulatorSchema,
  UpdateDiscreteTimerSchema,
  UpdateIrrigatorSchema,
} from "./devices";

/**
 * Схема валидации для включения/выключения LED
 * Используется для метода 'turnOnLed'
 */
export const TurnOnLedSchema = z.object({
  /** Включить (true) или выключить (false) LED */
  on: z.boolean(),
});

/**
 * Схема валидации для установки порогового значения
 * Используется для метода 'setThreshold'
 */
export const SetThresholdSchema = z.object({
  /** Пороговое значение (число) */
  threshold: z.number(),
});

/**
 * Схема валидации для получения состояния устройства
 * Используется для метода 'getDeviceState'
 * Не требует параметров
 */
export const GetDeviceStateSchema = z.object({});

/**
 * Схема валидации для получения данных сенсоров
 * Используется для метода 'getSensors'
 * Не требует параметров
 */
export const GetSensorsSchema = z.object({});

/**
 * Схема валидации для перезагрузки устройства
 * Используется для метода 'reboot'
 * Не требует параметров
 */
export const RebootSchema = z.object({});

/**
 * Объект со всеми схемами RPC методов
 * Ключи соответствуют названиям методов, значения - Zod схемы для валидации
 *
 * @example
 * ```typescript
 * // Валидация параметров метода
 * const schema = rpcSchemas['turnOnLed'];
 * const validParams = schema.parse({ on: true });
 * ```
 */
export const rpcSchemas = {
  turnOnLed: TurnOnLedSchema,
  setThreshold: SetThresholdSchema,
  getDeviceState: GetDeviceStateSchema,
  getSensors: GetSensorsSchema,
  reboot: RebootSchema,
  updateDevice: UpdateDeviceSchema,
  updateDiscreteTimer: UpdateDiscreteTimerSchema,
  updateAnalogTimer: UpdateAnalogTimerSchema,
  updateDiscreteRegulator: UpdateDiscreteRegulatorSchema,
  updateAnalogRegulator: UpdateAnalogRegulatorSchema,
  updateIrrigator: UpdateIrrigatorSchema,
} as const;

/**
 * Тип для извлечения названий RPC методов из объекта схем
 */
export type RpcMethodName = keyof typeof rpcSchemas;
