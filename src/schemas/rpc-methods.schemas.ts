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
 * Схемы для RPC методов
 *
 * Эти схемы описывают параметры, которые могут быть переданы в RPC методы.
 * Используются для валидации входящих данных и обеспечения типизации.
 */
export const rpcSchemas = {
  turnOnLed: z.object({
    on: z.boolean(),
  }),
  reboot: z.void(),
  getSensors: z.void(),
  getDeviceState: z.void(),
  updateDevice: UpdateDeviceSchema,

  updateDiscreteTimer: UpdateDiscreteTimerSchema,
  updateAnalogTimer: UpdateAnalogTimerSchema,
  updateDiscreteRegulator: UpdateDiscreteRegulatorSchema,
  updateAnalogRegulator: UpdateAnalogRegulatorSchema,
  updateIrrigator: UpdateIrrigatorSchema,
} as const;
