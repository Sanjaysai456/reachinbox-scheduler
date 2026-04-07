"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const zod_1 = require("zod");
const env_1 = require("./config/env");
const routes_1 = require("./routes");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin: env_1.env.FRONTEND_URL,
    credentials: false,
}));
exports.app.use((0, helmet_1.default)());
exports.app.use(express_1.default.json({ limit: "2mb" }));
exports.app.use((0, morgan_1.default)("dev"));
exports.app.get("/", (_req, res) => {
    res.json({
        name: "ReachInbox Scheduler API",
        health: "/api/health",
    });
});
exports.app.use("/api", routes_1.apiRouter);
exports.app.use((error, _req, res, _next) => {
    if (error instanceof zod_1.ZodError) {
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
