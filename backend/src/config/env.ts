import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const senderSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  fromName: z.string().min(1).optional(),
  smtpHost: z.string().min(1),
  smtpPort: z.number().int().positive(),
  smtpUser: z.string().min(1),
  smtpPass: z.string().min(1),
  secure: z.boolean().optional().default(false),
});

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  FRONTEND_URL: z.url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  GOOGLE_CLIENT_ID: z.string().min(1),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  DEFAULT_DELAY_BETWEEN_EMAILS_MS: z.coerce.number().int().positive().default(2000),
  DEFAULT_HOURLY_LIMIT: z.coerce.number().int().positive().default(120),
  QUEUE_NAME: z.string().min(1).default("email-send"),
  SMTP_SENDERS_JSON: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

let rawSenders: unknown;

try {
  rawSenders = JSON.parse(env.SMTP_SENDERS_JSON);
} catch {
  console.error("SMTP_SENDERS_JSON must be valid JSON.");
  process.exit(1);
}

const parsedSenders = z.array(senderSchema).safeParse(rawSenders);

if (!parsedSenders.success || parsedSenders.data.length === 0) {
  console.error("SMTP_SENDERS_JSON must contain at least one valid sender.");
  process.exit(1);
}

export const configuredSenders = parsedSenders.data;

export type ConfiguredSender = (typeof configuredSenders)[number];
