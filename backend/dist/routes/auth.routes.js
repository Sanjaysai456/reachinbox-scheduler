"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const google_auth_service_1 = require("../services/google-auth.service");
const jwt_1 = require("../auth/jwt");
const email_1 = require("../validation/email");
const auth_1 = require("../middleware/auth");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/google", async (req, res, next) => {
    try {
        const { idToken } = email_1.googleLoginSchema.parse(req.body);
        const user = await (0, google_auth_service_1.loginWithGoogle)(idToken);
        const token = (0, jwt_1.signAccessToken)({ userId: user.id });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.authRouter.get("/me", auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
        },
    });
});
