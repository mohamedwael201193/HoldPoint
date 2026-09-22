export type TradeIntent =
  | "confirm"
  | "decline"
  | "unavailable"
  | "reschedule"
  | "unknown";

export type ParsedTradeReply = {
  intent: TradeIntent;
  quote: string;
  unavailableFrom: number | null;
  unavailableTo: number | null;
  needsHumanReview: boolean;
};

const ISO_RANGE =
  /(\d{4}-\d{2}-\d{2})\s*(?:to|-|through)\s*(\d{4}-\d{2}-\d{2})/i;

export function parseTradeReply(body: string): ParsedTradeReply {
  const text = body.replace(/\s+/g, " ").trim();
  const quote = text.slice(0, 280);
  const lower = text.toLowerCase();
  const range = text.match(ISO_RANGE);

  let unavailableFrom: number | null = null;
  let unavailableTo: number | null = null;
  if (range) {
    unavailableFrom = Date.parse(`${range[1]}T00:00:00.000Z`);
    unavailableTo = Date.parse(`${range[2]}T00:00:00.000Z`);
    if (!Number.isFinite(unavailableFrom) || !Number.isFinite(unavailableTo)) {
      unavailableFrom = null;
      unavailableTo = null;
    }
  }

  if (/\b(confirm(ed)?|works for us|we can make it)\b/i.test(lower)) {
    return {
      intent: "confirm",
      quote,
      unavailableFrom: null,
      unavailableTo: null,
      needsHumanReview: false,
    };
  }
  if (/\b(declin(e|ed)|cannot take this|pass on this)\b/i.test(lower)) {
    return {
      intent: "decline",
      quote,
      unavailableFrom: null,
      unavailableTo: null,
      needsHumanReview: false,
    };
  }
  if (/\b(reschedule|move (the )?window)\b/i.test(lower)) {
    return {
      intent: "reschedule",
      quote,
      unavailableFrom,
      unavailableTo,
      needsHumanReview: unavailableFrom === null,
    };
  }
  if (/\b(unavailable|out of town|can't make|cannot make)\b/i.test(lower)) {
    return {
      intent: "unavailable",
      quote,
      unavailableFrom,
      unavailableTo,
      needsHumanReview: unavailableFrom === null,
    };
  }
  return {
    intent: "unknown",
    quote,
    unavailableFrom: null,
    unavailableTo: null,
    needsHumanReview: true,
  };
}

export function extractRequirementCandidates(source: string): { text: string; quote: string }[] {
  const sentences = source
    .split(/(?<=[.!?])\s+/)
    .map((row) => row.replace(/\s+/g, " ").trim())
    .filter((row) => row.length >= 12);
  const hits = sentences.filter((row) =>
    /\b(shall|must|required|provide|submit|revise)\b/i.test(row),
  );
  return hits.slice(0, 8).map((row) => ({ text: row, quote: row }));
}
