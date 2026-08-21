import type { Appointment } from "@/server-functions/types";

const STATUS_COPY: Record<string, { subject: string; headline: string }> = {
  pending: { subject: "received", headline: "We've received your appointment request" },
  confirmed: { subject: "confirmed", headline: "Your appointment is confirmed" },
  completed: { subject: "completed", headline: "Thanks for visiting Misha Eye Care & Optical" },
  cancelled: { subject: "cancelled", headline: "Your appointment has been cancelled" },
};

// Best-effort: a failed notification must never break the appointment update
// itself, so every error is caught and logged here rather than thrown. Sent
// through mongo-proxy (the doctor's own Gmail account, via SMTP) rather than
// a third-party email API, since that needs no domain to verify.
export async function notifyAppointmentStatus(appointment: Appointment) {
  const to = appointment.email?.trim();
  if (!to) return;

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
    "Model Town Market, Mohali/Chandigarh, Punjab 144003",
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
        Misha Eye Care &amp; Optical<br/>Model Town Market, Mohali/Chandigarh, Punjab 144003
      </p>
    </div>
  `;

  try {
    const { callProxy } = await import("@/integrations/mongo/proxy-client.server");
    await callProxy("/send-email", {
      method: "POST",
      // A slow/blocked SMTP path must never stall the appointment update
      // itself — bail out well before the doctor's UI would notice a delay.
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        to,
        subject: `Your appointment is ${copy.subject} — Misha Eye Care & Optical`,
        text,
        html,
      }),
    });
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
