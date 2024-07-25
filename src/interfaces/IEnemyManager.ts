import { type IGameAgent } from './IGameAgent';
import type IGameObjectManager from './IGameObjectManager';

export interface IEnemyManager extends IGameObjectManager {
  increaseDifficulty: () => void
  // TODO: return benefits earned if any.
  damageEnemiesOnCollision: (agent: IGameAgent) => { pointsEarned: number, collisionOccurred: boolean }
}
