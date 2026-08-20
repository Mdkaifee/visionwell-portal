import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { FrameArt } from "@/components/frame-art";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listFrames } from "@/server-functions/frames";

export const Route = createFileRoute("/eyewear")({
  loader: async () => ({ frames: await listFrames() }),
  component: EyewearPage,
});

function EyewearPage() {
  const { frames } = Route.useLoaderData();
  const [shape, setShape] = useState<string>("All");

  const shapes = useMemo(() => {
    const unique = Array.from(new Set(frames.map((f) => f.shape).filter(Boolean)));
    return ["All", ...unique];
  }, [frames]);

  const filtered = shape === "All" ? frames : frames.filter((f) => f.shape === shape);

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal>
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-primary">Optical</p>
        <h1 className="mt-4 text-center font-display text-4xl font-light md:text-6xl">
          Frames &amp; lenses
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center leading-relaxed text-muted-foreground">
          A hand-picked collection across acetate, titanium and rimless styles — every pair fitted
          with an accurate PD measurement.
        </p>
      </Reveal>

      {shapes.length > 1 && (
        <Reveal delay={80}>
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {shapes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShape(s)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.18em] transition-colors",
                  shape === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </Reveal>
      )}

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          {frames.length === 0
            ? "Frames will appear here once they're added from the doctor workspace."
            : "No frames match this shape yet."}
        </p>
      ) : (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((frame, i) => (
            <Reveal key={frame.id} delay={(i % 6) * 60}>
              <div className="group h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-transform duration-500 hover:-translate-y-1">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,var(--gold-soft),var(--secondary)_75%)]">
                  {frame.imageUrl ? (
                    <img
                      src={frame.imageUrl}
                      alt={frame.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FrameArt
                      shape={frame.shape}
                      colour={frame.colour}
                      className="h-full w-full p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary">
                    {frame.brand}
                  </p>
                  <h3 className="mt-1 font-display text-xl">{frame.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {frame.material} · {frame.colour}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-lg">
                      ₹{frame.price.toLocaleString("en-IN")}
                    </span>
                    {!frame.inStock && (
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal delay={200}>
        <div className="mt-16 flex justify-center">
          <Button asChild size="lg" className="rounded-full px-10">
            <Link to="/appointment">
              Book a fitting <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
