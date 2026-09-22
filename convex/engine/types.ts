export const DAY_MS = 86_400_000;

export type InspectionStatus =
  | "pending"
  | "requested"
  | "scheduled"
  | "passed"
  | "failed";

export type TimeWindow = {
  from: number;
  to: number;
};

export type InspectionInput = {
  code: string;
  status: InspectionStatus;
  dependsOn: string[];
  typicalLeadDays: number;
  durationDays: number;
  tradeKind: string;
  lockedWindow?: { start: number; end: number } | null;
};

export type TradeInput = {
  id: string;
  kind: string;
  unavailable: TimeWindow[];
};

export type PreviousAssignment = {
  inspectionCode: string;
  tradeId: string;
  windowStart: number;
  windowEnd: number;
};

export type EngineInput = {
  now: number;
  inspections: InspectionInput[];
  trades: TradeInput[];
};

export type AssignmentOut = {
  inspectionCode: string;
  tradeId: string;
  windowStart: number;
  windowEnd: number;
};

export type ScheduleResult = {
  assignments: AssignmentOut[];
  closingDate: number;
  criticalPath: string[];
  criticalPathDays: number;
  provenExact: boolean;
  gap?: number;
  violations: string[];
};

export type RepairDiff = {
  kept: AssignmentOut[];
  moved: AssignmentOut[];
  added: AssignmentOut[];
  dropped: AssignmentOut[];
  closingDateDeltaDays: number;
};

export class InfeasibleScheduleError extends Error {
  readonly code = "INFEASIBLE_SCHEDULE";
  constructor(message: string) {
    super(message);
    this.name = "InfeasibleScheduleError";
  }
}

export class DagError extends Error {
  readonly code = "INVALID_DAG";
  constructor(message: string) {
    super(message);
    this.name = "DagError";
  }
}

export function utcDay(ms: number): number {
  return Math.floor(ms / DAY_MS) * DAY_MS;
}

export function addDays(ms: number, days: number): number {
  return utcDay(ms) + days * DAY_MS;
}
