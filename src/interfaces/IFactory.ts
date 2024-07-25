import { type IGameAgent } from './IGameAgent';

// GameAgentConfigs for Powerups:
export enum PowerUpType {
  Simple,
  FollowMouse,
  FFTTop,
  FFTBottom,
  Faces,
  ObjectsDetected,
  Poses
}

export enum BulletType {
  SimpleFromPlayer
}

// GameAgentConfigs for Enemies
export enum EnemyType {
  // Simple,
  MoveHorizontally,
  BulletMoveHorizontally,
  // MoveTowardsPlayer,
  FFTTop,
  FFTBottom,
  MoveAsSineWave,
  MoveUpAnDown
}

/**
 * Factory interface for creating game objects.
 *
 * GameAgentConfig: the desired configuration/combo of the GameAgent.
 *
 */
interface IFactory<GameAgentConfig> {
  create: (type: GameAgentConfig) => IGameAgent
}

export default IFactory;
