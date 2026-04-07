import nodemailer from "nodemailer";

const count = Number(process.argv[2] ?? "2");

const main = async () => {
  const senders = [];

  for (let index = 0; index < count; index += 1) {
    const account = await nodemailer.createTestAccount();

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
