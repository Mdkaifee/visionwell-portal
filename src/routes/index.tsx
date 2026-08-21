import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Glasses, FileCheck2, HeartHandshake, ArrowRight, Sparkles } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { listServices } from "@/server-functions/services";
import heroImage from "@/assets/hero-boutique.jpg";
import examImage from "@/assets/exam-room.jpg";
import eyewearImage from "@/assets/eyewear-detail.jpg";

export const Route = createFileRoute("/")({
  loader: async () => {
    const services = await listServices();
    return { services: services.slice(0, 3) };
  },
  component: Index,
});

const highlights = [
  {
    icon: Eye,
    title: "Comprehensive exams",
    body: "Digital refraction, visual acuity and slit-lamp evaluation on every visit.",
  },
  {
    icon: FileCheck2,
    title: "Digital prescriptions",
    body: "Every prescription is typed and stored — nothing scribbled, nothing lost.",
  },
  {
    icon: Glasses,
    title: "Curated eyewear",
    body: "Frames selected for face shape, comfort and everyday wear.",
  },
  {
    icon: HeartHandshake,
    title: "Unhurried care",
    body: "Time to ask questions, explain the diagnosis and plan the next visit.",
  },
];

function Index() {
  const { services } = Route.useLoaderData();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover opacity-[0.16] animate-focus-in"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-28 text-center md:py-36">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold-soft/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-accent-foreground">
              <Sparkles className="size-3.5" />
              Mohali/Chandigarh&apos;s trusted eye care
            </span>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="mt-8 max-w-3xl font-display text-5xl font-light leading-[1.08] tracking-tight md:text-7xl">
              Clear sight, cared for
              <span className="block italic text-primary">by hand, on record.</span>
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg">
              Misha Eye Care &amp; Optical is a calm, thorough clinic for eye examinations,
              spectacles and contact lenses — every prescription recorded digitally, ready whenever
              you need it again.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/appointment">
                  Book a visit <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                <Link to="/eyewear">Explore eyewear</Link>
              </Button>
            </div>
          </Reveal>

          <div className="mt-4 h-px w-40 gold-rule animate-sheen" />
        </div>
      </section>

      <section className="border-t border-border/70 bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item, i) => (
              <Reveal key={item.title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-transform duration-500 hover:-translate-y-1">
                  <item.icon className="size-6 text-primary" />
                  <h3 className="mt-4 font-display text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 md:grid-cols-2 md:items-center">
          <Reveal>
            <div className="relative">
              <img
                src={examImage}
                alt="Eye examination room at Misha Eye Care"
                className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift animate-float-slow"
              />
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border/70 bg-card px-6 py-4 shadow-soft md:block">
                <p className="font-display text-2xl">30 min</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Full examination
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Services</p>
              <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">
                A thorough exam, explained plainly
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
                From routine number checks to diabetic retina screening, every finding is explained
                and entered straight into your record — so your next visit picks up exactly where
                this one left off.
              </p>

              <div className="mt-8 space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-5 py-4"
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.tagline}</p>
                    </div>
                    <span className="shrink-0 font-display text-lg text-primary">
                      {service.price}
                    </span>
                  </div>
                ))}
              </div>

              <Button asChild variant="link" className="mt-6 px-0 text-primary">
                <Link to="/services">
                  See every service <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-border/70 bg-secondary/40 py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 md:grid-cols-2 md:items-center">
          <Reveal className="order-2 md:order-1">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Optical</p>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">
              Frames chosen to be worn every day
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              Acetate, titanium and rimless styles, fitted by hand with an accurate PD measurement —
              because the right spectacle number deserves the right frame.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full px-8">
              <Link to="/eyewear">
                Browse the collection <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>

          <Reveal delay={140} className="order-1 md:order-2">
            <img
              src={eyewearImage}
              alt="Eyewear display at Misha Eye Care"
              className="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift"
            />
          </Reveal>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <Reveal>
            <h2 className="font-display text-4xl font-light md:text-5xl">
              Ready for your eyes to be looked after properly?
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Pick a date and time that suits you — we&apos;ll have your record ready when you walk
              in.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full px-10">
              <Link to="/appointment">
                Book a visit <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
