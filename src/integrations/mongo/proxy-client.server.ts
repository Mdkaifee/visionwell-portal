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
  // A platform-level failure (e.g. the host's own gateway timeout) can return
  // a plain-text body instead of our proxy's normal JSON error shape.
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const message =
      (data as { error?: string } | undefined)?.error ||
      (text ? text.slice(0, 200) : `Request to ${path} failed`);
    throw new ProxyError(response.status, message);
  }
  return data as T;
}
