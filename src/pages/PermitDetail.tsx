import { useAction, useMutation, useQuery } from "convex/react";
import { useParams } from "react-router";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import StatusChip from "../components/StatusChip";
import { formatDay, formatStamp, shortHash } from "../lib/format";

export default function PermitDetail() {
  const { permitId } = useParams();
  const id = permitId as Id<"permits"> | undefined;
  const detail = useQuery(api.permits.get, id ? { permitId: id } : "skip");
  const fetchOne = useAction(api.watches.fetchOne);
  const write = useMutation(api.plans.write);
  const fail = useMutation(api.inspections.markFailed);
  const ingest = useAction(api.comments.ingest);
  const simulate = useAction(api.mail.simulateInbound);

  if (!id) return <p className="text-mute">Missing permit.</p>;
  if (detail === undefined) return <p className="text-mute">Loading permit…</p>;
  if (detail === null) {
    return <p className="text-mute">Permit not found. It was never invented.</p>;
  }

  const { permit, city, inspections, plan, assignments, sources, activity } = detail;
  const pendingFail = inspections.find((row) => row.status === "pending" || row.status === "scheduled");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-ember">{permit.routingToken}</p>
          <h1 className="mt-2 text-3xl font-semibold">{permit.projectName}</h1>
          <p className="mt-2 text-sm text-mute">
            {permit.permitNumber} · {city?.name}, {city?.state} · {city?.portalKind}
          </p>
        </div>
        <StatusChip value={permit.statusSemantic ?? "unknown"} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-ink px-4 py-2 text-sm text-ground"
          onClick={() => void fetchOne({ permitId: id })}
        >
          Fetch public source
        </button>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm"
          onClick={() => void write({ permitId: id, expectedRevision: permit.constraintRevision })}
        >
          Write schedule
        </button>
        {pendingFail ? (
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm"
            onClick={() =>
              void fail({
                inspectionId: pendingFail._id,
                expectedRevision: permit.constraintRevision,
                excerpt: "Inspector marked failed on public record (demo trigger).",
              })
            }
          >
            Mark next inspection failed
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm"
          onClick={() =>
            void ingest({
              permitId: id,
              sourceKind: "forwardedEmail",
              text: "Provide revised structural calculations for the east footing. Insulation inspection is required after rough-in.",
            })
          }
        >
          Ingest reviewer letter
        </button>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm"
          onClick={() =>
            void simulate({
              fromEmail: "trades-electrical@example.invalid",
              subject: `[${permit.routingToken}] window`,
              body: "Unavailable 2026-10-01 to 2026-10-05",
              providerMessageId: `demo-${Date.now()}`,
            })
          }
        >
          Simulate trade reply
        </button>
      </div>

      {permit.lastScrapeError ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Source fetch failed. Last verified status kept. {permit.lastScrapeError}
        </p>
      ) : null}

      <section>
        <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Source evidence</h2>
        {permit.sourceUrl ? (
          <a className="mt-2 block break-all text-sm text-ember" href={permit.sourceUrl}>
            {permit.sourceUrl}
          </a>
        ) : (
          <p className="mt-2 text-sm text-mute">No source URL.</p>
        )}
        <p className="mt-2 font-mono text-xs text-mute">
          hash {shortHash(permit.contentHash)} · scrapes {permit.scrapeCount} · last{" "}
          {formatStamp(permit.lastScrapeAt)}
        </p>
        {sources[0] ? (
          <pre className="mt-4 max-h-48 overflow-auto rounded-2xl border border-line bg-ground p-4 text-xs leading-relaxed text-mute">
            {sources[0].markdown.slice(0, 1200)}
          </pre>
        ) : (
          <p className="mt-4 text-sm text-mute">No snapshot stored yet.</p>
        )}
      </section>

      <section>
        <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Inspections</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
          {inspections.map((row) => (
            <li key={row._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="font-mono text-sm">{row.code}</span>
              <StatusChip value={row.status} />
              <span className="text-xs text-mute">{formatDay(row.scheduledFor)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Current plan</h2>
        {plan ? (
          <p className="mt-3 text-sm text-mute">
            r{plan.revision} · closing {formatDay(plan.closingDate)} · {plan.criticalPathDays} days
            {plan.provenExact ? " · exact" : ""}
          </p>
        ) : (
          <p className="mt-3 text-sm text-mute">No plan written yet.</p>
        )}
        <ul className="mt-3 space-y-2">
          {assignments.map((row) => (
            <li key={row._id} className="rounded-xl border border-line px-4 py-3 text-sm">
              {formatDay(row.windowStart)} → {formatDay(row.windowEnd)} · {row.state}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Activity</h2>
        <ol className="mt-3 space-y-2">
          {activity.map((row) => (
            <li key={row._id} className="rounded-xl border border-line px-4 py-3">
              <p className="text-sm">{row.summary}</p>
              <p className="mt-1 text-xs text-mute">
                {row.sponsor} · {row.kind} · {formatStamp(row.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
