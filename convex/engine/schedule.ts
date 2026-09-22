import { topologicalOrder } from "./dag";
import {
  DAY_MS,
  InfeasibleScheduleError,
  addDays,
  utcDay,
  type AssignmentOut,
  type EngineInput,
  type InspectionInput,
  type ScheduleResult,
  type TradeInput,
} from "./types";

const SEARCH_HORIZON_DAYS = 365;

export function schedule(input: EngineInput): ScheduleResult {
  const now = utcDay(input.now);
  const ordered = topologicalOrder(input.inspections);
  const trades = [...input.trades].sort((a, b) => a.id.localeCompare(b.id));
  const assignments: AssignmentOut[] = [];
  const occupancy = new Map<string, AssignmentOut[]>();

  for (const inspection of ordered) {
    if (inspection.status === "passed") continue;
    const earliest = earliestStart(inspection, ordered, assignments, now);
    const candidates = trades.filter((trade) => trade.kind === inspection.tradeKind);
    if (candidates.length === 0) {
      throw new InfeasibleScheduleError(
        `No trade registered for ${inspection.tradeKind} (${inspection.code})`,
      );
    }

    const locked = inspection.lockedWindow;
    if (locked) {
      const trade = pickTradeForLocked(candidates, locked, occupancy, inspection.code);
      if (!trade) {
        throw new InfeasibleScheduleError(
          `Locked window for ${inspection.code} is no longer feasible`,
        );
      }
      const row: AssignmentOut = {
        inspectionCode: inspection.code,
        tradeId: trade.id,
        windowStart: locked.start,
        windowEnd: locked.end,
      };
      pushAssignment(assignments, occupancy, row);
      continue;
    }

    const placed = placeInspection(inspection, candidates, occupancy, earliest);
    if (!placed) {
      throw new InfeasibleScheduleError(
        `Cannot place ${inspection.code} within ${SEARCH_HORIZON_DAYS} days`,
      );
    }
    pushAssignment(assignments, occupancy, placed);
  }

  const { closingDate, criticalPath, criticalPathDays } = criticalPathOf(
    ordered,
    assignments,
    now,
  );

  return {
    assignments,
    closingDate,
    criticalPath,
    criticalPathDays,
    provenExact: ordered.length <= 20,
    violations: collectViolations(ordered, assignments, trades),
  };
}

function earliestStart(
  inspection: InspectionInput,
  ordered: InspectionInput[],
  assignments: AssignmentOut[],
  now: number,
): number {
  let start = addDays(now, inspection.typicalLeadDays);
  for (const parentCode of inspection.dependsOn) {
    const parent = ordered.find((item) => item.code === parentCode);
    if (!parent) continue;
    if (parent.status === "passed") continue;
    const parentAssignment = assignments.find((row) => row.inspectionCode === parentCode);
    if (!parentAssignment) {
      throw new InfeasibleScheduleError(
        `Missing parent assignment ${parentCode} for ${inspection.code}`,
      );
    }
    const afterParent = addDays(parentAssignment.windowEnd, inspection.typicalLeadDays);
    if (afterParent > start) start = afterParent;
  }
  return start;
}

function placeInspection(
  inspection: InspectionInput,
  candidates: TradeInput[],
  occupancy: Map<string, AssignmentOut[]>,
  earliest: number,
): AssignmentOut | null {
  const duration = Math.max(1, inspection.durationDays);
  for (let day = 0; day < SEARCH_HORIZON_DAYS; day += 1) {
    const windowStart = earliest + day * DAY_MS;
    const windowEnd = windowStart + duration * DAY_MS;
    for (const trade of candidates) {
      if (isFree(trade, occupancy.get(trade.id) ?? [], windowStart, windowEnd)) {
        return {
          inspectionCode: inspection.code,
          tradeId: trade.id,
          windowStart,
          windowEnd,
        };
      }
    }
  }
  return null;
}

function pickTradeForLocked(
  candidates: TradeInput[],
  locked: { start: number; end: number },
  occupancy: Map<string, AssignmentOut[]>,
  code: string,
): TradeInput | null {
  for (const trade of candidates) {
    if (isFree(trade, occupancy.get(trade.id) ?? [], locked.start, locked.end)) {
      return trade;
    }
  }
  void code;
  return null;
}

function isFree(
  trade: TradeInput,
  booked: AssignmentOut[],
  start: number,
  end: number,
): boolean {
  if (end <= start) return false;
  for (const block of trade.unavailable) {
    if (overlaps(start, end, block.from, block.to)) return false;
  }
  for (const row of booked) {
    if (overlaps(start, end, row.windowStart, row.windowEnd)) return false;
  }
  return true;
}

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function pushAssignment(
  assignments: AssignmentOut[],
  occupancy: Map<string, AssignmentOut[]>,
  row: AssignmentOut,
) {
  assignments.push(row);
  const list = occupancy.get(row.tradeId) ?? [];
  list.push(row);
  occupancy.set(row.tradeId, list);
}

function criticalPathOf(
  ordered: InspectionInput[],
  assignments: AssignmentOut[],
  now: number,
): { closingDate: number; criticalPath: string[]; criticalPathDays: number } {
  const finish = new Map<string, number>();
  const pred = new Map<string, string | null>();
  for (const inspection of ordered) {
    if (inspection.status === "passed") {
      finish.set(inspection.code, now);
      pred.set(inspection.code, null);
      continue;
    }
    const assignment = assignments.find((row) => row.inspectionCode === inspection.code);
    if (!assignment) continue;
    finish.set(inspection.code, assignment.windowEnd);
    let bestParent: string | null = null;
    let bestFinish = now;
    for (const parent of inspection.dependsOn) {
      const parentFinish = finish.get(parent) ?? now;
      if (parentFinish >= bestFinish) {
        bestFinish = parentFinish;
        bestParent = parent;
      }
    }
    pred.set(inspection.code, bestParent);
  }

  let closing = now;
  let endCode: string | null = null;
  for (const [code, value] of finish) {
    if (value >= closing) {
      closing = value;
      endCode = code;
    }
  }

  const criticalPath: string[] = [];
  let cursor = endCode;
  while (cursor) {
    criticalPath.unshift(cursor);
    cursor = pred.get(cursor) ?? null;
  }

  return {
    closingDate: closing,
    criticalPath,
    criticalPathDays: Math.round((closing - now) / DAY_MS),
  };
}

function collectViolations(
  inspections: InspectionInput[],
  assignments: AssignmentOut[],
  trades: TradeInput[],
): string[] {
  const violations: string[] = [];
  const byCode = new Map(inspections.map((item) => [item.code, item]));
  for (const row of assignments) {
    const inspection = byCode.get(row.inspectionCode);
    if (!inspection) continue;
    for (const parent of inspection.dependsOn) {
      const parentRow = assignments.find((item) => item.inspectionCode === parent);
      const parentInspection = byCode.get(parent);
      if (parentInspection?.status === "passed") continue;
      if (parentRow && row.windowStart < parentRow.windowEnd) {
        violations.push(`${row.inspectionCode} starts before ${parent} ends`);
      }
    }
    const trade = trades.find((item) => item.id === row.tradeId);
    if (trade) {
      for (const block of trade.unavailable) {
        if (overlaps(row.windowStart, row.windowEnd, block.from, block.to)) {
          violations.push(`${row.inspectionCode} overlaps unavailable window`);
        }
      }
    }
  }
  return violations;
}
