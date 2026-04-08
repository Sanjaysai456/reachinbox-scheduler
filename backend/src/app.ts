import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { env } from "./config/env";
import { apiRouter } from "./routes";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: false,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    name: "ReachInbox Scheduler API",
    health: "/api/health",
  });
});

app.use("/api", apiRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      issues: error.flatten(),
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  console.error(error);
  res.status(500).json({ message });
});
