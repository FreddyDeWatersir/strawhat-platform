"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/sources", label: "Wholesale" },
  { href: "/documents", label: "Documents" },
  { href: "/chat", label: "Chat" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-card-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            🎩
          </span>
          <div>
            <p className="text-sm font-semibold text-gold">Straw Hat Platform</p>
            <p className="text-xs text-muted">One Piece TCG ops</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-card-border hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="ml-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-border hover:text-foreground"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
