// Sends mail via the Gmail REST API over plain HTTPS instead of SMTP — Render
// blocks outbound SMTP entirely (confirmed: ENETUNREACH and ETIMEDOUT on
// every port/IP-family combination tried), but HTTPS is never port-blocked.
// Auth is OAuth2 with a refresh token. Because the OAuth consent screen is
// in Google's "Testing" mode (no app-verification review needed for the
// sensitive gmail.send scope), that refresh token expires after ~7 days —
// see mongo-proxy/README.md for the couple-minute renewal steps.
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

let cachedToken = null; // { accessToken, expiresAt }

async function getAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to refresh Google access token (${response.status}): ${body.slice(0, 300)}`,
    );
  }

  const data = await response.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.accessToken;
}

function encodeHeaderValue(value) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

function base64url(input) {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildRawMessage({ from, to, subject, text, html }) {
  const boundary = `mishaeyecare_${Date.now()}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeaderValue(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf-8").toString("base64"),
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf-8").toString("base64"),
    "",
    `--${boundary}--`,
    "",
  ];
  return lines.join("\r\n");
}

export async function sendMail({ to, subject, text, html }) {
  const user = process.env.GMAIL_USER;
  if (!user) throw new Error("Missing GMAIL_USER");

  const accessToken = await getAccessToken();
  const raw = base64url(
    buildRawMessage({ from: `Misha Eye Care & Optical <${user}>`, to, subject, text, html }),
  );

  const response = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail API send failed (${response.status}): ${body.slice(0, 300)}`);
  }
}
