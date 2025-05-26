// schemas/devices/device.schema.ts
import { z } from "zod";
import { DiscreteTimerSchema, AnalogTimerSchema } from "./timer.schema";
import {
  DiscreteRegulatorSchema,
  AnalogRegulatorSchema,
} from "./regulator.schema";
import { IrrigatorSchema } from "./irrigator.schema";
import { SensorSchema } from "./sensor.schema";
import {
  DiscreteInputSchema,
  AnalogInputSchema,
  DiscreteOutputSchema,
  AnalogOutputSchema,
} from "./io.schema";

/**
 * Схемы объединений компонентов устройства
 */
export const TimerSchema = z.union([DiscreteTimerSchema, AnalogTimerSchema]);
export const RegulatorSchema = z.union([
  DiscreteRegulatorSchema,
  AnalogRegulatorSchema,
]);
export const InputSchema = z.union([DiscreteInputSchema, AnalogInputSchema]);
export const OutputSchema = z.union([DiscreteOutputSchema, AnalogOutputSchema]);

/**
 * Перечисления
 */
export const DeviceTypeEnum = z.enum([
  "sensor",
  "actuator",
  "controller",
  "custom",
]);
export const DeviceStatusEnum = z.enum(["online", "offline"]);

/**
 * Схема внутреннего состояния устройства
 */
export const DeviceInternalStateSchema = z
  .object({
    timers: z.array(TimerSchema).describe("Список таймеров устройства"),
    regulators: z
      .array(RegulatorSchema)
      .describe("Список регуляторов устройства"),
    irrigators: z
      .array(IrrigatorSchema)
      .describe("Список ирригаторов устройства"),
    sensors: z.array(SensorSchema).describe("Список сенсоров устройства"),
    inputs: z.array(InputSchema).describe("Список входов устройства"),
    outputs: z.array(OutputSchema).describe("Список выходов устройства"),
    actuators: z
      .record(z.boolean())
      .describe("Состояние актуаторов устройства"),
  })
  .strict();

/**
 * Базовая схема устройства
 */
export const DeviceSchema = z
  .object({
    deviceId: z.string().describe("Уникальный ID устройства"),
    userId: z.string().describe("ID владельца устройства"),
    name: z.string().describe("Название устройства"),
    type: DeviceTypeEnum.describe("Тип устройства"),
    status: DeviceStatusEnum.default("offline").describe("Статус устройства"),
    lastSeenAt: z
      .preprocess((v) => new Date(v as string), z.date())
      .describe("Время последней активности"),
    firmwareVersion: z.string().optional().describe("Версия прошивки"),
    internalState: DeviceInternalStateSchema.optional().describe(
      "Внутреннее состояние устройства"
    ),
  })
  .strict();

/**
 * DTO: Create
 */
export const CreateDeviceSchema = DeviceSchema.omit({
  deviceId: true,
  status: true,
  lastSeenAt: true,
  internalState: true,
});

/**
 * DTO: Update
 */
export const UpdateDeviceSchema = DeviceSchema.partial().omit({
  deviceId: true,
  userId: true,
});
