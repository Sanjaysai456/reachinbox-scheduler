"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = exports.listSentEmails = exports.listScheduledEmails = exports.scheduleEmailBatch = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const queue_service_1 = require("./queue.service");
const slot_reservation_service_1 = require("./slot-reservation.service");
const sender_service_1 = require("./sender.service");
const scheduleEmailBatch = async ({ userId, subject, body, recipients, startTime, delayBetweenMs, hourlyLimit, }) => {
    const sender = await (0, sender_service_1.pickSenderForCampaign)();
    const campaign = await prisma_1.prisma.campaign.create({
        data: {
            userId,
            senderId: sender.id,
            subject,
            body,
            startTime,
            delayBetweenMs,
            hourlyLimit,
            totalRecipients: recipients.length,
        },
    });
    const createdJobs = [];
    for (const recipientEmail of recipients) {
        const slot = await (0, slot_reservation_service_1.reserveEmailSlot)({
            senderId: sender.id,
            desiredAt: startTime.getTime(),
            delayMs: delayBetweenMs,
            hourlyLimit,
        });
        const emailJob = await prisma_1.prisma.emailJob.create({
            data: {
                campaignId: campaign.id,
                senderId: sender.id,
                recipientEmail,
                subject,
                body,
                scheduledAt: slot.scheduledAt,
                status: client_1.EmailStatus.SCHEDULED,
            },
            select: {
                id: true,
                scheduledAt: true,
            },
        });
        createdJobs.push(emailJob);
    }
    await Promise.all(createdJobs.map((job) => (0, queue_service_1.enqueueEmailJob)(job)));
    return {
        campaignId: campaign.id,
        sender: {
            id: sender.id,
            name: sender.name,
            email: sender.email,
        },
        totalRecipients: recipients.length,
        firstScheduledAt: createdJobs[0]?.scheduledAt ?? startTime,
        lastScheduledAt: createdJobs.at(-1)?.scheduledAt ?? startTime,
    };
};
exports.scheduleEmailBatch = scheduleEmailBatch;
const listScheduledEmails = async (userId) => prisma_1.prisma.emailJob.findMany({
    where: {
        campaign: { userId },
        status: client_1.EmailStatus.SCHEDULED,
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    select: {
        id: true,
        recipientEmail: true,
        subject: true,
        scheduledAt: true,
        status: true,
        campaignId: true,
        campaign: {
            select: {
                sender: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        },
    },
});
exports.listScheduledEmails = listScheduledEmails;
const listSentEmails = async (userId) => prisma_1.prisma.emailJob.findMany({
    where: {
        campaign: { userId },
        status: { in: [client_1.EmailStatus.SENT, client_1.EmailStatus.FAILED] },
    },
    orderBy: [{ sentAt: "desc" }, { failedAt: "desc" }, { updatedAt: "desc" }],
    select: {
        id: true,
        recipientEmail: true,
        subject: true,
        sentAt: true,
        failedAt: true,
        status: true,
        errorMessage: true,
        etherealPreviewUrl: true,
        campaignId: true,
        campaign: {
            select: {
                sender: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        },
    },
});
exports.listSentEmails = listSentEmails;
const getDashboardSummary = async (userId) => {
    const [scheduled, sent, failed, totalCampaigns] = await Promise.all([
        prisma_1.prisma.emailJob.count({
            where: {
                campaign: { userId },
                status: client_1.EmailStatus.SCHEDULED,
            },
        }),
        prisma_1.prisma.emailJob.count({
            where: {
                campaign: { userId },
                status: client_1.EmailStatus.SENT,
            },
        }),
        prisma_1.prisma.emailJob.count({
            where: {
                campaign: { userId },
                status: client_1.EmailStatus.FAILED,
            },
        }),
        prisma_1.prisma.campaign.count({
            where: {
                userId,
            },
        }),
    ]);
    return {
        scheduled,
        sent,
        failed,
        totalCampaigns,
    };
};
exports.getDashboardSummary = getDashboardSummary;
