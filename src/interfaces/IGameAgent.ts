import type IGameObject from './IGameObject';

export type CollisionBenefits = 'speedup' | 'smaller-ship' | 'ff-waveform-bullet-spur' | 'points-on-contact' | 'extra-life' | 'backwards-bullets';
export type CollissionSideEffects = 'slow-down';
export interface IGameAgent extends IGameObject {
  get health(): number // Life left before it is destroyed
  set health(health: number)
  get offensiveDamage(): number // Points it inflicts on others
  set offensiveDamage(damage: number)
  get rewardsPoints(): number // Points it gives if you destroy it
  set rewardsPoints(points: number)
  // TODO: Should have benefits AND side effects seperated.
  // so when we destroy an enemy, can gain benefits, but also have side effects if ship collides with it.
  set collisionBenefits(benefits: CollisionBenefits[]) // Side effects on collision. (mainly to PlayerShip, like adding benefits: moving faster, shooting faster, etc.)
  get collisionBenefits(): CollisionBenefits[]
};

export const IGameAgentName = Symbol.for('IGameAgent');
