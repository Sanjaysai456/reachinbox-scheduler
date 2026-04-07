export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type EmailSummary = {
  scheduled: number;
  sent: number;
  failed: number;
  totalCampaigns: number;
};

export type ScheduledEmail = {
  id: string;
  recipientEmail: string;
  subject: string;
  scheduledAt: string;
  status: "SCHEDULED";
  campaignId: string;
  campaign: {
    sender: {
      name: string;
      email: string;
    };
  };
};

export type SentEmail = {
  id: string;
  recipientEmail: string;
  subject: string;
  sentAt: string | null;
  failedAt: string | null;
  status: "SENT" | "FAILED";
  errorMessage: string | null;
  etherealPreviewUrl: string | null;
  campaignId: string;
  campaign: {
    sender: {
      name: string;
      email: string;
    };
  };
};
