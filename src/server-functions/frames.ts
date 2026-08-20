import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireDoctorAuth } from "@/integrations/mongo/auth-middleware";
import type { Frame } from "./types";

const frameInput = z.object({
  name: z.string().trim().min(1),
  brand: z.string().trim().default(""),
  material: z.string().trim().default(""),
  shape: z.string().trim().default(""),
  colour: z.string().trim().default(""),
  price: z.number().nonnegative().default(0),
  imageUrl: z.string().trim().default(""),
  inStock: z.boolean().default(true),
  sortOrder: z.number().optional(),
});

export const listFrames = createServerFn({ method: "GET" }).handler(async () => {
  const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
  return callProxy<Frame[]>("/frames");
});

export const createFrame = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(frameInput)
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    return callProxy<Frame>("/frames", { method: "POST", body: JSON.stringify(data) });
  });

export const updateFrame = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(frameInput.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    const { id, ...body } = data;
    return callProxy<Frame>(`/frames/${id}`, { method: "PUT", body: JSON.stringify(body) });
  });

export const deleteFrame = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    await callProxy(`/frames/${data.id}`, { method: "DELETE" });
    return { ok: true as const };
  });
