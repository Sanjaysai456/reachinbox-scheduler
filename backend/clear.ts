import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();
const redis = new Redis();

async function main() {
  console.log("Cleaning Database...");
  await prisma.emailJob.deleteMany();
  await prisma.campaign.deleteMany();
  console.log("Cleared all Emails & Campaigns from DB.");

  console.log("Flushing Redis Queues & Rate Limits...");
  await redis.flushall();
  console.log("Cleared BullMQ and Redis state.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });
