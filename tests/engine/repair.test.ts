import { describe, expect, it } from "vitest";
import { notifyTargets, repair } from "../../convex/engine/repair";
import { schedule } from "../../convex/engine/schedule";
import type { InspectionInput, RepairDiff } from "../../convex/engine/types";

const NOW = Date.UTC(2026, 8, 22);

function ins(
  code: string,
  tradeKind: string,
  extra: Partial<InspectionInput> = {},
): InspectionInput {
  return {
    code,
    status: extra.status ?? "pending",
    dependsOn: extra.dependsOn ?? [],
    typicalLeadDays: extra.typicalLeadDays ?? 1,
    durationDays: extra.durationDays ?? 1,
    tradeKind,
    lockedWindow: extra.lockedWindow ?? null,
  };
}

describe("repair", () => {
  it("reports a closing-date delta when lead time grows", () => {
    const trades = [
      { id: "e1", kind: "electrical", unavailable: [] },
      { id: "i1", kind: "insulation", unavailable: [] },
    ];
    const original = schedule({
      now: NOW,
      inspections: [
        ins("rough", "electrical"),
        ins("insul", "insulation", { dependsOn: ["rough"], typicalLeadDays: 1 }),
      ],
      trades,
    });
    const { diff, result } = repair(
      {
        now: NOW,
        inspections: [
          ins("rough", "electrical"),
          ins("insul", "insulation", { dependsOn: ["rough"], typicalLeadDays: 5 }),
        ],
        trades,
      },
      original.assignments,
    );
    expect(result.closingDate).toBeGreaterThanOrEqual(original.closingDate);
    expect(diff.moved.some((row) => row.inspectionCode === "insul")).toBe(true);
  });

  it("lists only trades whose windows changed", () => {
    const diff: RepairDiff = {
      kept: [
        {
          inspectionCode: "site",
          tradeId: "g1",
          windowStart: NOW,
          windowEnd: NOW + 1,
        },
      ],
      moved: [
        {
          inspectionCode: "rough",
          tradeId: "e1",
          windowStart: NOW,
          windowEnd: NOW + 1,
        },
      ],
      added: [],
      dropped: [],
      closingDateDeltaDays: 1,
    };
    expect(notifyTargets(diff)).toEqual(["e1"]);
  });
});
