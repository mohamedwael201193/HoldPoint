import { DAY_MS, utcDay } from "./types";

export function permitExpiryDue(expiresAt: number | undefined, now: number): boolean {
  if (expiresAt === undefined) return false;
  return utcDay(now) >= utcDay(expiresAt);
}

export function replyTimedOut(notifiedAt: number, now: number, timeoutDays: number): boolean {
  return now - notifiedAt >= timeoutDays * DAY_MS;
}
