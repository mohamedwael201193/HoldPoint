import { schedule } from "./schedule";
import type {
  AssignmentOut,
  EngineInput,
  PreviousAssignment,
  RepairDiff,
  ScheduleResult,
} from "./types";

export function repair(
  input: EngineInput,
  previous: PreviousAssignment[],
): { result: ScheduleResult; diff: RepairDiff } {
  const result = schedule(input);
  const previousByCode = new Map(previous.map((row) => [row.inspectionCode, row]));
  const nextByCode = new Map(result.assignments.map((row) => [row.inspectionCode, row]));
  const kept: AssignmentOut[] = [];
  const moved: AssignmentOut[] = [];
  const added: AssignmentOut[] = [];
  const dropped: AssignmentOut[] = [];

  for (const row of result.assignments) {
    const before = previousByCode.get(row.inspectionCode);
    if (!before) {
      added.push(row);
      continue;
    }
    if (
      before.tradeId === row.tradeId &&
      before.windowStart === row.windowStart &&
      before.windowEnd === row.windowEnd
    ) {
      kept.push(row);
    } else {
      moved.push(row);
    }
  }

  for (const row of previous) {
    if (!nextByCode.has(row.inspectionCode)) {
      dropped.push({
        inspectionCode: row.inspectionCode,
        tradeId: row.tradeId,
        windowStart: row.windowStart,
        windowEnd: row.windowEnd,
      });
    }
  }

  const previousClosing = previous.reduce(
    (max, row) => Math.max(max, row.windowEnd),
    input.now,
  );
  const closingDateDeltaDays = Math.round(
    (result.closingDate - previousClosing) / 86_400_000,
  );

  return {
    result,
    diff: { kept, moved, added, dropped, closingDateDeltaDays },
  };
}

export function notifyTargets(diff: RepairDiff): string[] {
  const ids = new Set<string>();
  for (const row of [...diff.moved, ...diff.added, ...diff.dropped]) {
    ids.add(row.tradeId);
  }
  return [...ids].sort();
}
