import { sendLovableEmail, EmailAPIError } from "@lovable.dev/email-js";
import type { Appointment } from "@/server-functions/types";

const STATUS_COPY: Record<string, { subject: string; headline: string }> = {
  pending: { subject: "received", headline: "We've received your appointment request" },
  confirmed: { subject: "confirmed", headline: "Your appointment is confirmed" },
  completed: { subject: "completed", headline: "Thanks for visiting Misha Eye Care & Optical" },
  cancelled: { subject: "cancelled", headline: "Your appointment has been cancelled" },
};

function defaultFrom() {
  return (
    process.env["NOTIFICATIONS_FROM_EMAIL"] ||
    "Misha Eye Care & Optical <notifications@mishaeyecare.in>"
  );
}

// Best-effort: a failed notification must never break the appointment update
// itself, so every error is caught and logged here rather than thrown.
export async function notifyAppointmentStatus(appointment: Appointment) {
  const to = appointment.email?.trim();
  if (!to) return;

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    console.error("[notify] Missing LOVABLE_API_KEY — skipping appointment status email.");
    return;
  }

  const copy = STATUS_COPY[appointment.status] ?? {
    subject: appointment.status,
    headline: "Appointment update",
  };
  const when = [appointment.preferredDate, appointment.preferredTime].filter(Boolean).join(" at ");

  const text = [
    `Hi ${appointment.patientName},`,
    "",
    copy.headline + ".",
    appointment.service ? `Service: ${appointment.service}` : "",
    when ? `Preferred time: ${when}` : "",
    "",
    "— Misha Eye Care & Optical",
    "Model Town Market, Jalandhar, Punjab 144003",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Georgia,serif;color:#26332a;max-width:480px">
      <p>Hi ${escapeHtml(appointment.patientName)},</p>
      <p><strong>${escapeHtml(copy.headline)}.</strong></p>
      ${appointment.service ? `<p>Service: ${escapeHtml(appointment.service)}</p>` : ""}
      ${when ? `<p>Preferred time: ${escapeHtml(when)}</p>` : ""}
      <p style="margin-top:24px;color:#6b6b63;font-size:13px">
        Misha Eye Care &amp; Optical<br/>Model Town Market, Jalandhar, Punjab 144003
      </p>
    </div>
  `;

  const request = {
    to,
    from: defaultFrom(),
    subject: `Your appointment is ${copy.subject} — Misha Eye Care & Optical`,
    html,
    text,
    purpose: "transactional",
  };
  const baseKey = `appointment-${appointment.id}-${appointment.status}`;

  try {
    await sendLovableEmail({ ...request, idempotency_key: baseKey }, { apiKey });
  } catch (error) {
    // A prior attempt under this same idempotency key already failed for
    // some real reason (e.g. an unverified sender domain); the API locks
    // that key and won't retry it, so we retry once under a fresh key to
    // surface the actual underlying error instead of this generic 409.
    if (error instanceof EmailAPIError && error.status === 409) {
      try {
        await sendLovableEmail(
          { ...request, idempotency_key: `${baseKey}-${Date.now()}` },
          { apiKey },
        );
        return;
      } catch (retryError) {
        console.error("[notify] Retry after stale idempotency key also failed:", retryError);
        return;
      }
    }
    console.error("[notify] Failed to send appointment status email:", error);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
