/** Parses HH:MM or HH:MM:SS to minutes since midnight */
export function timeToMinutes(t: string): number {
  const parts = t.trim().split(":").map((p) => parseInt(p, 10));
  const h = parts[0];
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  if ([h, m, s].some((n) => Number.isNaN(n))) {
    throw new Error("Invalid time format");
  }
  return h * 60 + m + s / 60;
}

export function assertEndAfterStart(start: string, end: string): void {
  const a = timeToMinutes(start);
  const b = timeToMinutes(end);
  if (b <= a) {
    throw new Error("end_time must be after start_time");
  }
}
