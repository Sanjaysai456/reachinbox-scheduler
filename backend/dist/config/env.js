"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuredSenders = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const senderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.email(),
    fromName: zod_1.z.string().min(1).optional(),
    smtpHost: zod_1.z.string().min(1),
    smtpPort: zod_1.z.number().int().positive(),
    smtpUser: zod_1.z.string().min(1),
    smtpPass: zod_1.z.string().min(1),
    secure: zod_1.z.boolean().optional().default(false),
});
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().positive().default(8080),
    FRONTEND_URL: zod_1.z.url().default("http://localhost:5173"),
    DATABASE_URL: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(16),
    GOOGLE_CLIENT_ID: zod_1.z.string().min(1),
    WORKER_CONCURRENCY: zod_1.z.coerce.number().int().positive().default(5),
    DEFAULT_DELAY_BETWEEN_EMAILS_MS: zod_1.z.coerce.number().int().positive().default(2000),
    DEFAULT_HOURLY_LIMIT: zod_1.z.coerce.number().int().positive().default(120),
    QUEUE_NAME: zod_1.z.string().min(1).default("email-send"),
    SMTP_SENDERS_JSON: zod_1.z.string().min(1),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid backend environment variables", parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
let rawSenders;
try {
    rawSenders = JSON.parse(exports.env.SMTP_SENDERS_JSON);
}
catch {
    console.error("SMTP_SENDERS_JSON must be valid JSON.");
    process.exit(1);
}
const parsedSenders = zod_1.z.array(senderSchema).safeParse(rawSenders);
if (!parsedSenders.success || parsedSenders.data.length === 0) {
    console.error("SMTP_SENDERS_JSON must contain at least one valid sender.");
    process.exit(1);
}
exports.configuredSenders = parsedSenders.data;
