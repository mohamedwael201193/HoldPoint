export type SendResult =
  | { ok: true; messageId: string; threadId?: string }
  | { ok: false; status: number; error: string };

export function agentMailSendUrl(inboxId: string): string {
  return `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`;
}

export function agentMailIdempotencyKey(...parts: string[]): string {
  const cleaned = parts
    .map((part) => part.replace(/[^A-Za-z0-9._~-]+/g, "-"))
    .filter((part) => part.length > 0)
    .join(".");
  return cleaned.slice(0, 200);
}

export function isLabeledDemoAddress(email: string): boolean {
  return email.toLowerCase().endsWith("@example.invalid");
}

export async function sendInboxMessage(args: {
  inboxId: string;
  apiKey: string;
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
}): Promise<SendResult> {
  const response = await fetch(agentMailSendUrl(args.inboxId), {
    method: "POST",
    headers: {
      authorization: `Bearer ${args.apiKey}`,
      "content-type": "application/json",
      "idempotency-key": args.idempotencyKey,
    },
    body: JSON.stringify({
      to: [args.to],
      subject: args.subject,
      text: args.text,
    }),
  });
  const body = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: body.slice(0, 500) || response.statusText,
    };
  }
  try {
    const json = JSON.parse(body) as { message_id?: string; thread_id?: string };
    if (!json.message_id) {
      return { ok: false, status: response.status, error: "missing message_id" };
    }
    return { ok: true, messageId: json.message_id, threadId: json.thread_id };
  } catch {
    return { ok: false, status: response.status, error: "invalid JSON from provider" };
  }
}

export type InboundMessage = {
  eventId: string;
  eventType: string;
  fromEmail: string;
  subject: string;
  body: string;
  providerMessageId: string;
};

export function parseInboundPayload(raw: string): InboundMessage | null {
  try {
    const json = JSON.parse(raw) as {
      event_id?: string;
      event_type?: string;
      message?: {
        from_?: string[] | string;
        from?: string[] | string;
        subject?: string;
        text?: string;
        preview?: string;
        message_id?: string;
      };
    };
    const message = json.message;
    if (!message) return null;
    const fromRaw = message.from_ ?? message.from ?? "";
    const fromEmail = Array.isArray(fromRaw) ? (fromRaw[0] ?? "") : fromRaw;
    const providerMessageId = message.message_id ?? json.event_id ?? "";
    if (!providerMessageId) return null;
    return {
      eventId: json.event_id ?? providerMessageId,
      eventType: json.event_type ?? "message.received",
      fromEmail,
      subject: message.subject ?? "",
      body: message.text ?? message.preview ?? "",
      providerMessageId,
    };
  } catch {
    return null;
  }
}
