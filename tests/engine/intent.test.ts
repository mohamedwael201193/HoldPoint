import { describe, expect, it } from "vitest";
import { parseTradeReply, extractRequirementCandidates } from "../../convex/engine/intent";

describe("trade reply parser", () => {
  it("confirms without touching calendars", () => {
    const parsed = parseTradeReply("We can make it Thursday. Confirmed.");
    expect(parsed.intent).toBe("confirm");
    expect(parsed.unavailableFrom).toBeNull();
    expect(parsed.needsHumanReview).toBe(false);
  });

  it("requires ISO dates before applying unavailability", () => {
    const vague = parseTradeReply("We are unavailable next week.");
    expect(vague.intent).toBe("unavailable");
    expect(vague.needsHumanReview).toBe(true);

    const exact = parseTradeReply("Unavailable 2026-10-01 to 2026-10-05");
    expect(exact.intent).toBe("unavailable");
    expect(exact.needsHumanReview).toBe(false);
    expect(exact.unavailableFrom).toBe(Date.parse("2026-10-01T00:00:00.000Z"));
    expect(exact.unavailableTo).toBe(Date.parse("2026-10-05T00:00:00.000Z"));
  });
});

describe("requirement candidates", () => {
  it("only extracts sentences with obligation language", () => {
    const rows = extractRequirementCandidates(
      "Hello. Provide revised structural calculations for the east footing. Have a nice day.",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].quote).toMatch(/revised structural calculations/i);
  });
});
