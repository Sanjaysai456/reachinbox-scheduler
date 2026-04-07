import nodemailer from "nodemailer";
import { EmailStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const transportCache = new Map<string, nodemailer.Transporter>();

const getTransporter = (senderId: string, smtpConfig: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}) => {
  const cached = transportCache.get(senderId);

  if (cached) {
    return cached;
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  transportCache.set(senderId, transporter);
  return transporter;
};

export const sendEmailJob = async (emailJobId: string) => {
  const emailJob = await prisma.emailJob.findUnique({
    where: { id: emailJobId },
    include: {
      sender: true,
    },
  });

  if (!emailJob) {
    throw new Error(`Email job ${emailJobId} was not found.`);
  }

  if (emailJob.status === EmailStatus.SENT) {
    return {
      skipped: true,
      reason: "already-sent",
    };
  }

  if (emailJob.status === EmailStatus.FAILED) {
    return {
      skipped: true,
      reason: "already-failed",
    };
  }

  const transporter = getTransporter(emailJob.senderId, {
    host: emailJob.sender.smtpHost,
    port: emailJob.sender.smtpPort,
    secure: emailJob.sender.secure,
    user: emailJob.sender.smtpUser,
    pass: emailJob.sender.smtpPass,
  });

  try {
    const info = await transporter.sendMail({
      from: `"${emailJob.sender.fromName ?? emailJob.sender.name}" <${emailJob.sender.email}>`,
      to: emailJob.recipientEmail,
      subject: emailJob.subject,
      text: emailJob.body,
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;">${emailJob.body}</pre>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
        providerMessageId: info.messageId,
        etherealPreviewUrl: previewUrl,
        errorMessage: null,
      },
    });

    return {
      skipped: false,
      previewUrl,
      messageId: info.messageId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown send failure";

    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: EmailStatus.FAILED,
        failedAt: new Date(),
        errorMessage: message,
      },
    });

    throw error;
  }
};
