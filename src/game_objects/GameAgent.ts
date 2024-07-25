import { injectable } from 'tsyringe';
import GameObject from './GameObject';
import { type CollisionBenefits, type IGameAgent } from '../interfaces/IGameAgent';
import type IGameObject from '../interfaces/IGameObject';

/**
 * This is a game object that can represent enemies, bullets or power ups.
 *
 */
@injectable()
class GameAgent extends GameObject implements IGameAgent, IGameObject {
  private _collisionBenefits: CollisionBenefits[] = [];

  set collisionBenefits (sideEffects: CollisionBenefits[]) {
    this._collisionBenefits = sideEffects;
  }

  get collisionBenefits (): CollisionBenefits[] {
    return this._collisionBenefits;
  }

  private _offesneiveDamage = 0;
  private _rewardPoints = 0;
  private _health = 0;

  get offensiveDamage (): number {
    return this._offesneiveDamage;
  }

  set offensiveDamage (damage: number) {
    this._offesneiveDamage = damage;
  }

  public get rewardsPoints (): number {
    return this._rewardPoints;
  }

  public set rewardsPoints (points: number) {
    this._rewardPoints = points;
  }

  public get health (): number {
    return this._health;
  }

  public set health (life: number) {
    this._health = life;
  }
};

export default GameAgent;
