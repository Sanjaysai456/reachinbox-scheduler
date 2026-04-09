import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { env } from "./config/env";
import { apiRouter } from "./routes";

export const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://reachinbox-scheduler-jade.vercel.app",
    ],
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

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
