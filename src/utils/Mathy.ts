/**
 * Keep value within  start and end range. Inclusive.
 */
export const clamp = (value: number, start: number = 0, end: number = 1): number => {
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  return Math.min(max, Math.max(min, value));
};

/**
 * Maps a value from one range to anothe rrange.
 */
export const map = (value: number, start1: number, stop1: number, start2: number, stop2: number): number => {
  return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};
