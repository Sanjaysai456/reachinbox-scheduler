import { Worker } from "bullmq";
import { env } from "../config/env";
import { createRedisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { sendEmailJob } from "../services/mail.service";
import { syncConfiguredSenders } from "../services/sender.service";

const connection = createRedisConnection();

const startWorker = async () => {
  await prisma.$connect();
  await syncConfiguredSenders();

  const worker = new Worker(
    env.QUEUE_NAME,
    async (job) => sendEmailJob(job.data.emailJobId),
    {
      connection,
      concurrency: env.WORKER_CONCURRENCY,
    },
  );

  worker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed.`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Email job ${job?.id ?? "unknown"} failed.`, error);
  });

  console.log(`Email worker started with concurrency ${env.WORKER_CONCURRENCY}.`);
};

startWorker().catch(async (error) => {
  console.error("Failed to start worker", error);
  await prisma.$disconnect();
  process.exit(1);
});
