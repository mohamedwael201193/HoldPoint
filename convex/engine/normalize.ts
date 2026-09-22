const ACCELA: Record<string, string> = {
  issued: "progressed",
  "ready for pickup": "progressed",
  "in review": "informational",
  "under review": "informational",
  "comments emailed": "action_required",
  "revise & resubmit": "action_required",
  "cor – revise & resubmit": "action_required",
  failed: "failed",
  "inspection failed": "failed",
  finaled: "progressed",
  "finaled / closed": "progressed",
  expired: "stalled",
  void: "stalled",
};

export type SemanticStatus =
  | "progressed"
  | "stalled"
  | "action_required"
  | "failed"
  | "informational"
  | "unknown";

export function normalizeStatus(
  raw: string,
  vocabulary: { raw: string; semantic: string }[] = [],
): SemanticStatus {
  const key = raw.replace(/\s+/g, " ").trim().toLowerCase();
  const learned = vocabulary.find((row) => row.raw.trim().toLowerCase() === key);
  if (learned && isSemantic(learned.semantic)) return learned.semantic;
  for (const [needle, semantic] of Object.entries(ACCELA)) {
    if (key.includes(needle)) return semantic as SemanticStatus;
  }
  return "unknown";
}

export function extractStatus(markdown: string): string | null {
  const match = markdown.match(/Status[:\s]+([A-Za-z0-9 &/–-]+)/i);
  const value = match?.[1]?.trim();
  return value && value.length > 1 ? value : null;
}

export function watchFingerprint(markdown: string): string {
  const status = extractStatus(markdown) ?? "";
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) =>
      /status|permit|record|inspection|issued|review|finaled|comments emailed/i.test(line),
    )
    .filter((line) => !/__viewstate|requestverificationtoken|aspnetform/i.test(line))
    .slice(0, 40);
  return `${status}\n${lines.join("\n")}`.toLowerCase();
}

function isSemantic(value: string): value is SemanticStatus {
  return (
    value === "progressed" ||
    value === "stalled" ||
    value === "action_required" ||
    value === "failed" ||
    value === "informational" ||
    value === "unknown"
  );
}
