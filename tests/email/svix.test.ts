import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySvixSignature } from "../../convex/model/svix";

describe("svix verification", () => {
  const secretBytes = Buffer.from("holdpoint-webhook-test-secret");
  const secret = `whsec_${secretBytes.toString("base64")}`;
  const id = "msg_123";
  const timestamp = "1700000000";
  const body = '{"event_type":"message.received"}';
  const digest = createHmac("sha256", secretBytes)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");

  it("accepts a valid v1 signature", async () => {
    expect(
      await verifySvixSignature({
        secret,
        id,
        timestamp,
        body,
        signatureHeader: `v1,${digest}`,
        nowSeconds: 1700000000,
      }),
    ).toBe(true);
  });

  it("rejects a tampered body", async () => {
    expect(
      await verifySvixSignature({
        secret,
        id,
        timestamp,
        body: '{"event_type":"forged"}',
        signatureHeader: `v1,${digest}`,
        nowSeconds: 1700000000,
      }),
    ).toBe(false);
  });

  it("rejects stale timestamps", async () => {
    expect(
      await verifySvixSignature({
        secret,
        id,
        timestamp,
        body,
        signatureHeader: `v1,${digest}`,
        nowSeconds: 1700000000 + 301,
      }),
    ).toBe(false);
  });
});
