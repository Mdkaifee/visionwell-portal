import { useSession } from "@tanstack/react-start/server";

export type DoctorSessionData = {
  doctorId: string;
  email: string;
  name: string;
};

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password) {
    throw new Error(
      "Missing SESSION_SECRET env var. Set it in .env.local and on the deployed site.",
    );
  }
  return {
    password,
    name: "misha_doctor_session",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getDoctorSession() {
  // Not a React hook — this is TanStack Start's h3-derived session helper.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSession<DoctorSessionData>(sessionConfig());
}

/** Throws if there is no signed-in doctor. Use from server functions/loaders that require auth. */
export async function requireDoctor(): Promise<DoctorSessionData> {
  const session = await getDoctorSession();
  if (!session.data.doctorId || !session.data.email) {
    throw new Error("Unauthorized");
  }
  return session.data as DoctorSessionData;
}
