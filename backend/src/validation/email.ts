import { z } from "zod";

export const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

export const scheduleEmailSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  recipients: z.array(z.email()).min(1).max(5000),
  startTime: z.iso.datetime(),
  delayBetweenMs: z.coerce.number().int().positive(),
  hourlyLimit: z.coerce.number().int().positive(),
});
