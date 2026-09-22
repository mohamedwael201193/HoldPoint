import { describe, expect, it } from "vitest";
import { normalizeStatus } from "../../convex/engine/normalize";

describe("status normalization", () => {
  it("maps Accela-style comments to action_required", () => {
    expect(normalizeStatus("COR – Revise & Resubmit")).toBe("action_required");
    expect(normalizeStatus("Comments Emailed")).toBe("action_required");
  });

  it("maps failed inspections", () => {
    expect(normalizeStatus("Inspection Failed")).toBe("failed");
  });

  it("uses city vocabulary before heuristics", () => {
    expect(
      normalizeStatus("ZZ-HOLD", [{ raw: "ZZ-HOLD", semantic: "stalled" }]),
    ).toBe("stalled");
  });

  it("returns unknown rather than inventing", () => {
    expect(normalizeStatus("completely novel portal text xyz")).toBe("unknown");
  });
});
