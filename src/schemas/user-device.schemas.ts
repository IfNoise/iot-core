import { z } from "zod";

export const UserDeviceSchema = z.object({
  deviceId: z.string(),
  customName: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
