import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { recoverScheduledJobs } from "./services/recovery.service";
import { syncConfiguredSenders } from "./services/sender.service";

const start = async () => {
  await prisma.$connect();
  await syncConfiguredSenders();
  const recoveredJobs = await recoverScheduledJobs();

  app.listen(env.PORT, () => {
    console.log(`API server listening on http://localhost:${env.PORT}`);
    console.log(`Recovered ${recoveredJobs} scheduled job(s) into BullMQ.`);
  });
};

start().catch(async (error) => {
  console.error("Failed to start API server", error);
  await prisma.$disconnect();
  process.exit(1);
});
