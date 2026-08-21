import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl">Misha Eye Care &amp; Optical</h3>
          <div className="my-4 h-px w-24 gold-rule" />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            A calm, unhurried clinic in Mohali/Chandigarh for eye examinations, spectacles and contact
            lenses — with every prescription recorded digitally.
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="text-[10px] uppercase tracking-[0.3em] text-foreground">Visit</p>
          <p>Model Town Market, Mohali/Chandigarh, Punjab 144003</p>
          <p>Mon – Sat · 10:00 AM – 8:00 PM</p>
          <p>Sunday · 11:00 AM – 2:00 PM</p>
          <p>+91 98140 00000</p>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="text-[10px] uppercase tracking-[0.3em] text-foreground">Explore</p>
          <p>
            <Link to="/services" className="transition-colors hover:text-foreground">
              Services
            </Link>
          </p>
          <p>
            <Link to="/eyewear" className="transition-colors hover:text-foreground">
              Frames &amp; lenses
            </Link>
          </p>
          <p>
            <Link to="/appointment" className="transition-colors hover:text-foreground">
              Book a visit
            </Link>
          </p>
          <p>
            <Link to="/auth" className="transition-colors hover:text-foreground">
              Doctor workspace
            </Link>
          </p>
        </div>
      </div>
      <div className="border-t border-border/70 px-5 py-6 text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        © {new Date().getFullYear()} Misha Eye Care &amp; Optical
      </div>
    </footer>
  );
}
