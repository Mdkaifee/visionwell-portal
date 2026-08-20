# mongo-proxy

A small always-on Express service that is the *only* thing allowed to talk to MongoDB directly.
The main site (deployed on Cloudflare Workers via Lovable) calls this over plain HTTPS, because the
native MongoDB driver does not work reliably from Cloudflare Workers.

Every route except `GET /health` requires header `x-proxy-secret: <PROXY_SECRET>`. This service is
never called from a browser — only from the main app's server code — so that single shared secret
is the whole authorization model. Keep it secret.

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
4. Once deployed, run the seed script once (Render Shell, or run it locally against the same
   `MONGODB_URI`).
5. Copy the service's public URL (e.g. `https://misha-mongo-proxy.onrender.com`) into the main app's
   `MONGO_PROXY_URL` env var.

Render's free tier sleeps after inactivity and wakes on the next request (a few seconds' delay on
the first request after idling) — fine for a small clinic's traffic.
