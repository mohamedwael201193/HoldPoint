const encoder = new TextEncoder();

export async function verifySvixSignature(args: {
  secret: string;
  id: string;
  timestamp: string;
  body: string;
  signatureHeader: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): Promise<boolean> {
  const tolerance = args.toleranceSeconds ?? 300;
  const now = args.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ts = Number(args.timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > tolerance) return false;

  const secretBytes = decodeSecret(args.secret);
  const signed = `${args.id}.${args.timestamp}.${args.body}`;
  const expected = await hmacSha256Base64(secretBytes, signed);
  const candidates = args.signatureHeader
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1,"))
    .map((part) => part.slice(3));

  let ok = false;
  for (const candidate of candidates) {
    if (timingSafeEqual(candidate, expected)) ok = true;
  }
  return ok;
}

function decodeSecret(secret: string): Uint8Array {
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSha256Base64(secret: Uint8Array, message: string): Promise<string> {
  const copy = new ArrayBuffer(secret.byteLength);
  new Uint8Array(copy).set(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    copy,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const bytes = new Uint8Array(mac);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
