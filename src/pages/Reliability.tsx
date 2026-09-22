import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatStamp } from "../lib/format";

export default function ReliabilityPage() {
  const proofs = useQuery(api.reliability.list);
  const runSuite = useMutation(api.reliability.runSuite);

  if (proofs === undefined) return <p className="text-mute">Loading proofs…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Reliability proofs</h1>
          <p className="mt-2 max-w-xl text-sm text-mute">
            These rows are written by the suite in Convex. Counts are not invented.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-ink px-4 py-2 text-sm text-ground"
          onClick={() => void runSuite({})}
        >
          Run suite
        </button>
      </div>
      {proofs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-mute">
          No proofs stored yet.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {proofs.map((row) => (
            <li key={row._id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_2fr_auto]">
              <p className="text-sm">{row.attack}</p>
              <p className="text-sm text-mute">
                expected {row.expectedBehavior} · actual {row.actualBehavior}
              </p>
              <p className={`text-sm ${row.passed ? "text-emerald-300" : "text-red-300"}`}>
                {row.passed ? "passed" : "failed"} · {formatStamp(row.ranAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
