"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const prisma_1 = require("./lib/prisma");
const recovery_service_1 = require("./services/recovery.service");
const sender_service_1 = require("./services/sender.service");
const start = async () => {
    await prisma_1.prisma.$connect();
    await (0, sender_service_1.syncConfiguredSenders)();
    const recoveredJobs = await (0, recovery_service_1.recoverScheduledJobs)();
    app_1.app.listen(env_1.env.PORT, () => {
        console.log(`API server listening on http://localhost:${env_1.env.PORT}`);
        console.log(`Recovered ${recoveredJobs} scheduled job(s) into BullMQ.`);
    });
};
start().catch(async (error) => {
    console.error("Failed to start API server", error);
    await prisma_1.prisma.$disconnect();
    process.exit(1);
});
