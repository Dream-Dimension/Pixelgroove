import { type IPausable } from './IPausable';

interface IPlayerStats extends IPausable {
  get points(): number
  set points (newPoints: number)
  get lives(): number
  set lives (newLives: number)
  set powerUpsCount (count: number)
  get powerUpsCount(): number
  level: number
  init: () => void
  reset: () => void
  update: () => void
  draw: () => void
  destroy: () => void
};

export default IPlayerStats;
export const IPlayerStatsName = Symbol.for('IPlayerStats');
