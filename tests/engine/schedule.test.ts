import { describe, expect, it } from "vitest";
import { schedule } from "../../convex/engine/schedule";
import {
  DAY_MS,
  InfeasibleScheduleError,
  type EngineInput,
  type InspectionInput,
  type TradeInput,
} from "../../convex/engine/types";

const NOW = Date.UTC(2026, 8, 22);

function inspection(
  code: string,
  extra: Partial<InspectionInput> & { tradeKind: string; dependsOn?: string[] },
): InspectionInput {
  return {
    code,
    status: "pending",
    dependsOn: extra.dependsOn ?? [],
    typicalLeadDays: extra.typicalLeadDays ?? 1,
    durationDays: extra.durationDays ?? 1,
    tradeKind: extra.tradeKind,
    lockedWindow: extra.lockedWindow ?? null,
    ...("status" in extra ? { status: extra.status! } : {}),
  };
}

function trade(id: string, kind: string, unavailable: TradeInput["unavailable"] = []): TradeInput {
  return { id, kind, unavailable };
}

function run(inspections: InspectionInput[], trades: TradeInput[]) {
  const input: EngineInput = { now: NOW, inspections, trades };
  return schedule(input);
}

describe("schedule", () => {
  it("preserves dependency order", () => {
    const result = run(
      [
        inspection("final", { tradeKind: "gc", dependsOn: ["insul"] }),
        inspection("insul", { tradeKind: "insulation", dependsOn: ["rough"] }),
        inspection("rough", { tradeKind: "electrical" }),
      ],
      [trade("e1", "electrical"), trade("i1", "insulation"), trade("g1", "gc")],
    );
    const byCode = Object.fromEntries(
      result.assignments.map((row) => [row.inspectionCode, row]),
    );
    expect(byCode.insul.windowStart).toBeGreaterThanOrEqual(byCode.rough.windowEnd);
    expect(byCode.final.windowStart).toBeGreaterThanOrEqual(byCode.insul.windowEnd);
    expect(result.violations).toEqual([]);
  });

  it("does not overlap the same trade", () => {
    const result = run(
      [
        inspection("a", { tradeKind: "electrical" }),
        inspection("b", { tradeKind: "electrical" }),
      ],
      [trade("e1", "electrical")],
    );
    const [first, second] = result.assignments;
    expect(
      first.windowStart < second.windowEnd && second.windowStart < first.windowEnd,
    ).toBe(false);
  });

  it("skips unavailable windows", () => {
    const blockedFrom = NOW;
    const blockedTo = NOW + 10 * DAY_MS;
    const result = run(
      [inspection("rough", { tradeKind: "electrical", typicalLeadDays: 0 })],
      [trade("e1", "electrical", [{ from: blockedFrom, to: blockedTo }])],
    );
    expect(result.assignments[0].windowStart).toBeGreaterThanOrEqual(blockedTo);
  });

  it("throws when no trade exists", () => {
    expect(() =>
      run([inspection("rough", { tradeKind: "electrical" })], [trade("p1", "plumbing")]),
    ).toThrow(InfeasibleScheduleError);
  });

  it("is deterministic for reversed input order", () => {
    const inspections = [
      inspection("final", { tradeKind: "gc", dependsOn: ["rough"] }),
      inspection("rough", { tradeKind: "electrical" }),
    ];
    const trades = [trade("e1", "electrical"), trade("g1", "gc")];
    const a = run(inspections, trades);
    const b = run([...inspections].reverse(), [...trades].reverse());
    expect(a.assignments).toEqual(b.assignments);
    expect(a.closingDate).toBe(b.closingDate);
  });

  it("repeats the same instance twice", () => {
    const inspections = [
      inspection("site", { tradeKind: "gc" }),
      inspection("footing", { tradeKind: "gc", dependsOn: ["site"] }),
    ];
    const trades = [trade("g1", "gc")];
    expect(run(inspections, trades)).toEqual(run(inspections, trades));
  });

  it("uses a second trade when the first is busy", () => {
    const result = run(
      [
        inspection("a", { tradeKind: "electrical" }),
        inspection("b", { tradeKind: "electrical" }),
      ],
      [trade("e1", "electrical"), trade("e2", "electrical")],
    );
    expect(new Set(result.assignments.map((row) => row.tradeId)).size).toBe(2);
  });

  it("skips passed inspections", () => {
    const result = run(
      [
        inspection("site", { tradeKind: "gc", status: "passed" }),
        inspection("rough", { tradeKind: "electrical", dependsOn: ["site"] }),
      ],
      [trade("e1", "electrical"), trade("g1", "gc")],
    );
    expect(result.assignments.map((row) => row.inspectionCode)).toEqual(["rough"]);
  });
});
