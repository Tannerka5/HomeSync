import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, Users, RefreshCcw } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-0">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: "url('/images/hero-home-2.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center text-white space-y-8 animate-in fade-in zoom-in-95 duration-1000">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
              <img
                src="/logo.png"
                alt="HomeSync Logo"
                className="h-16 w-auto brightness-0 invert"
              />
            </div>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-sm">
              HomeSync
            </h1>
            <p className="text-xl md:text-2xl font-light text-white/90 tracking-wide">
              Connect &bull; Collaborate &bull; Buy &bull; Sell
            </p>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full my-6 opacity-80" />
            <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto leading-relaxed">
              Track every step of your home purchase with your agent in one place.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/listings">
              <Button
                size="lg"
                className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform hover:-translate-y-1"
              >
                Browse Listings
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-transform hover:-translate-y-1"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props / How It Works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground">Simplify your real estate journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <Search className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">Browse Listings</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find your dream home from our curated selection of premium properties. Filter by what matters to you.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <Users className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">Collaborate</h3>
              <p className="text-muted-foreground leading-relaxed">
                Work closely with your realtor, lender, and inspectors. Share notes and documents securely.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <RefreshCcw className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">Stay in Sync</h3>
              <p className="text-muted-foreground leading-relaxed">
                Never miss a beat. Real-time updates, chat, and task tracking ensure a smooth closing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}