import { useAction, useMutation, useQuery } from "convex/react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";
import StatusChip from "../components/StatusChip";
import { formatStamp } from "../lib/format";

export default function Dashboard() {
  const permits = useQuery(api.permits.list);
  const overview = useQuery(api.health.overview);
  const providers = useQuery(api.health.providers);
  const bootstrap = useAction(api.demo.bootstrap);
  const runProofs = useMutation(api.reliability.runSuite);

  if (permits === undefined) {
    return <p className="text-mute">Loading operations board…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-ember uppercase">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold">Standing watch</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-ink px-4 py-2 text-sm text-ground"
            onClick={() => void bootstrap({})}
          >
            Seed demo workspace
          </button>
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm"
            onClick={() => void runProofs({})}
          >
            Run reliability suite
          </button>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-4">
        <Stat label="Permits" value={overview?.permitCount ?? permits.length} />
        <Stat label="Watching" value={overview?.watching ?? "—"} />
        <Stat label="Scrapes" value={overview?.scrapeCount ?? "—"} />
        <Stat
          label="Language"
          value={providers?.primaryLanguage ?? "—"}
        />
      </dl>

      {permits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-8 text-mute">
          No permits yet. Seed the labeled demo workspace — it uses a real Accela public search URL
          and clearly marked demo trades.
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {permits.map((permit) => (
            <li key={permit._id}>
              <Link
                to={`/app/permits/${permit._id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-panel"
              >
                <div>
                  <p className="font-mono text-sm">{permit.permitNumber}</p>
                  <p className="mt-1 text-sm text-mute">
                    {permit.projectName} · {permit.cityName}, {permit.cityState}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusChip value={permit.statusSemantic ?? "unknown"} />
                  <span className="text-xs text-mute">
                    {permit.lastScrapeAt ? formatStamp(permit.lastScrapeAt) : "never fetched"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-4">
      <dt className="text-[11px] tracking-[0.16em] text-mute uppercase">{label}</dt>
      <dd className="mt-2 font-mono text-2xl">{value}</dd>
    </div>
  );
}
