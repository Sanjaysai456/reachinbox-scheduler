"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueEmailJob = void 0;
const queue_1 = require("../lib/queue");
const enqueueEmailJob = async (emailJob) => {
    const delay = Math.max(0, emailJob.scheduledAt.getTime() - Date.now());
    await queue_1.emailQueue.add("send-email", { emailJobId: emailJob.id }, {
        delay,
        jobId: emailJob.id,
    });
};
exports.enqueueEmailJob = enqueueEmailJob;
