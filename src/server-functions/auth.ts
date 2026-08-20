import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const loginDoctor = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const { callProxy, ProxyError } = await import("@/integrations/mongo/proxy-client.server");
    const { getDoctorSession } = await import("@/lib/session.server");

    try {
      const doctor = await callProxy<{ id: string; email: string; name: string }>(
        "/doctors/login",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );

      const session = await getDoctorSession();
      await session.update({ doctorId: doctor.id, email: doctor.email, name: doctor.name });
      return { ok: true as const };
    } catch (error) {
      if (error instanceof ProxyError && error.status === 401) {
        return { ok: false as const, error: "Invalid email or password." };
      }
      throw error;
    }
  });

export const logoutDoctor = createServerFn({ method: "POST" }).handler(async () => {
  const { getDoctorSession } = await import("@/lib/session.server");
  const session = await getDoctorSession();
  await session.clear();
  return { ok: true as const };
});

export const getCurrentDoctor = createServerFn({ method: "GET" }).handler(async () => {
  const { getDoctorSession } = await import("@/lib/session.server");
  const session = await getDoctorSession();
  if (!session.data.doctorId || !session.data.email) return null;
  return { email: session.data.email, name: session.data.name ?? "Doctor" };
});
