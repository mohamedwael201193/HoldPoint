import { Link } from "react-router";
import HeroWatch from "../components/HeroWatch";
import SiteHeader, { PageShell } from "../components/SiteHeader";

const SPONSORS = [
  {
    name: "Firecrawl",
    job: "Fetches the public permit page and hashes it. Unchanged pages never wake language models.",
  },
  {
    name: "Convex",
    job: "Durable state, revision guards, crons, workpools, HTTP webhooks, live UI.",
  },
  {
    name: "OpenAI",
    job: "Extracts reviewer requirements and drafts mail. Never decides dates or dependencies.",
  },
  {
    name: "AgentMail",
    job: "Shared inbox. Inbound replies route on [HP-TOKEN]. Outbound sends are ledgered.",
  },
];

export default function Landing() {
  return (
    <PageShell>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-12">
        <p className="text-[11px] tracking-[0.24em] text-ember uppercase">
          Construction permits · inspections · trades
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
          The standing watch for construction permits and inspections.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute">
          Cities post status changes without notifying anyone. HoldPoint watches the public
          record, recomputes the inspection schedule in deterministic code, and emails only the
          trades whose windows actually moved.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/app" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-ground">
            Open operations
          </Link>
          <Link
            to="/judges"
            className="rounded-full border border-line px-5 py-2.5 text-sm text-ink"
          >
            Judge path
          </Link>
        </div>

        <div className="mt-16">
          <HeroWatch />
        </div>

        <section className="mt-20 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">AI understands. Code decides.</h2>
            <p className="mt-4 leading-relaxed text-mute">
              A model may quote a reviewer letter. HoldPoint will not apply that requirement unless
              the quote exists in the source. Dates, DAG order, retries, and idempotency never leave
              TypeScript.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Two event streams, one machine.</h2>
            <p className="mt-4 leading-relaxed text-mute">
              Public portal watches and inbound trade mail converge on the same permit revision.
              A stale client cannot overwrite a newer plan.
            </p>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-sm tracking-[0.2em] text-mute uppercase">Sponsor map</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {SPONSORS.map((row) => (
              <li key={row.name} className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-sm font-semibold">{row.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-mute">{row.job}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-t border-line px-5 py-8 text-sm text-mute">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3">
          <span>HoldPoint</span>
          <span>Public records stay public. Secrets stay off the page.</span>
        </div>
      </footer>
    </PageShell>
  );
}
