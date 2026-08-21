# mongo-proxy

A small always-on Express service that is the _only_ thing allowed to talk to MongoDB directly.
The main site (deployed on Cloudflare Workers via Lovable) calls this over plain HTTPS, because the
native MongoDB driver does not work reliably from Cloudflare Workers.

Every route except `GET /health` requires header `x-proxy-secret: <PROXY_SECRET>`. This service is
never called from a browser — only from the main app's server code — so that single shared secret
is the whole authorization model. Keep it secret.

It also sends appointment-status emails (`POST /send-email`, `mailer.js`) through the doctor's own
Gmail account — but over the **Gmail REST API (HTTPS)**, not SMTP. Render blocks outbound SMTP
entirely (confirmed: every port and IP-family combination timed out or was unreachable), so plain
`nodemailer`-over-SMTP never had a path to work here. HTTPS isn't port-blocked, which is why the
Gmail API route works instead.

The tradeoff: this needs a Google OAuth2 refresh token, and because the OAuth consent screen is in
Google's "Testing" mode (skipping their app-verification review, which the sensitive `gmail.send`
scope would otherwise require — a multi-day process needing a privacy policy page etc.), **that
refresh token expires after about 7 days.** Renewing it takes ~2 minutes; see "Renewing the refresh
token" below. Going through verification for a token that never expires is possible later if this
becomes annoying, but wasn't worth the extra setup up front.

### One-time setup

1. [Google Cloud Console](https://console.cloud.google.com/) → create a project.
2. **APIs & Services → Library** → search "Gmail API" → Enable.
3. **APIs & Services → OAuth consent screen**:
   - User type: External
   - Scopes: add `https://www.googleapis.com/auth/gmail.send`
   - Test users: add the Gmail address you're sending from
   - Save (leave it in "Testing" — publishing requires the verification review mentioned above)
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: add `https://developers.google.com/oauthplayground`
   - Create → copy the **Client ID** and **Client Secret** it shows you.
5. Set `GMAIL_USER` (the sending address), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` from the above.

### Getting (and renewing) the refresh token

1. Open the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Gear icon (top right) → check "Use your own OAuth credentials" → paste your Client ID/Secret.
3. In the scopes list on the left, find/paste `https://www.googleapis.com/auth/gmail.send` →
   **Authorize APIs**.
4. Sign in with the Gmail account. Google will warn "Google hasn't verified this app" (expected,
   since it's in Testing) → **Advanced → Go to [app name] (unsafe) → Allow**.
5. Back in the Playground, click **Exchange authorization code for tokens** → copy the
   **Refresh token** shown.
6. Set that as `GOOGLE_REFRESH_TOKEN` in Render's environment variables.

**Repeat steps 1–6 roughly every 7 days** to keep the token from going stale — it's the same couple
of minutes each time.

## Local development

```sh
cd mongo-proxy
npm install
cp .env.example .env   # then fill in MONGODB_URI and PROXY_SECRET
npm start               # listens on :8787
```

Seed the one doctor account + sample services/frames (safe to re-run, skips if data exists):

```sh
SEED_DOCTOR_PASSWORD='your-password' npm run seed
```

## Deploying (Render)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point it at this repo. Render will read `render.yaml` and create
   a free web service rooted at `mongo-proxy/`.
3. In the service's **Environment** tab, set:
   - `MONGODB_URI` — your Atlas connection string.
   - `PROXY_SECRET` — a long random string (generate with `openssl rand -base64 32`). Use the same
     value in the main app's `MONGO_PROXY_SECRET` env var.
   - `GMAIL_USER` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` — see
     above. Optional; appointment-status emails are skipped (logged, not thrown) if these aren't
     set.
4. Once deployed, run the seed script once (Render Shell, or run it locally against the same
   `MONGODB_URI`).
5. Copy the service's public URL (e.g. `https://misha-mongo-proxy.onrender.com`) into the main app's
   `MONGO_PROXY_URL` env var.

Render's free tier sleeps after inactivity and wakes on the next request (a few seconds' delay on
the first request after idling) — fine for a small clinic's traffic.
