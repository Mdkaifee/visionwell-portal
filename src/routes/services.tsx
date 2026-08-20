import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { listServices } from "@/server-functions/services";

export const Route = createFileRoute("/services")({
  loader: async () => ({ services: await listServices() }),
  component: ServicesPage,
});

function ServicesPage() {
  const { services } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal>
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-primary">
          Eye checkups
        </p>
        <h1 className="mt-4 text-center font-display text-4xl font-light md:text-6xl">
          Every examination, done properly
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center leading-relaxed text-muted-foreground">
          Choose the check-up that fits — every visit ends with your findings entered into a digital
          record the doctor can pull up again in seconds.
        </p>
      </Reveal>

      {services.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          Services will appear here once they&apos;re added from the doctor workspace.
        </p>
      ) : (
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={i * 70}>
              <div className="group h-full rounded-2xl border border-border/70 bg-card p-7 shadow-soft transition-transform duration-500 hover:-translate-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl">{service.name}</h2>
                    <p className="mt-1 text-sm text-primary">{service.tagline}</p>
                  </div>
                  <span className="shrink-0 font-display text-xl text-foreground">
                    {service.price}
                  </span>
                </div>
                <p className="mt-4 leading-relaxed text-muted-foreground">{service.description}</p>
                {service.duration && (
                  <p className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <Clock className="size-3.5" /> {service.duration}
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal delay={200}>
        <div className="mt-16 flex justify-center">
          <Button asChild size="lg" className="rounded-full px-10">
            <Link to="/appointment">
              Book this check-up <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
