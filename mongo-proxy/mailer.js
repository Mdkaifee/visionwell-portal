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
      service: "gmail",
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
