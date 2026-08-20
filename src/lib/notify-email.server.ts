import { sendLovableEmail } from "@lovable.dev/email-js";
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

  try {
    await sendLovableEmail(
      {
        to,
        from: defaultFrom(),
        subject: `Your appointment is ${copy.subject} — Misha Eye Care & Optical`,
        html,
        text,
        purpose: "transactional",
        idempotency_key: `appointment-${appointment.id}-${appointment.status}`,
      },
      { apiKey },
    );
  } catch (error) {
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
