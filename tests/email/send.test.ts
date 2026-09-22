import { describe, expect, it } from "vitest";
import { agentMailSendUrl, agentMailIdempotencyKey, isLabeledDemoAddress } from "../../convex/model/agentmail";

describe("AgentMail send adapter", () => {
  it("uses the official messages/send path", () => {
    expect(agentMailSendUrl("devmo@agentmail.to")).toBe(
      "https://api.agentmail.to/v0/inboxes/devmo%40agentmail.to/messages/send",
    );
  });

  it("treats example.invalid as a labeled demo address", () => {
    expect(isLabeledDemoAddress("trades-electrical@example.invalid")).toBe(true);
    expect(isLabeledDemoAddress("devmo@agentmail.to")).toBe(false);
  });

  it("sanitizes idempotency keys to AgentMail's allowed charset", () => {
    expect(agentMailIdempotencyKey("live-loopback", "2026-09-22")).toBe("live-loopback.2026-09-22");
    expect(agentMailIdempotencyKey("notify", "id:with:colons", "rough-electrical")).toBe(
      "notify.id-with-colons.rough-electrical",
    );
  });
});
