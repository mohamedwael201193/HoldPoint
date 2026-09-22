const TOKEN_RE = /\[HP-([A-Z0-9]{4,12})\]/i;

export function extractRoutingToken(text: string): string | null {
  const match = text.match(TOKEN_RE);
  if (!match?.[1]) return null;
  return `HP-${match[1].toUpperCase()}`;
}

export function formatRoutingToken(code: string): string {
  const cleaned = code.replace(/^HP-/, "").toUpperCase();
  return `[HP-${cleaned}]`;
}
