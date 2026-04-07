import { EmailStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { enqueueEmailJob } from "./queue.service";
import { reserveEmailSlot } from "./slot-reservation.service";
import { pickSenderForCampaign } from "./sender.service";

type ScheduleBatchInput = {
  userId: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: Date;
  delayBetweenMs: number;
  hourlyLimit: number;
};

export const scheduleEmailBatch = async ({
  userId,
  subject,
  body,
  recipients,
  startTime,
  delayBetweenMs,
  hourlyLimit,
}: ScheduleBatchInput) => {
  const sender = await pickSenderForCampaign();

  const campaign = await prisma.campaign.create({
    data: {
      userId,
      senderId: sender.id,
      subject,
      body,
      startTime,
      delayBetweenMs,
      hourlyLimit,
      totalRecipients: recipients.length,
    },
  });

  const createdJobs: { id: string; scheduledAt: Date }[] = [];

  for (const recipientEmail of recipients) {
    const slot = await reserveEmailSlot({
      senderId: sender.id,
      desiredAt: startTime.getTime(),
      delayMs: delayBetweenMs,
      hourlyLimit,
    });

    const emailJob = await prisma.emailJob.create({
      data: {
        campaignId: campaign.id,
        senderId: sender.id,
        recipientEmail,
        subject,
        body,
        scheduledAt: slot.scheduledAt,
        status: EmailStatus.SCHEDULED,
      },
      select: {
        id: true,
        scheduledAt: true,
      },
    });

    createdJobs.push(emailJob);
  }

  await Promise.all(createdJobs.map((job) => enqueueEmailJob(job)));

  return {
    campaignId: campaign.id,
    sender: {
      id: sender.id,
      name: sender.name,
      email: sender.email,
    },
    totalRecipients: recipients.length,
    firstScheduledAt: createdJobs[0]?.scheduledAt ?? startTime,
    lastScheduledAt: createdJobs.at(-1)?.scheduledAt ?? startTime,
  };
};

export const listScheduledEmails = async (userId: string) =>
  prisma.emailJob.findMany({
    where: {
      campaign: { userId },
      status: EmailStatus.SCHEDULED,
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      recipientEmail: true,
      subject: true,
      scheduledAt: true,
      status: true,
      campaignId: true,
      campaign: {
        select: {
          sender: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

export const listSentEmails = async (userId: string) =>
  prisma.emailJob.findMany({
    where: {
      campaign: { userId },
      status: { in: [EmailStatus.SENT, EmailStatus.FAILED] },
    },
    orderBy: [{ sentAt: "desc" }, { failedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      recipientEmail: true,
      subject: true,
      sentAt: true,
      failedAt: true,
      status: true,
      errorMessage: true,
      etherealPreviewUrl: true,
      campaignId: true,
      campaign: {
        select: {
          sender: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

export const getDashboardSummary = async (userId: string) => {
  const [scheduled, sent, failed, totalCampaigns] = await Promise.all([
    prisma.emailJob.count({
      where: {
        campaign: { userId },
        status: EmailStatus.SCHEDULED,
      },
    }),
    prisma.emailJob.count({
      where: {
        campaign: { userId },
        status: EmailStatus.SENT,
      },
    }),
    prisma.emailJob.count({
      where: {
        campaign: { userId },
        status: EmailStatus.FAILED,
      },
    }),
    prisma.campaign.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    scheduled,
    sent,
    failed,
    totalCampaigns,
  };
};
