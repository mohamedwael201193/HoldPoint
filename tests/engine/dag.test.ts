import { describe, expect, it } from "vitest";
import { DagError } from "../../convex/engine/types";
import { topologicalOrder } from "../../convex/engine/dag";

const base = {
  status: "pending" as const,
  typicalLeadDays: 1,
  durationDays: 1,
  tradeKind: "electrical",
};

describe("dag", () => {
  it("orders dependencies before dependents", () => {
    const ordered = topologicalOrder([
      { ...base, code: "final", dependsOn: ["insulation"] },
      { ...base, code: "site", dependsOn: [] },
      { ...base, code: "insulation", dependsOn: ["rough"] },
      { ...base, code: "rough", dependsOn: ["site"] },
    ]);
    expect(ordered.map((row) => row.code)).toEqual([
      "site",
      "rough",
      "insulation",
      "final",
    ]);
  });

  it("rejects cycles", () => {
    expect(() =>
      topologicalOrder([
        { ...base, code: "a", dependsOn: ["b"] },
        { ...base, code: "b", dependsOn: ["a"] },
      ]),
    ).toThrow(DagError);
  });
});
