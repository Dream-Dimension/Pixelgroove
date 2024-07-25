import { type IGameAgent } from './IGameAgent';
import type IGameObject from './IGameObject';
import type IGameObjectManager from './IGameObjectManager';

export interface IPowerUpManager extends IGameObjectManager {
  increaseDifficulty: () => void
  getPowerUpsThatCollide: (playerShip: IGameObject | IGameAgent) => IGameAgent[]
}
