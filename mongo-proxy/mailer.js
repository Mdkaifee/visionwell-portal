import dns from "node:dns/promises";
import nodemailer from "nodemailer";

let transporter;

// nodemailer does its own DNS resolution internally (tries A records, only
// falls back to AAAA if none come back) and ignores a plain `family` option
// — that's why Render still handed it an IPv6 address it can't route to
// (ENETUNREACH). Resolving the A record ourselves and passing the literal
// IPv4 address as `host` makes nodemailer skip its resolver entirely
// (it no-ops once the host is already an IP); `servername` keeps TLS
// certificate validation pinned to the real hostname.
async function resolveGmailSmtpIPv4() {
  try {
    const addresses = await dns.resolve4("smtp.gmail.com");
    return addresses[0] ?? null;
  } catch {
    return null;
  }
}

async function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER / GMAIL_APP_PASSWORD");
  }
  if (!transporter) {
    const ipv4 = await resolveGmailSmtpIPv4();
    transporter = nodemailer.createTransport({
      host: ipv4 ?? "smtp.gmail.com",
      servername: "smtp.gmail.com",
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
  const transport = await getTransporter();
  await transport.sendMail({
    from: `Misha Eye Care & Optical <${user}>`,
    to,
    subject,
    text,
    html,
  });
}
