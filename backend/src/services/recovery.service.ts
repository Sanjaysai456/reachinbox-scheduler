import { EmailStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { enqueueEmailJob } from "./queue.service";

export const recoverScheduledJobs = async () => {
  const pendingJobs = await prisma.emailJob.findMany({
    where: {
      status: EmailStatus.SCHEDULED,
    },
    select: {
      id: true,
      scheduledAt: true,
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  await Promise.all(pendingJobs.map((job) => enqueueEmailJob(job)));

  return pendingJobs.length;
};
