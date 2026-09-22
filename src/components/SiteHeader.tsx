import type { ReactNode } from "react";
import { NavLink } from "react-router";

const LINKS = [
  { to: "/", label: "Product" },
  { to: "/app", label: "Operations" },
  { to: "/judges", label: "Judges" },
];

export default function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-ground/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <NavLink to="/" className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-line bg-panel text-[11px] font-semibold tracking-[0.14em] text-ember">
            HP
          </span>
          <span className="text-[13px] font-semibold tracking-[0.22em] uppercase">
            HoldPoint
          </span>
        </NavLink>
        <nav className="flex items-center gap-1 text-sm text-mute">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 transition ${
                  isActive ? "bg-panel text-ink" : "hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        {!compact ? (
          <NavLink to="/app" className="hidden rounded-full bg-ink px-4 py-2 text-sm font-medium text-ground sm:block">
            Open the board
          </NavLink>
        ) : (
          <span className="hidden text-xs tracking-[0.18em] text-mute uppercase sm:block">
            Live ops
          </span>
        )}
      </div>
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-ground text-ink">{children}</div>;
}
