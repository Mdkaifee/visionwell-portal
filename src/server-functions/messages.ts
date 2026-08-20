import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireDoctorAuth } from "@/integrations/mongo/auth-middleware";
import type { ContactMessage } from "./types";

const messageInput = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().default(""),
  email: z.string().trim().default(""),
  message: z.string().trim().min(1),
});

// Public: anyone can send a message from the Contact page.
export const sendMessage = createServerFn({ method: "POST" })
  .validator(messageInput)
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    return callProxy<ContactMessage>("/messages", { method: "POST", body: JSON.stringify(data) });
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireDoctorAuth])
  .handler(async () => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    return callProxy<ContactMessage[]>("/messages");
  });

export const markMessageRead = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(z.object({ id: z.string().min(1), read: z.boolean() }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    return callProxy<ContactMessage>(`/messages/${data.id}`, {
      method: "PATCH",
      body: JSON.stringify({ read: data.read }),
    });
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    await callProxy(`/messages/${data.id}`, { method: "DELETE" });
    return { ok: true as const };
  });
