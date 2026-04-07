"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickSenderForCampaign = exports.getActiveSenders = exports.syncConfiguredSenders = void 0;
const env_1 = require("../config/env");
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const ROUND_ROBIN_KEY = "reachinbox:sender:round-robin";
const syncConfiguredSenders = async () => {
    const configuredEmails = env_1.configuredSenders.map((sender) => sender.email);
    await prisma_1.prisma.sender.updateMany({
        where: {
            email: {
                notIn: configuredEmails,
            },
            active: true,
        },
        data: {
            active: false,
        },
    });
    await Promise.all(env_1.configuredSenders.map((sender) => prisma_1.prisma.sender.upsert({
        where: { email: sender.email },
        update: {
            name: sender.name,
            fromName: sender.fromName ?? sender.name,
            smtpHost: sender.smtpHost,
            smtpPort: sender.smtpPort,
            smtpUser: sender.smtpUser,
            smtpPass: sender.smtpPass,
            secure: sender.secure ?? false,
            active: true,
        },
        create: {
            name: sender.name,
            email: sender.email,
            fromName: sender.fromName ?? sender.name,
            smtpHost: sender.smtpHost,
            smtpPort: sender.smtpPort,
            smtpUser: sender.smtpUser,
            smtpPass: sender.smtpPass,
            secure: sender.secure ?? false,
            active: true,
        },
    })));
};
exports.syncConfiguredSenders = syncConfiguredSenders;
const getActiveSenders = async () => prisma_1.prisma.sender.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
});
exports.getActiveSenders = getActiveSenders;
const pickSenderForCampaign = async () => {
    const senders = await (0, exports.getActiveSenders)();
    if (senders.length === 0) {
        throw new Error("No active SMTP senders are configured.");
    }
    const position = await redis_1.redis.incr(ROUND_ROBIN_KEY);
    return senders[(position - 1) % senders.length];
};
exports.pickSenderForCampaign = pickSenderForCampaign;
