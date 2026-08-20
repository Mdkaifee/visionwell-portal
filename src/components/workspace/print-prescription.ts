import type { Prescription } from "@/server-functions/types";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Opens a clean, print-only slip in a new tab and triggers the browser print
// dialog — this is how the doctor hands over a "written" prescription without
// ever picking up a pen.
export function printPrescription(rx: Prescription) {
  const win = window.open("", "_blank", "width=760,height=900");
  if (!win) return;

  const row = (label: string, value: string) =>
    value
      ? `<div class="row"><span class="label">${label}</span><span>${escapeHtml(value)}</span></div>`
      : "";

  const eyeRow = (side: string, eye: Prescription["right"]) => `
    <tr>
      <td>${side}</td>
      <td>${escapeHtml(eye.sph) || "—"}</td>
      <td>${escapeHtml(eye.cyl) || "—"}</td>
      <td>${escapeHtml(eye.axis) || "—"}</td>
    </tr>`;

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Prescription — ${escapeHtml(rx.patientName)}</title>
        <style>
          body { font-family: Georgia, "Times New Roman", serif; color: #1f2a24; padding: 40px; max-width: 640px; margin: 0 auto; }
          h1 { font-size: 22px; margin: 0; }
          .sub { color: #6b6b63; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px; }
          .rule { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
          .label { color: #6b6b63; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          .notes { margin-top: 16px; font-size: 14px; line-height: 1.6; }
          .footer { margin-top: 40px; font-size: 12px; color: #6b6b63; text-align: right; }
        </style>
      </head>
      <body>
        <h1>Misha Eye Care &amp; Optical</h1>
        <p class="sub">Model Town Market, Jalandhar, Punjab 144003</p>
        <hr class="rule" />
        ${row("Patient", rx.patientName)}
        ${row("Phone", rx.phone)}
        ${row("Age / Gender", [rx.age, rx.gender].filter(Boolean).join(" / "))}
        ${row("Date", new Date(rx.createdAt).toLocaleDateString())}
        <table>
          <thead><tr><th>Eye</th><th>SPH</th><th>CYL</th><th>AXIS</th></tr></thead>
          <tbody>
            ${eyeRow("Right (OD)", rx.right)}
            ${eyeRow("Left (OS)", rx.left)}
          </tbody>
        </table>
        ${row("Add power", rx.addPower)}
        ${row("PD", rx.pd)}
        ${row("Lens advice", rx.lensAdvice)}
        ${row("Frame advice", rx.frameAdvice)}
        ${row("Diagnosis", rx.diagnosis.join(", "))}
        ${row("Follow-up", rx.followUpDate)}
        ${rx.notes ? `<p class="notes">${escapeHtml(rx.notes)}</p>` : ""}
        <p class="footer">Generated digitally — Misha Eye Care &amp; Optical</p>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
