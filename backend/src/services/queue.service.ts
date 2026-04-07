import type { EmailJob } from "@prisma/client";
import { emailQueue } from "../lib/queue";

export const enqueueEmailJob = async (emailJob: Pick<EmailJob, "id" | "scheduledAt">) => {
  const delay = Math.max(0, emailJob.scheduledAt.getTime() - Date.now());

  await emailQueue.add(
    "send-email",
    { emailJobId: emailJob.id },
    {
      delay,
      jobId: emailJob.id,
    },
  );
};
