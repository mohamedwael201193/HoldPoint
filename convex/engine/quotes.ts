export function normalizeQuote(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export function quoteExistsInSource(source: string, quote: string): boolean {
  const needle = normalizeQuote(quote);
  if (needle.length < 8) return false;
  return normalizeQuote(source).includes(needle);
}
