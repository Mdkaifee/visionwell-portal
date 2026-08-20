import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireDoctorAuth } from "@/integrations/mongo/auth-middleware";
import type { Prescription } from "./types";

const eyeSide = z.object({
  sph: z.string().trim().default(""),
  cyl: z.string().trim().default(""),
  axis: z.string().trim().default(""),
});

const prescriptionInput = z.object({
  patientName: z.string().trim().min(1),
  phone: z.string().trim().default(""),
  age: z.number().nullable().default(null),
  gender: z.string().trim().default(""),
  right: eyeSide,
  left: eyeSide,
  addPower: z.string().trim().default(""),
  pd: z.string().trim().default(""),
  lensAdvice: z.string().trim().default(""),
  frameAdvice: z.string().trim().default(""),
  diagnosis: z.array(z.string()).default([]),
  notes: z.string().trim().default(""),
  followUpDate: z.string().trim().default(""),
  fileName: z.string().trim().default(""),
  fileType: z.string().trim().default(""),
  fileDataBase64: z.string().default(""),
});

export const listPrescriptions = createServerFn({ method: "GET" })
  .middleware([requireDoctorAuth])
  .validator(z.object({ q: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    const query = data?.q ? `?q=${encodeURIComponent(data.q)}` : "";
    return callProxy<Prescription[]>(`/prescriptions${query}`);
  });

export const getPrescription = createServerFn({ method: "GET" })
  .middleware([requireDoctorAuth])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    return callProxy<Prescription>(`/prescriptions/${data.id}`);
  });

export const createPrescription = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(prescriptionInput)
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    return callProxy<Prescription>("/prescriptions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  });

export const updatePrescription = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(prescriptionInput.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    const { id, ...body } = data;
    return callProxy<Prescription>(`/prescriptions/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  });

export const deletePrescription = createServerFn({ method: "POST" })
  .middleware([requireDoctorAuth])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    await callProxy(`/prescriptions/${data.id}`, { method: "DELETE" });
    return { ok: true as const };
  });
