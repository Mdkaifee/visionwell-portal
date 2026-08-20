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
