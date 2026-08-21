# Misha Eye Care & Optical — India

A multi-page site for the clinic: eye checkups, an optical/frames catalog, appointment booking,
a contact form, and a doctor-only workspace for managing everything (services, frames,
appointments, prescriptions, messages) without touching code.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://visionwell-portal.lovable.app

## Architecture

The site itself (this repo, TanStack Start) never talks to MongoDB directly — Lovable's Publish
button deploys it to Cloudflare Workers, and the MongoDB driver doesn't work reliably there. Instead
it calls a small separate API, **`mongo-proxy/`**, over plain HTTPS. See
[`mongo-proxy/README.md`](mongo-proxy/README.md) for that service and how to deploy it (Render).

```
Browser → this app (Cloudflare Workers) → mongo-proxy (Render) → MongoDB Atlas
```

## Required environment variables (this app)

Server-only — never prefix these with `VITE_`, and never commit real values:

| Variable             | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `MONGO_PROXY_URL`    | Base URL of the deployed `mongo-proxy` service             |
| `MONGO_PROXY_SECRET` | Shared secret, must match `PROXY_SECRET` on `mongo-proxy`  |
| `SESSION_SECRET`     | Signs the doctor's login session cookie (32+ random chars) |

For local development, put these in `.env.local` (already gitignored via the `*.local` rule in
`.gitignore`). For the deployed site, add them as **server environment variables** in Lovable's
project settings — not in any file in this repo.

Appointment-status emails are sent from `mongo-proxy` via the Gmail API over HTTPS (Render blocks
outbound SMTP) — see [`mongo-proxy/README.md`](mongo-proxy/README.md) for that setup. Not sent from
this app directly, and need no env vars here.

## Development

```sh
npm i
npm run dev
```

You'll also need `mongo-proxy` running locally (see its own README) so the app has something to
talk to — point `MONGO_PROXY_URL` at it (`http://localhost:8787` by default).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/74d30126-de84-470c-a484-5118273e6347).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.
