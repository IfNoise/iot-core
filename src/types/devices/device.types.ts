import { z } from "zod";
import {
  CreateDeviceSchema,
  DeviceInternalStateSchema,
  DeviceSchema,
  UpdateDeviceSchema,
} from "../../schemas/devices/device.schema";

/**
 * Типы
 */
export type DeviceInternalState = z.infer<typeof DeviceInternalStateSchema>;
export type Device = z.infer<typeof DeviceSchema>;
export type CreateDeviceDto = z.infer<typeof CreateDeviceSchema>;
export type UpdateDeviceDto = z.infer<typeof UpdateDeviceSchema>;
