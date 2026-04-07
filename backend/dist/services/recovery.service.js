"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverScheduledJobs = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const queue_service_1 = require("./queue.service");
const recoverScheduledJobs = async () => {
    const pendingJobs = await prisma_1.prisma.emailJob.findMany({
        where: {
            status: client_1.EmailStatus.SCHEDULED,
        },
        select: {
            id: true,
            scheduledAt: true,
        },
        orderBy: {
            scheduledAt: "asc",
        },
    });
    await Promise.all(pendingJobs.map((job) => (0, queue_service_1.enqueueEmailJob)(job)));
    return pendingJobs.length;
};
exports.recoverScheduledJobs = recoverScheduledJobs;
