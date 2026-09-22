import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import StatusChip from "../components/StatusChip";
import SiteHeader, { PageShell } from "../components/SiteHeader";
import { formatDay, formatStamp, shortHash } from "../lib/format";
import { convexUrl } from "../lib/convex";

const LIVE =
  typeof window !== "undefined" ? window.location.origin : "https://kindhearted-cheetah-121.convex.site";

export default function Judges() {
  const snapshot = useQuery(api.judges.snapshot);
  const providers = useQuery(api.health.providers);
  const bootstrap = useAction(api.demo.bootstrap);
  const proveLiveSend = useAction(api.mail.proveLiveSend);
  const [liveSend, setLiveSend] = useState<string | null>(null);

  return (
    <PageShell>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 px-5 py-12">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-ember uppercase">Judge path</p>
          <h1 className="mt-3 text-4xl font-semibold">HoldPoint, inspectable</h1>
          <p className="mt-4 max-w-2xl text-mute leading-relaxed">
            Standing watch for construction permits and inspections. Everything below is live
            Convex state or an honest empty. No fabricated metrics.
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="Live deployment" value={LIVE} href={LIVE} />
          <Fact label="Health" value={`${LIVE}/health`} href={`${LIVE}/health`} />
          <Fact label="GitHub" value="github.com/mohamedwael201193/HoldPoint" href="https://github.com/mohamedwael201193/HoldPoint" />
          <Fact label="Convex cloud" value={convexUrl || "not injected yet"} />
        </dl>

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Sponsor usage</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li>Firecrawl: public Accela fetch + content hash. Key present: {yn(providers?.firecrawl)}</li>
            <li>OpenAI: structured extract/draft. Key present: {yn(providers?.openai)}</li>
            <li>Gemini fallback: {yn(providers?.gemini)} (emergency only)</li>
            <li>AgentMail REST: {yn(providers?.agentmail)} · inbox {yn(providers?.agentmailInbox)} · webhook {yn(providers?.agentmailWebhook)}</li>
            <li>Language engine in use: {providers?.primaryLanguage ?? "unknown"}</li>
            <li>Convex: schema, live queries, crons, workpools, workflows, HTTP</li>
          </ul>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Demo path</h2>
            <button
              type="button"
              className="rounded-full bg-ink px-4 py-2 text-sm text-ground"
              onClick={() => void bootstrap({})}
            >
              Seed / refresh demo
            </button>
            <button
              type="button"
              className="rounded-full border border-line px-4 py-2 text-sm"
              onClick={() => {
                void proveLiveSend({}).then((result) =>
                  setLiveSend(
                    result.ok
                      ? result.duplicate
                        ? "Live send already recorded today (idempotent)."
                        : "Live AgentMail send succeeded."
                      : `Live send blocked: ${result.reason ?? "unknown"}`,
                  ),
                );
              }}
            >
              Prove live send
            </button>
          </div>
          {liveSend ? <p className="mt-3 text-sm text-ember">{liveSend}</p> : null}
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-mute">
            <li>Open operations and seed the labeled Indianapolis Accela workspace.</li>
            <li>Fetch the public source. Unchanged hashes skip language spend.</li>
            <li>Write the inspection schedule in the mutation.</li>
            <li>Ingest the reviewer letter; unverified quotes stay held.</li>
            <li>Simulate a trade reply with ISO dates; the plan repairs.</li>
            <li>Run the reliability suite on this page.</li>
          </ol>
        </section>

        {!snapshot ? (
          <p className="text-mute">Connecting to Convex…</p>
        ) : !snapshot.permit ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-mute">
            No permit in this deployment yet. Use Seed / refresh demo.
          </p>
        ) : (
          <>
            <section>
              <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Current permit</h2>
              <p className="mt-3 text-lg">{snapshot.permit.projectName}</p>
              <p className="mt-1 font-mono text-sm text-mute">
                {snapshot.permit.permitNumber} · {snapshot.permit.routingToken}
              </p>
              <div className="mt-3">
                <StatusChip value={snapshot.permit.statusSemantic ?? "unknown"} />
              </div>
              <p className="mt-3 break-all text-sm text-ember">{snapshot.permit.sourceUrl}</p>
              <p className="mt-2 font-mono text-xs text-mute">
                hash {shortHash(snapshot.permit.contentHash)}
              </p>
            </section>

            <section>
              <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Schedule</h2>
              {snapshot.plan ? (
                <p className="mt-3 text-sm text-mute">
                  r{snapshot.plan.revision} closing {formatDay(snapshot.plan.closingDate)} ·{" "}
                  {snapshot.plan.criticalPathDays} days
                </p>
              ) : (
                <p className="mt-3 text-sm text-mute">No plan yet.</p>
              )}
            </section>

            <section>
              <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Activity</h2>
              <ol className="mt-3 space-y-2">
                {snapshot.activity.map((row) => (
                  <li key={row._id} className="rounded-xl border border-line px-4 py-3 text-sm">
                    {row.summary}
                    <span className="mt-1 block text-xs text-mute">
                      {row.sponsor} · {formatStamp(row.createdAt)}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Mailbox ledger</h2>
              {snapshot.outbound.length === 0 && snapshot.inbound.length === 0 ? (
                <p className="mt-3 text-sm text-mute">No mail ledger rows yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {snapshot.outbound.slice(0, 6).map((row) => (
                    <li key={row._id}>
                      out · {row.status} · {row.subject}
                    </li>
                  ))}
                  {snapshot.inbound.slice(0, 6).map((row) => (
                    <li key={row._id}>
                      in · {row.intent ?? "unparsed"} · {row.subject}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Reliability tests</h2>
              {snapshot.proofs.length === 0 ? (
                <p className="mt-3 text-sm text-mute">Suite has not been run in this deployment.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {snapshot.proofs.map((row) => (
                    <li key={row._id} className="text-sm">
                      {row.passed ? "pass" : "fail"} — {row.attack}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <section className="rounded-2xl border border-line p-5 text-sm text-mute">
          <h2 className="text-ink">Known limitations</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>One verified portal family: Accela public search (Indianapolis). Not multi-city.</li>
            <li>Demo trades use labeled invalid inboxes so we never email strangers.</li>
            <li>
              AgentMail live send is a loopback to the configured coordination inbox. Seeded trades
              stay skipped_demo.
            </li>
            <li>
              OpenAI is primary. If that key is absent, Gemini is the documented emergency fallback;
              if both are absent, the rules engine runs and this page says so.
            </li>
            <li>
              Accela search HTML includes volatile viewstate. The watch hashes status-bearing lines,
              not the raw page, so noise does not count as a permit change.
            </li>
            <li>No user login: the demo workspace is public, as the hackathon requires an uninvited URL.</li>
          </ul>
        </section>
      </main>
    </PageShell>
  );
}

function Fact({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-4">
      <dt className="text-[11px] tracking-[0.16em] text-mute uppercase">{label}</dt>
      <dd className="mt-2 break-all text-sm">
        {href ? (
          <a className="text-ember" href={href}>
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function yn(value: boolean | undefined) {
  if (value === undefined) return "…";
  return value ? "yes" : "no";
}
