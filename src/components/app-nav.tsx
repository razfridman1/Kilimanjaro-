"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Sparkles, Bookmark, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": Sparkles,
  "/saved": Bookmark,
};

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-display text-xl font-extrabold"
            dir="ltr"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="gradient-text">You the man!</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const Icon = NAV_ICONS[link.href] ?? Home;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 z-40 w-full border-t border-border/40 bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="container flex items-center justify-around py-2">
          {NAV_LINKS.map((link) => {
            const Icon = NAV_ICONS[link.href] ?? Home;
            const active = pathname === link.href;
            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      active && "scale-110",
                    )}
                  />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
