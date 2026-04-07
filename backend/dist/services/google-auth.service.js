"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithGoogle = void 0;
const google_auth_library_1 = require("google-auth-library");
const prisma_1 = require("../lib/prisma");
const env_1 = require("../config/env");
const googleClient = new google_auth_library_1.OAuth2Client(env_1.env.GOOGLE_CLIENT_ID);
const loginWithGoogle = async (idToken) => {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env_1.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.name) {
        throw new Error("Unable to verify Google identity.");
    }
    return prisma_1.prisma.user.upsert({
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
exports.loginWithGoogle = loginWithGoogle;
