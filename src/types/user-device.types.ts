import { z } from "zod";
import { UserDeviceSchema } from "../schemas/user-device.schemas";

export type UserDevice = z.infer<typeof UserDeviceSchema>;
