import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, MessageCircle, LogOut, MessageSquare, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { NAVIGATION_ITEMS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.email.split("@")[0]
    : "";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  async function handleLogout() {
    setOpen(false);
    await logout();
    setLocation("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b transition-all duration-300 backdrop-blur-md",
          scrolled
            ? "bg-background/70 border-border/40 shadow-sm"
            : "bg-transparent border-transparent",
        )}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            aria-label="HomeSync home"
          >
            <img
              src="/logo.png"
              alt=""
              className="h-9 md:h-10 w-auto object-contain"
            />
            <span className="font-heading font-bold text-xl text-primary tracking-tight hidden sm:block">
              HomeSync
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-200",
                  location === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <Link
                href="/profile"
                className={cn(
                  "text-sm font-medium px-3.5 py-1.5 rounded-full transition-all duration-200",
                  location === "/profile"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                Profile
              </Link>
            ) : null}

            <Separator orientation="vertical" className="h-6 mx-2" />

            {user ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[340px] p-0 border-l border-border/50 shadow-2xl"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-6 pb-2">
                  <div className="flex items-center gap-2 mb-6">
                    <img src="/logo.png" alt="" className="h-8 w-auto" />
                    <span className="font-heading font-bold text-xl text-primary">
                      HomeSync
                    </span>
                  </div>

                  {user ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-6">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                          {avatarInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden flex-1">
                        <p className="text-sm font-medium truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate capitalize">
                          {user.userType}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <Link href="/login" onClick={() => setOpen(false)}>
                        <Button className="w-full">Sign in</Button>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="px-4 flex-1 overflow-y-auto">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Explore
                      </h4>
                      {NAVIGATION_ITEMS.slice(0, 3).map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setOpen(false)}
                        >
                          <div
                            className={cn(
                              "flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-muted group cursor-pointer",
                              location === item.path
                                ? "bg-primary/10"
                                : "bg-transparent",
                            )}
                          >
                            <div
                              className={cn(
                                "p-2 rounded-md transition-colors",
                                location === item.path
                                  ? "bg-primary text-white"
                                  : "bg-muted text-muted-foreground group-hover:text-foreground",
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p
                                className={cn(
                                  "font-medium text-sm",
                                  location === item.path
                                    ? "text-primary"
                                    : "text-foreground",
                                )}
                              >
                                {item.label}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Communicate
                      </h4>
                      <Link href="/chat" onClick={() => setOpen(false)}>
                        <div
                          className={cn(
                            "flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-muted group cursor-pointer",
                            location === "/chat"
                              ? "bg-primary/10"
                              : "bg-transparent",
                          )}
                        >
                          <div
                            className={cn(
                              "p-2 rounded-md transition-colors",
                              location === "/chat"
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground group-hover:text-foreground",
                            )}
                          >
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div>
                            <p
                              className={cn(
                                "font-medium text-sm",
                                location === "/chat"
                                  ? "text-primary"
                                  : "text-foreground",
                              )}
                            >
                              Chat
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              Connect with your team
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>

                    {user && (
                      <div className="space-y-1">
                        <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Account
                        </h4>
                        <Link href="/profile" onClick={() => setOpen(false)}>
                          <div
                            className={cn(
                              "w-full flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-muted group cursor-pointer",
                              location === "/profile" ? "bg-primary/10" : "bg-transparent",
                            )}
                          >
                            <div
                              className={cn(
                                "p-2 rounded-md transition-colors",
                                location === "/profile"
                                  ? "bg-primary text-white"
                                  : "bg-muted text-muted-foreground group-hover:text-foreground",
                              )}
                            >
                              <User className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <p
                                className={cn(
                                  "font-medium text-sm",
                                  location === "/profile" ? "text-primary" : "text-foreground",
                                )}
                              >
                                Edit Profile
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Update account details
                              </p>
                            </div>
                          </div>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-muted group cursor-pointer"
                        >
                          <div className="p-2 rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
                            <LogOut className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">Sign out</p>
                            <p className="text-xs text-muted-foreground">
                              End your session
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t bg-muted/20">
                  <p className="text-xs text-center text-muted-foreground">
                    &copy; {new Date().getFullYear()} HomeSync Inc.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Link href="/chat">
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl hover:shadow-2xl bg-primary hover:bg-primary/90 hover:scale-105 transition-all z-50 flex items-center justify-center animate-pulse-ring"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </Link>
    </div>
  );
}
