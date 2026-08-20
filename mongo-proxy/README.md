# mongo-proxy

A small always-on Express service that is the *only* thing allowed to talk to MongoDB directly.
The main site (deployed on Cloudflare Workers via Lovable) calls this over plain HTTPS, because the
native MongoDB driver does not work reliably from Cloudflare Workers.

Every route except `GET /health` requires header `x-proxy-secret: <PROXY_SECRET>`. This service is
never called from a browser — only from the main app's server code — so that single shared secret
is the whole authorization model. Keep it secret.

It also sends appointment-status emails (`POST /send-email`) through a real Gmail account via SMTP
(`mailer.js`, using `nodemailer`) rather than a third-party transactional email API — that would
require verifying a domain you own, which this project doesn't have. Sending "as" your own Gmail
account needs no domain, just an **App Password**:

1. Turn on 2-Step Verification on the Google account you want to send from, if it isn't already:
   https://myaccount.google.com/security
2. Generate an App Password: https://myaccount.google.com/apppasswords (pick "Mail" / "Other").
3. Set `GMAIL_USER` to that account's address and `GMAIL_APP_PASSWORD` to the 16-character password
   it gives you (not your normal Google password).

Personal Gmail accounts cap outgoing mail at roughly 500/day — far more than a small clinic needs.

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
   - `GMAIL_USER` / `GMAIL_APP_PASSWORD` — see above. Optional; appointment-status emails are
     skipped (logged, not thrown) if these aren't set.
4. Once deployed, run the seed script once (Render Shell, or run it locally against the same
   `MONGODB_URI`).
5. Copy the service's public URL (e.g. `https://misha-mongo-proxy.onrender.com`) into the main app's
   `MONGO_PROXY_URL` env var.

Render's free tier sleeps after inactivity and wakes on the next request (a few seconds' delay on
the first request after idling) — fine for a small clinic's traffic.
