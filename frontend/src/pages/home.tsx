import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, Users, RefreshCcw, ChevronDown } from "lucide-react";
import { useEffect } from "react";

const STEPS = [
  {
    num: 1,
    icon: Search,
    title: "Browse Listings",
    desc: "Find your dream home from our curated selection of premium properties. Filter by what matters to you.",
  },
  {
    num: 2,
    icon: Users,
    title: "Collaborate",
    desc: "Work closely with your realtor, lender, and inspectors. Share notes and documents securely.",
  },
  {
    num: 3,
    icon: RefreshCcw,
    title: "Stay in Sync",
    desc: "Never miss a beat. Real-time updates, chat, and task tracking ensure a smooth closing.",
  },
];

export default function HomePage() {
  useEffect(() => {
    document.title = "HomeSync";
  }, []);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative h-[85vh] min-h-[540px] w-full flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-home-2.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white flex flex-col items-center gap-6">
          <div
            className="slide-up flex items-center gap-4"
            style={{ animationDelay: "0.1s" }}
          >
            <img
              src="/logo.png"
              alt=""
              className="h-16 sm:h-20 md:h-24 w-auto drop-shadow-2xl brightness-0 invert"
            />
            <span className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl text-white drop-shadow-lg tracking-tight">
              HomeSync
            </span>
          </div>

          <p
            className="slide-up text-lg md:text-xl text-white/80 max-w-xl leading-relaxed"
            style={{ animationDelay: "0.35s" }}
          >
            Track every step of your home purchase with your agent&nbsp;in&nbsp;one&nbsp;place.
          </p>

          <div
            className="slide-up flex flex-col sm:flex-row gap-4 pt-4"
            style={{ animationDelay: "0.55s" }}
          >
            <Link href="/listings">
              <Button
                size="lg"
                className="h-13 px-8 text-base rounded-full shadow-lg shadow-primary/25 hover:-translate-y-0.5"
              >
                Browse Listings
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 text-base rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm hover:-translate-y-0.5"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/50 animate-bounce-subtle">
          <ChevronDown className="h-7 w-7" />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Simple &amp; Seamless
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Three steps to simplify your real estate journey
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Connecting line (desktop only) */}
            <div
              className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-border"
              aria-hidden="true"
            />

            {STEPS.map((step) => (
              <div
                key={step.num}
                className="group relative p-6 pt-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                {/* Step number badge */}
                <span className="absolute -top-4 left-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md ring-4 ring-background">
                  {step.num}
                </span>

                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary transition-colors duration-300">
                  <step.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-300" />
                </div>

                <h3 className="text-lg font-bold mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative overflow-hidden bg-primary py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(176_39%_35%/0.6),transparent_60%)]" />
        <div className="relative container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to find your next home?
          </h2>
          <p className="text-white/80 max-w-lg mx-auto text-lg leading-relaxed">
            Join HomeSync today and collaborate with your agent every step of the&nbsp;way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/listings">
              <Button
                size="lg"
                className="h-12 px-8 rounded-full bg-white text-primary font-semibold hover:bg-white/90 shadow-lg hover:-translate-y-0.5"
              >
                Browse Listings
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="lg"
                className="h-12 px-8 rounded-full bg-white text-primary font-semibold hover:bg-white/90 shadow-lg hover:-translate-y-0.5"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-foreground text-background/70 py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-7 w-auto brightness-0 invert opacity-70" />
            <span className="font-heading font-bold text-background/90 text-lg">HomeSync</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} HomeSync Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
