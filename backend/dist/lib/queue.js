"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailQueue = void 0;
const bullmq_1 = require("bullmq");
const env_1 = require("../config/env");
const redis_1 = require("./redis");
exports.emailQueue = new bullmq_1.Queue(env_1.env.QUEUE_NAME, {
    connection: (0, redis_1.createRedisConnection)(),
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 500,
        removeOnFail: 500,
    },
});
