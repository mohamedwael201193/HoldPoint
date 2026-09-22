import { describe, expect, it } from "vitest";
import { hashesEqual, sha256Hex } from "../../convex/engine/hash";

describe("content hash", () => {
  it("matches the published SHA-256 of abc", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("treats identical hashes as equal", async () => {
    const a = await sha256Hex("permit-status");
    const b = await sha256Hex("permit-status");
    expect(hashesEqual(a, b)).toBe(true);
    expect(hashesEqual(a, await sha256Hex("other"))).toBe(false);
  });
});
