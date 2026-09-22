export function formatDay(ms: number | undefined | null): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(ms);
}

export function formatStamp(ms: number | undefined | null): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(ms);
}

export function shortHash(hash: string | undefined): string {
  if (!hash) return "none";
  return hash.slice(0, 10);
}
