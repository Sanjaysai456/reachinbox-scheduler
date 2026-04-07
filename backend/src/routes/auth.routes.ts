import { Router } from "express";
import { loginWithGoogle } from "../services/google-auth.service";
import { signAccessToken } from "../auth/jwt";
import { googleLoginSchema } from "../validation/email";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/google", async (req, res, next) => {
  try {
    const { idToken } = googleLoginSchema.parse(req.body);
    const user = await loginWithGoogle(idToken);
    const token = signAccessToken({ userId: user.id });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = req.user!;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  });
});
