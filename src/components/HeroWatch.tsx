const STEPS = [
  { id: "portal", label: "Public city portal", detail: "Accela status page" },
  { id: "change", label: "Change detected", detail: "Content hash differs" },
  { id: "status", label: "Requirement / status", detail: "Quote-verified extract" },
  { id: "repair", label: "Schedule repair", detail: "Deterministic DAG" },
  { id: "notify", label: "Trade notified", detail: "Only windows that moved" },
];

const CHIPS = ["Issued", "Comments Emailed", "Inspection Failed", "Finaled"];

export default function HeroWatch() {
  return (
    <section
      aria-label="HoldPoint watch pipeline"
      className="relative overflow-hidden rounded-3xl border border-line bg-panel px-5 py-8 sm:px-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(236,232,220,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(236,232,220,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative">
        <p className="text-[11px] tracking-[0.22em] text-ember uppercase">Live watch concept</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <ol className="grid gap-3 sm:grid-cols-5">
            {STEPS.map((step, index) => (
              <li key={step.id} className="relative rounded-2xl border border-line bg-ground/70 p-4">
                <p className="font-mono text-[11px] text-ember">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-3 text-sm leading-snug">{step.label}</p>
                <p className="mt-2 text-xs text-mute">{step.detail}</p>
                <span className="hp-pulse mt-4 block h-1.5 w-1.5 rounded-full bg-ember" />
              </li>
            ))}
          </ol>
        </div>
        <svg className="mt-6 hidden h-10 w-full text-ember/70 sm:block" viewBox="0 0 1000 40" fill="none">
          <path
            className="hp-flow"
            d="M20 20 H980"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {[20, 260, 500, 740, 980].map((x) => (
            <circle key={x} cx={x} cy="20" r="4" fill="currentColor" />
          ))}
        </svg>
        <div className="mt-4 flex flex-wrap gap-2">
          {CHIPS.map((chip, index) => (
            <span
              key={chip}
              className="rounded-full border border-line px-3 py-1 text-xs text-mute"
              style={{ animationDelay: `${index * 0.9}s` }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
