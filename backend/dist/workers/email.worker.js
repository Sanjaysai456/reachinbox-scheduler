"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const env_1 = require("../config/env");
const redis_1 = require("../lib/redis");
const prisma_1 = require("../lib/prisma");
const mail_service_1 = require("../services/mail.service");
const sender_service_1 = require("../services/sender.service");
const connection = (0, redis_1.createRedisConnection)();
const startWorker = async () => {
    await prisma_1.prisma.$connect();
    await (0, sender_service_1.syncConfiguredSenders)();
    const worker = new bullmq_1.Worker(env_1.env.QUEUE_NAME, async (job) => (0, mail_service_1.sendEmailJob)(job.data.emailJobId), {
        connection,
        concurrency: env_1.env.WORKER_CONCURRENCY,
    });
    worker.on("completed", (job) => {
        console.log(`Email job ${job.id} completed.`);
    });
    worker.on("failed", (job, error) => {
        console.error(`Email job ${job?.id ?? "unknown"} failed.`, error);
    });
    console.log(`Email worker started with concurrency ${env_1.env.WORKER_CONCURRENCY}.`);
};
startWorker().catch(async (error) => {
    console.error("Failed to start worker", error);
    await prisma_1.prisma.$disconnect();
    process.exit(1);
});
