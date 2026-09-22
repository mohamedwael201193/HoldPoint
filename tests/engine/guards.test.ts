import { describe, expect, it } from "vitest";
import { alreadyRecorded, assertWritable, requireCurrentRevision } from "../../convex/guards";

describe("revision guards", () => {
  it("rejects a stale revision", () => {
    expect(() => requireCurrentRevision(3, 4)).toThrow(
      "The plan changed while you were looking at it",
    );
  });

  it("accepts a matching revision", () => {
    expect(() => requireCurrentRevision(4, 4)).not.toThrow();
  });

  it("refuses frozen permits", () => {
    expect(() => assertWritable(true)).toThrow("This permit is frozen");
  });

  it("treats an existing ledger row as already recorded", () => {
    expect(alreadyRecorded({ id: "1" })).toBe(true);
    expect(alreadyRecorded(null)).toBe(false);
  });
});
