export function requireCurrentRevision(expected: number, actual: number) {
  if (expected !== actual) {
    throw new Error("The plan changed while you were looking at it");
  }
}

export function assertWritable(frozen: boolean | undefined) {
  if (frozen) {
    throw new Error("This permit is frozen");
  }
}

export function alreadyRecorded<T>(existing: T | null | undefined): existing is T {
  return existing !== null && existing !== undefined;
}
