import { NavLink, Outlet } from "react-router";
import SiteHeader, { PageShell } from "../components/SiteHeader";

const NAV = [
  { to: "/app", label: "Overview", end: true },
  { to: "/app/inbox", label: "Inbox" },
  { to: "/app/reliability", label: "Reliability" },
];

export default function AppShell() {
  return (
    <PageShell>
      <SiteHeader compact />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 lg:flex-row">
        <aside className="lg:w-48">
          <nav className="flex gap-2 lg:flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm ${
                    isActive ? "bg-panel text-ink" : "text-mute hover:text-ink"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </PageShell>
  );
}
