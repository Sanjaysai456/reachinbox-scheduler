"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRouter = void 0;
const express_1 = require("express");
const env_1 = require("../config/env");
const auth_1 = require("../middleware/auth");
const email_scheduler_service_1 = require("../services/email-scheduler.service");
const email_1 = require("../validation/email");
exports.emailRouter = (0, express_1.Router)();
exports.emailRouter.use(auth_1.requireAuth);
exports.emailRouter.post("/schedule", async (req, res, next) => {
    try {
        const payload = email_1.scheduleEmailSchema.parse(req.body);
        const recipients = [...new Set(payload.recipients.map((email) => email.toLowerCase()))];
        const response = await (0, email_scheduler_service_1.scheduleEmailBatch)({
            userId: req.user.id,
            subject: payload.subject,
            body: payload.body,
            recipients,
            startTime: new Date(payload.startTime),
            delayBetweenMs: Math.max(payload.delayBetweenMs, env_1.env.DEFAULT_DELAY_BETWEEN_EMAILS_MS),
            hourlyLimit: Math.min(payload.hourlyLimit, env_1.env.DEFAULT_HOURLY_LIMIT),
        });
        res.status(201).json({
            message: `Scheduled ${recipients.length} emails successfully.`,
            ...response,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.emailRouter.get("/scheduled", async (req, res, next) => {
    try {
        const items = await (0, email_scheduler_service_1.listScheduledEmails)(req.user.id);
        res.json({ items });
    }
    catch (error) {
        next(error);
    }
});
exports.emailRouter.get("/history", async (req, res, next) => {
    try {
        const items = await (0, email_scheduler_service_1.listSentEmails)(req.user.id);
        res.json({ items });
    }
    catch (error) {
        next(error);
    }
});
exports.emailRouter.get("/summary", async (req, res, next) => {
    try {
        const summary = await (0, email_scheduler_service_1.getDashboardSummary)(req.user.id);
        res.json(summary);
    }
    catch (error) {
        next(error);
    }
});
