import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatStamp } from "../lib/format";

export default function Inbox() {
  const inbound = useQuery(api.mail.listInbound);
  const outbound = useQuery(api.mail.listOutbound);

  if (inbound === undefined || outbound === undefined) {
    return <p className="text-mute">Loading mailbox ledgers…</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Mailbox ledger</h1>
      <p className="max-w-2xl text-sm leading-relaxed text-mute">
        Inbound events are deduplicated on provider message id. Outbound rows are keyed by
        idempotency. Seeded trade addresses ending in example.invalid are never sent live.
      </p>
      <section>
        <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Inbound</h2>
        {inbound.length === 0 ? (
          <p className="mt-3 text-sm text-mute">No inbound events recorded.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
            {inbound.map((row) => (
              <li key={row._id} className="px-4 py-3">
                <p className="text-sm">{row.subject}</p>
                <p className="mt-1 text-xs text-mute">
                  {row.fromEmail} · {row.intent ?? "unparsed"} · {row.routedToken ?? "unrouted"} ·{" "}
                  {formatStamp(row.receivedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-sm tracking-[0.16em] text-mute uppercase">Outbound</h2>
        {outbound.length === 0 ? (
          <p className="mt-3 text-sm text-mute">No sends recorded.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
            {outbound.map((row) => (
              <li key={row._id} className="px-4 py-3">
                <p className="text-sm">{row.subject}</p>
                <p className="mt-1 text-xs text-mute">
                  {row.toEmail} · {row.status} · {formatStamp(row.sentAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
