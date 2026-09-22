import { DagError, type InspectionInput } from "./types";

export function buildDag(inspections: InspectionInput[]): Map<string, InspectionInput> {
  const byCode = new Map<string, InspectionInput>();
  for (const inspection of inspections) {
    if (byCode.has(inspection.code)) {
      throw new DagError(`Duplicate inspection code: ${inspection.code}`);
    }
    byCode.set(inspection.code, inspection);
  }
  for (const inspection of inspections) {
    for (const parent of inspection.dependsOn) {
      if (!byCode.has(parent)) {
        throw new DagError(
          `Inspection ${inspection.code} depends on missing ${parent}`,
        );
      }
    }
  }
  detectCycles(inspections);
  return byCode;
}

export function topologicalOrder(inspections: InspectionInput[]): InspectionInput[] {
  const byCode = buildDag(inspections);
  const remaining = new Map(byCode);
  const ordered: InspectionInput[] = [];
  while (remaining.size > 0) {
    const ready = [...remaining.values()]
      .filter((item) => item.dependsOn.every((parent) => !remaining.has(parent)))
      .sort((a, b) => a.code.localeCompare(b.code));
    if (ready.length === 0) {
      throw new DagError("Cycle detected in inspection dependencies");
    }
    for (const item of ready) {
      ordered.push(item);
      remaining.delete(item.code);
    }
  }
  return ordered;
}

function detectCycles(inspections: InspectionInput[]) {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byCode = new Map(inspections.map((item) => [item.code, item]));

  const walk = (code: string) => {
    if (visited.has(code)) return;
    if (visiting.has(code)) {
      throw new DagError(`Cycle involving ${code}`);
    }
    visiting.add(code);
    const node = byCode.get(code);
    if (!node) {
      throw new DagError(`Missing inspection ${code}`);
    }
    for (const parent of node.dependsOn) walk(parent);
    visiting.delete(code);
    visited.add(code);
  };

  for (const inspection of inspections) walk(inspection.code);
}
