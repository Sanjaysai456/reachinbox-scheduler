import { Router } from "express";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import {
  getDashboardSummary,
  listScheduledEmails,
  listSentEmails,
  scheduleEmailBatch,
} from "../services/email-scheduler.service";
import { scheduleEmailSchema } from "../validation/email";

export const emailRouter = Router();

emailRouter.use(requireAuth);

emailRouter.post("/schedule", async (req, res, next) => {
  try {
    const payload = scheduleEmailSchema.parse(req.body);
    const recipients = [...new Set(payload.recipients.map((email) => email.toLowerCase()))];
    const response = await scheduleEmailBatch({
      userId: req.user!.id,
      subject: payload.subject,
      body: payload.body,
      recipients,
      startTime: new Date(payload.startTime),
      delayBetweenMs: Math.max(payload.delayBetweenMs, env.DEFAULT_DELAY_BETWEEN_EMAILS_MS),
      hourlyLimit: Math.min(payload.hourlyLimit, env.DEFAULT_HOURLY_LIMIT),
    });

    res.status(201).json({
      message: `Scheduled ${recipients.length} emails successfully.`,
      ...response,
    });
  } catch (error) {
    next(error);
  }
});

emailRouter.get("/scheduled", async (req, res, next) => {
  try {
    const items = await listScheduledEmails(req.user!.id);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

emailRouter.get("/history", async (req, res, next) => {
  try {
    const items = await listSentEmails(req.user!.id);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

emailRouter.get("/summary", async (req, res, next) => {
  try {
    const summary = await getDashboardSummary(req.user!.id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});
