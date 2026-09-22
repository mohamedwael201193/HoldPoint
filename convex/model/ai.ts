import { extractRequirementCandidates, parseTradeReply, type ParsedTradeReply } from "../engine/intent";

export type RequirementDraft = {
  text: string;
  quote: string;
  evidenceRequired: string;
};

export type LanguageResult<T> = {
  engine: "openai" | "gemini" | "rules";
  value: T;
};

type ChatJson = {
  engine: "openai" | "gemini";
  text: string;
};

export async function extractRequirements(source: string): Promise<LanguageResult<RequirementDraft[]>> {
  const prompt = [
    "Extract permit reviewer requirements from the source.",
    "Return JSON {\"requirements\":[{\"text\":\"...\",\"quote\":\"exact substring from source\",\"evidenceRequired\":\"...\"}]}.",
    "quote MUST be copied verbatim from the source. Do not invent requirements.",
    "Source:",
    source.slice(0, 12_000),
  ].join("\n");

  const chat = await completeJson(prompt);
  if (chat) {
    const parsed = parseRequirements(chat.text);
    if (parsed) return { engine: chat.engine, value: parsed };
  }
  return {
    engine: "rules",
    value: extractRequirementCandidates(source).map((row) => ({
      text: row.text,
      quote: row.quote,
      evidenceRequired: "Reviewer letter",
    })),
  };
}

export async function parseTradeReplyWithLanguage(body: string): Promise<LanguageResult<ParsedTradeReply>> {
  const rules = parseTradeReply(body);
  const prompt = [
    "Classify a construction trade email reply.",
    "Return JSON {\"intent\":\"confirm|decline|unavailable|reschedule|unknown\",\"quote\":\"verbatim\"}.",
    "Do not output dates. Deterministic code owns calendars.",
    "Email:",
    body.slice(0, 4000),
  ].join("\n");
  const chat = await completeJson(prompt);
  if (!chat) return { engine: "rules", value: rules };
  try {
    const raw = JSON.parse(stripFence(chat.text)) as { intent?: string; quote?: string };
    const intent = isIntent(raw.intent) ? raw.intent : rules.intent;
    return {
      engine: chat.engine,
      value: {
        ...rules,
        intent,
        quote: typeof raw.quote === "string" && raw.quote.length >= 8 ? raw.quote : rules.quote,
      },
    };
  } catch {
    return { engine: "rules", value: rules };
  }
}

export async function draftChaseEmail(input: {
  tradeName: string;
  inspectionCode: string;
  windowLabel: string;
  routingToken: string;
  projectName: string;
}): Promise<LanguageResult<{ subject: string; body: string }>> {
  const fallback = {
    subject: `${input.routingToken} ${input.inspectionCode} window`,
    body: [
      `Hello ${input.tradeName},`,
      "",
      `HoldPoint repaired the inspection plan for ${input.projectName}.`,
      `Your ${input.inspectionCode} window is now ${input.windowLabel}.`,
      `Reply to this thread with ${input.routingToken} to confirm, decline, or send unavailable dates as YYYY-MM-DD to YYYY-MM-DD.`,
      "",
      "HoldPoint — standing watch for permits and inspections",
    ].join("\n"),
  };
  const prompt = [
    "Draft a short construction-trade coordination email. JSON {\"subject\":\"...\",\"body\":\"...\"}.",
    "Do not invent dates beyond the provided window label. Include the routing token exactly.",
    JSON.stringify(input),
  ].join("\n");
  const chat = await completeJson(prompt);
  if (!chat) return { engine: "rules", value: fallback };
  try {
    const raw = JSON.parse(stripFence(chat.text)) as { subject?: string; body?: string };
    if (typeof raw.subject === "string" && typeof raw.body === "string") {
      if (!raw.body.includes(input.routingToken) || !raw.body.includes(input.windowLabel)) {
        return { engine: "rules", value: fallback };
      }
      return { engine: chat.engine, value: { subject: raw.subject, body: raw.body } };
    }
  } catch {
    /* fall through */
  }
  return { engine: "rules", value: fallback };
}

async function completeJson(prompt: string): Promise<ChatJson | null> {
  const openai = process.env.OPENAI_API_KEY;
  if (openai) {
    const text = await openaiJson(openai, prompt);
    if (text) return { engine: "openai", text };
  }
  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) {
    const text = await geminiJson(gemini, prompt);
    if (text) return { engine: "gemini", text };
  }
  return null;
}

async function openaiJson(apiKey: string, prompt: string): Promise<string | null> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return only valid JSON. Never invent source quotes." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) return null;
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? null;
}

async function geminiJson(apiKey: string, prompt: string): Promise<string | null> {
  const models = ["gemini-2.5-flash", "gemini-3.6-flash"];
  for (const model of models) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
      `?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
    });
    if (!response.ok) continue;
    const json = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
  }
  return null;
}

function parseRequirements(text: string): RequirementDraft[] | null {
  try {
    const raw = JSON.parse(stripFence(text)) as {
      requirements?: { text?: string; quote?: string; evidenceRequired?: string }[];
    };
    if (!Array.isArray(raw.requirements)) return null;
    return raw.requirements
      .filter((row) => typeof row.text === "string" && typeof row.quote === "string")
      .map((row) => ({
        text: row.text!,
        quote: row.quote!,
        evidenceRequired: row.evidenceRequired ?? "Reviewer letter",
      }));
  } catch {
    return null;
  }
}

function stripFence(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

function isIntent(
  value: string | undefined,
): value is ParsedTradeReply["intent"] {
  return (
    value === "confirm" ||
    value === "decline" ||
    value === "unavailable" ||
    value === "reschedule" ||
    value === "unknown"
  );
}
