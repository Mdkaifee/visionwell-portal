import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CalendarCheck2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listServices } from "@/server-functions/services";
import { bookAppointment } from "@/server-functions/appointments";

export const Route = createFileRoute("/appointment")({
  loader: async () => ({ services: await listServices() }),
  component: AppointmentPage,
});

function AppointmentPage() {
  const { services } = Route.useLoaderData();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [service, setService] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const patientName = String(form.get("patientName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    if (!patientName || phone.length < 6) {
      toast.error("Please share your name and a valid phone number.");
      return;
    }

    setSubmitting(true);
    try {
      await bookAppointment({
        data: {
          patientName,
          phone,
          email: String(form.get("email") ?? ""),
          service,
          preferredDate: String(form.get("preferredDate") ?? ""),
          preferredTime: String(form.get("preferredTime") ?? ""),
          notes: String(form.get("notes") ?? ""),
        },
      });
      setDone(true);
    } catch {
      toast.error("Something went wrong — please try again or call the clinic.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 md:py-28">
      <Reveal>
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-primary">
          Book a visit
        </p>
        <h1 className="mt-4 text-center font-display text-4xl font-light md:text-6xl">
          Reserve your slot
        </h1>
        <p className="mx-auto mt-5 max-w-md text-center leading-relaxed text-muted-foreground">
          Tell us a little about what you need — we&apos;ll confirm your appointment by phone.
        </p>
      </Reveal>

      <Reveal delay={120}>
        {done ? (
          <div className="mt-14 flex flex-col items-center rounded-3xl border border-border/70 bg-card px-8 py-16 text-center shadow-soft animate-rise">
            <CheckCircle2 className="size-12 text-primary" />
            <h2 className="mt-5 font-display text-2xl">Request received</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              We&apos;ll call you shortly to confirm the date and time. Thank you for choosing Misha
              Eye Care &amp; Optical.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-14 space-y-6 rounded-3xl border border-border/70 bg-card p-8 shadow-soft md:p-10"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientName">Full name</Label>
                <Input id="patientName" name="patientName" placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="98140 00000" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" />
            </div>

            <div className="space-y-2">
              <Label>What do you need?</Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Preferred date</Label>
                <Input id="preferredDate" name="preferredDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Preferred time</Label>
                <Input id="preferredTime" name="preferredTime" type="time" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Anything else we should know?</Label>
              <Textarea id="notes" name="notes" placeholder="Optional notes" rows={3} />
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
              <CalendarCheck2 className="size-4" />
              {submitting ? "Sending…" : "Request appointment"}
            </Button>
          </form>
        )}
      </Reveal>
    </div>
  );
}
