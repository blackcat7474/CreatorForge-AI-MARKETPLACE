"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Home, Film, Search } from "lucide-react";

export function BrandSideIcons() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      name: "Home",
      tooltip: "Brand Profile & Briefs",
      href: "/brand/profile",
      icon: Home,
      shortcut: "1",
    },
    {
      name: "Reels",
      tooltip: "Discovery Reels & Ratings",
      href: "/brand/reels",
      icon: Film,
      shortcut: "2",
      badge: "Feed",
    },
    {
      name: "Creator Search",
      tooltip: "Find AI Creators",
      href: "/brand/creators",
      icon: Search,
      shortcut: "3",
    },
  ];

  // Quick keyboard shortcuts: 1 for Home, 2 for Reels, 3 for Creator Search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "1") {
        router.push("/brand/profile");
      } else if (e.key === "2") {
        router.push("/brand/reels");
      } else if (e.key === "3") {
        router.push("/brand/creators");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <nav
      aria-label="Brand Side Navigation Icons"
      className="fixed left-3 sm:left-5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2.5 rounded-2xl border border-white/15 bg-[#0a0f1d]/90 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === "/brand/profile"
            ? pathname === "/brand/profile"
            : pathname.startsWith(item.href);

        const Icon = item.icon;

        return (
          <div key={item.href} className="relative group">
            <Link
              href={item.href}
              aria-label={item.name}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/40 ring-1 ring-white/30 scale-105"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />

              {/* Live badge dot for Reels */}
              {item.badge && !isActive && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-500" />
                </span>
              )}
            </Link>

            {/* Unique UX: Floating Right Tooltip Flyout on Hover */}
            <div className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 z-50 flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#0a0f1d] px-3 py-1.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl opacity-0 -translate-x-2 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap">
              <span>{item.name}</span>
              <span className="rounded border border-white/10 bg-white/5 px-1 py-0.2 text-[10px] font-mono text-slate-400">
                {item.shortcut}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// Aliases for compatibility across existing files
export const BrandLeftNav = BrandSideIcons;
export const BrandBottomNav = BrandSideIcons;

// Header nav helper (breadcrumbs)
export function BrandHeaderNav() {
  const pathname = usePathname();

  const links = [
    { name: "Home", href: "/brand/profile" },
    { name: "Reels", href: "/brand/reels" },
    { name: "Creators", href: "/brand/creators" },
  ];

  return (
    <nav className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {links.map((link) => {
        const isActive =
          link.href === "/brand/profile"
            ? pathname === "/brand/profile"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
