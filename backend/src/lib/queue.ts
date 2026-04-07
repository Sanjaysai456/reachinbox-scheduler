import { Queue } from "bullmq";
import { env } from "../config/env";
import { createRedisConnection } from "./redis";

export const emailQueue = new Queue(env.QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 500,
    removeOnFail: 500,
  },
});

export type EmailQueuePayload = {
  emailJobId: string;
};
