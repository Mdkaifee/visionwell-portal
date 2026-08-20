import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginDoctor } from "@/server-functions/auth";

export const Route = createFileRoute("/auth")({
  beforeLoad: ({ context }) => {
    if (context.doctor) throw redirect({ to: "/workspace" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setSubmitting(true);
    setError(null);
    try {
      const result = await loginDoctor({ data: { email, password } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await navigate({ to: "/workspace" });
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-20 md:py-28">
      <Reveal>
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-full border border-gold/70 bg-gold-soft/50">
            <Eye className="size-5 text-primary" />
          </span>
          <p className="mt-5 text-[11px] uppercase tracking-[0.3em] text-primary">Doctor login</p>
          <h1 className="mt-3 font-display text-3xl font-light md:text-4xl">Welcome back</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to manage appointments, prescriptions and the public site.
          </p>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-3xl border border-border/70 bg-card p-8 shadow-soft"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
            <Lock className="size-4" />
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Reveal>
    </div>
  );
}
