"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const count = Number(process.argv[2] ?? "2");
const main = async () => {
    const senders = [];
    for (let index = 0; index < count; index += 1) {
        const account = await nodemailer_1.default.createTestAccount();
        senders.push({
            name: `Sender ${index + 1}`,
            email: account.user,
            fromName: `ReachInbox Sender ${index + 1}`,
            smtpHost: account.smtp.host,
            smtpPort: account.smtp.port,
            smtpUser: account.user,
            smtpPass: account.pass,
            secure: account.smtp.secure,
        });
    }
    console.log(JSON.stringify(senders, null, 2));
};
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
