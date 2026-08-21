import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MapPin, Clock, Phone, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "@/server-functions/messages";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

const details = [
  { icon: MapPin, label: "Model Town Market, Mohali/Chandigarh, Punjab 144003" },
  { icon: Clock, label: "Mon – Sat · 10:00 AM – 8:00 PM · Sunday · 11:00 AM – 2:00 PM" },
  { icon: Phone, label: "+91 98140 00000" },
];

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    if (!name || !message) {
      toast.error("Please share your name and a short message.");
      return;
    }

    setSubmitting(true);
    try {
      await sendMessage({
        data: {
          name,
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          message,
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
    <div className="mx-auto max-w-5xl px-5 py-20 md:py-28">
      <Reveal>
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-primary">Contact</p>
        <h1 className="mt-4 text-center font-display text-4xl font-light md:text-6xl">
          Come say hello
        </h1>
      </Reveal>

      <div className="mt-16 grid gap-10 md:grid-cols-2">
        <Reveal>
          <div className="space-y-5">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-5"
              >
                <d.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed">{d.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={140}>
          {done ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-border/70 bg-card px-8 py-16 text-center shadow-soft animate-rise">
              <CheckCircle2 className="size-12 text-primary" />
              <h2 className="mt-5 font-display text-2xl">Message sent</h2>
              <p className="mt-2 text-muted-foreground">We&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-3xl border border-border/70 bg-card p-8 shadow-soft"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" rows={4} required />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
                <Send className="size-4" />
                {submitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </Reveal>
      </div>
    </div>
  );
}
