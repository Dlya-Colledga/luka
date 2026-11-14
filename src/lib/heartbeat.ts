/** Positions measured in the original heart.mp3 recording. */
export const HEARTBEAT = {
  fileStart: 0.30,
  beatPositions: [0.40, 0.70] as readonly number[],
  tail: 0.20,
  pauseAfter: 0.85,
  scheduleAhead: 0.045,
} as const;

export const BEATS = HEARTBEAT.beatPositions.map(
  (position) => position - HEARTBEAT.fileStart,
);

export const REVEAL_AT = Math.max(...BEATS) + HEARTBEAT.tail + HEARTBEAT.pauseAfter;

export function beatShape(timeSinceBeat: number): number {
  if (timeSinceBeat < 0 || timeSinceBeat > 0.26) return 0;
  return Math.min(
    1,
    1.9 * (1 - Math.exp(-timeSinceBeat * 90)) * Math.exp(-timeSinceBeat * 18),
  );
}
