import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireDoctorAuth } from "@/integrations/mongo/auth-middleware";
import type { Service } from "./types";

const serviceInput = z.object({
  name: z.string().trim().min(1),
  tagline: z.string().trim().default(""),
  description: z.string().trim().default(""),
  duration: z.string().trim().default(""),
  price: z.string().trim().default(""),
  sortOrder: z.number().optional(),
});

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
  return callProxy<Service[]>("/services");
});

export const createService = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(serviceInput)
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    return callProxy<Service>("/services", { method: "POST", body: JSON.stringify(data) });
  });

export const updateService = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(serviceInput.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    const { id, ...body } = data;
    return callProxy<Service>(`/services/${id}`, { method: "PUT", body: JSON.stringify(body) });
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    await callProxy(`/services/${data.id}`, { method: "DELETE" });
    return { ok: true as const };
  });
