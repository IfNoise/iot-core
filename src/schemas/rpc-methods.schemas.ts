// packages/mqtt-core/src/rpc-methods.ts

import { z } from "zod";

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

  setThreshold: z.object({
    threshold: z.number().min(0).max(100),
  }),
} as const;
