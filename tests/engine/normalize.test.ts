import { describe, expect, it } from "vitest";
import { extractStatus, normalizeStatus, watchFingerprint } from "../../convex/engine/normalize";

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

  it("fingerprints status lines and ignores viewstate noise", () => {
    const a = "Status: Issued\nPermit BLD-1\n__VIEWSTATE=aaa\n";
    const b = "Status: Issued\nPermit BLD-1\n__VIEWSTATE=bbb\n";
    const c = "Status: Comments Emailed\nPermit BLD-1\n__VIEWSTATE=ccc\n";
    expect(watchFingerprint(a)).toBe(watchFingerprint(b));
    expect(watchFingerprint(a)).not.toBe(watchFingerprint(c));
    expect(extractStatus(a)).toBe("Issued");
  });
});
