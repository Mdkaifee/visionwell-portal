import { createMiddleware } from "@tanstack/react-start";
import { requireDoctor } from "@/lib/session.server";

// Guards doctor-only server functions. The session lives in a signed, httpOnly
// cookie (see src/lib/session.server.ts) that the browser sends automatically —
// there's no client-side token to attach, unlike the old Supabase bearer-token setup.
export const requireDoctorAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const doctor = await requireDoctor();
  return next({ context: { doctor } });
});
