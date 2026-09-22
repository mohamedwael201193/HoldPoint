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
