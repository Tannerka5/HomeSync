import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Menu, 
  MessageCircle, 
  X, 
  LogOut, 
  User as UserIcon,
  ChevronRight,
  MessageSquare,
  Home,
  Search,
  ClipboardList
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { NAVIGATION_ITEMS, MOCK_USER } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
    {/* Header */}
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto px-6 h-20 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
        <img src="/logo.png" alt="HomeSync" className="h-10 md:h-12 w-auto object-contain" />
        <span className="font-heading font-bold text-2xl text-primary tracking-tight hidden sm:block">
          HomeSync
        </span>
      </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAVIGATION_ITEMS.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location === item.path ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Separator orientation="vertical" className="h-6" />
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
          </nav>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 border-l border-border/50 shadow-2xl">
              <div className="flex flex-col h-full">
                <div className="p-6 pb-2">
                   <div className="flex items-center gap-2 mb-6">
                    <img src="/logo.png" alt="HomeSync" className="h-8 w-auto" />
                    <span className="font-heading font-bold text-xl text-primary">HomeSync</span>
                   </div>
                   
                   {/* User Profile Snippet in Menu */}
                   <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 mb-6">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={MOCK_USER.avatar} />
                      <AvatarFallback>AJ</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{MOCK_USER.name}</p>
                      <p className="text-xs text-muted-foreground truncate">View Profile</p>
                    </div>
                   </div>
                </div>

                <div className="px-4 flex-1 overflow-y-auto">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Explore</h4>
                      {NAVIGATION_ITEMS.slice(0, 3).map((item) => (
                        <Link key={item.path} href={item.path} onClick={() => setOpen(false)}>
                          <div className={cn(
                            "flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-muted group",
                            location === item.path ? "bg-primary/10" : "bg-transparent"
                          )}>
                            <div className={cn(
                              "p-2 rounded-md transition-colors",
                              location === item.path ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:text-foreground"
                            )}>
                              <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className={cn(
                                "font-medium text-sm",
                                location === item.path ? "text-primary" : "text-foreground"
                              )}>
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
                      <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Communicate</h4>
                      <Link href="/chat" onClick={() => setOpen(false)}>
                        <div className={cn(
                          "flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-muted group",
                          location === "/chat" ? "bg-primary/10" : "bg-transparent"
                        )}>
                          <div className={cn(
                            "p-2 rounded-md transition-colors",
                            location === "/chat" ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:text-foreground"
                          )}>
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium text-sm",
                              location === "/chat" ? "text-primary" : "text-foreground"
                            )}>
                              Chat
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              Connect with your team
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div className="space-y-1">
                      <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</h4>
                      <Link href="/login" onClick={() => setOpen(false)}>
                        <div className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-muted group">
                          <div className="p-2 rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
                            <LogOut className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Login / Logout</p>
                            <p className="text-xs text-muted-foreground">Access your workspace</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t bg-muted/20">
                  <p className="text-xs text-center text-muted-foreground">
                    &copy; 2025 HomeSync Inc.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Chat FAB */}
      <Link href="/chat">
        <Button 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-accent hover:scale-105 transition-all z-50 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </Link>
    </div>
  );
}