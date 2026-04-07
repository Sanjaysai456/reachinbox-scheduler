import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const loginWithGoogle = async (idToken: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || !payload.name) {
    throw new Error("Unable to verify Google identity.");
  }

  return prisma.user.upsert({
    where: { googleId: payload.sub },
    update: {
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture ?? null,
    },
    create: {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture ?? null,
    },
  });
};
