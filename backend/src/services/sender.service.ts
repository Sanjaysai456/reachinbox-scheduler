import type { Sender } from "@prisma/client";
import { configuredSenders } from "../config/env";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

const ROUND_ROBIN_KEY = "reachinbox:sender:round-robin";

export const syncConfiguredSenders = async () => {
  const configuredEmails = configuredSenders.map((sender) => sender.email);

  await prisma.sender.updateMany({
    where: {
      email: {
        notIn: configuredEmails,
      },
      active: true,
    },
    data: {
      active: false,
    },
  });

  await Promise.all(
    configuredSenders.map((sender) =>
      prisma.sender.upsert({
        where: { email: sender.email },
        update: {
          name: sender.name,
          fromName: sender.fromName ?? sender.name,
          smtpHost: sender.smtpHost,
          smtpPort: sender.smtpPort,
          smtpUser: sender.smtpUser,
          smtpPass: sender.smtpPass,
          secure: sender.secure ?? false,
          active: true,
        },
        create: {
          name: sender.name,
          email: sender.email,
          fromName: sender.fromName ?? sender.name,
          smtpHost: sender.smtpHost,
          smtpPort: sender.smtpPort,
          smtpUser: sender.smtpUser,
          smtpPass: sender.smtpPass,
          secure: sender.secure ?? false,
          active: true,
        },
      }),
    ),
  );
};

export const getActiveSenders = async () =>
  prisma.sender.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

export const pickSenderForCampaign = async (): Promise<Sender> => {
  const senders = await getActiveSenders();

  if (senders.length === 0) {
    throw new Error("No active SMTP senders are configured.");
  }

  const position = await redis.incr(ROUND_ROBIN_KEY);
  return senders[(position - 1) % senders.length];
};
