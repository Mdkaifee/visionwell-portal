import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireDoctorAuth } from "@/integrations/mongo/auth-middleware";
import type { Appointment } from "./types";

const bookingInput = z.object({
  patientName: z.string().trim().min(1),
  phone: z.string().trim().min(6),
  email: z.string().trim().default(""),
  service: z.string().trim().default(""),
  preferredDate: z.string().trim().default(""),
  preferredTime: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

// Public: anyone can request an appointment.
export const bookAppointment = createServerFn({ method: "POST" })
  .validator(bookingInput)
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    const created = await callProxy<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const { notifyAppointmentStatus } = await import("@/lib/notify-email.server");
    await notifyAppointmentStatus(created);
    return created;
  });

export const listAppointments = createServerFn({ method: "GET" })
  .middleware([requireDoctorAuth])
  .handler(async () => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    return callProxy<Appointment[]>("/appointments");
  });

export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(
    z.object({
      id: z.string().min(1),
      status: z.string().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    const { id, ...body } = data;
    const updated = await callProxy<Appointment>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (data.status) {
      const { notifyAppointmentStatus } = await import("@/lib/notify-email.server");
      await notifyAppointmentStatus(updated);
    }
    return updated;
  });

export const deleteAppointment = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    await callProxy(`/appointments/${data.id}`, { method: "DELETE" });
    return { ok: true as const };
  });
