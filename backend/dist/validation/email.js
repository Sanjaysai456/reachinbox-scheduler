"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleEmailSchema = exports.googleLoginSchema = void 0;
const zod_1 = require("zod");
exports.googleLoginSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1),
});
exports.scheduleEmailSchema = zod_1.z.object({
    subject: zod_1.z.string().trim().min(1).max(200),
    body: zod_1.z.string().trim().min(1).max(5000),
    recipients: zod_1.z.array(zod_1.z.email()).min(1).max(5000),
    startTime: zod_1.z.iso.datetime(),
    delayBetweenMs: zod_1.z.coerce.number().int().positive(),
    hourlyLimit: zod_1.z.coerce.number().int().positive(),
});
