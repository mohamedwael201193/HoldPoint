const TONE: Record<string, string> = {
  progressed: "bg-ember/15 text-ember",
  stalled: "bg-red-500/15 text-red-300",
  action_required: "bg-amber-500/15 text-amber-200",
  failed: "bg-red-500/20 text-red-200",
  informational: "bg-white/8 text-mute",
  unknown: "bg-white/8 text-mute",
  pending: "bg-white/8 text-mute",
  requested: "bg-amber-500/15 text-amber-200",
  scheduled: "bg-ember/15 text-ember",
  passed: "bg-emerald-500/15 text-emerald-200",
  open: "bg-amber-500/15 text-amber-200",
  unverified: "bg-red-500/15 text-red-200",
  sent: "bg-emerald-500/15 text-emerald-200",
  failed_send: "bg-red-500/15 text-red-200",
};

export default function StatusChip({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.12em] uppercase ${
        TONE[value] ?? "bg-white/8 text-mute"
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
