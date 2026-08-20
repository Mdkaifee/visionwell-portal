import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER / GMAIL_APP_PASSWORD");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      // Explicit host/port + STARTTLS on 587 rather than the "gmail" preset
      // (which defaults to SSL on 465) — some hosts block 465 outbound while
      // still allowing 587.
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      // Some hosts throttle/block outbound SMTP; fail fast instead of hanging
      // the request (and the doctor's UI) for minutes.
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const user = process.env.GMAIL_USER;
  const transport = getTransporter();
  await transport.sendMail({
    from: `Misha Eye Care & Optical <${user}>`,
    to,
    subject,
    text,
    html,
  });
}
