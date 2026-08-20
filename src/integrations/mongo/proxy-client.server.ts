// Server-only client for the mongo-proxy service (see /mongo-proxy). This is
// the sole way this app touches the database — the browser never calls the
// proxy directly, and the shared secret never leaves the server.
// Load inside server functions: const { callProxy } = await import("@/integrations/mongo/proxy-client.server");

export class ProxyError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function config() {
  const url = process.env["MONGO_PROXY_URL"];
  const secret = process.env["MONGO_PROXY_SECRET"];
  if (!url || !secret) {
    throw new Error(
      "Missing MONGO_PROXY_URL / MONGO_PROXY_SECRET. Set them in .env.local for local dev, and as server env vars on the deployed site.",
    );
  }
  return { url, secret };
}

export async function callProxy<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, secret } = config();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-proxy-secret": secret,
      ...init?.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new ProxyError(response.status, data?.error ?? `Request to ${path} failed`);
  }
  return data as T;
}
