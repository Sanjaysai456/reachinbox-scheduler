"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailJob = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const transportCache = new Map();
const getTransporter = (senderId, smtpConfig) => {
    const cached = transportCache.get(senderId);
    if (cached) {
        return cached;
    }
    const transporter = nodemailer_1.default.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass,
        },
    });
    transportCache.set(senderId, transporter);
    return transporter;
};
const sendEmailJob = async (emailJobId) => {
    const emailJob = await prisma_1.prisma.emailJob.findUnique({
        where: { id: emailJobId },
        include: {
            sender: true,
        },
    });
    if (!emailJob) {
        throw new Error(`Email job ${emailJobId} was not found.`);
    }
    if (emailJob.status === client_1.EmailStatus.SENT) {
        return {
            skipped: true,
            reason: "already-sent",
        };
    }
    if (emailJob.status === client_1.EmailStatus.FAILED) {
        return {
            skipped: true,
            reason: "already-failed",
        };
    }
    const transporter = getTransporter(emailJob.senderId, {
        host: emailJob.sender.smtpHost,
        port: emailJob.sender.smtpPort,
        secure: emailJob.sender.secure,
        user: emailJob.sender.smtpUser,
        pass: emailJob.sender.smtpPass,
    });
    try {
        const info = await transporter.sendMail({
            from: `"${emailJob.sender.fromName ?? emailJob.sender.name}" <${emailJob.sender.email}>`,
            to: emailJob.recipientEmail,
            subject: emailJob.subject,
            text: emailJob.body,
            html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;">${emailJob.body}</pre>`,
        });
        const previewUrl = nodemailer_1.default.getTestMessageUrl(info) || null;
        await prisma_1.prisma.emailJob.update({
            where: { id: emailJobId },
            data: {
                status: client_1.EmailStatus.SENT,
                sentAt: new Date(),
                providerMessageId: info.messageId,
                etherealPreviewUrl: previewUrl,
                errorMessage: null,
            },
        });
        return {
            skipped: false,
            previewUrl,
            messageId: info.messageId,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown send failure";
        await prisma_1.prisma.emailJob.update({
            where: { id: emailJobId },
            data: {
                status: client_1.EmailStatus.FAILED,
                failedAt: new Date(),
                errorMessage: message,
            },
        });
        throw error;
    }
};
exports.sendEmailJob = sendEmailJob;
