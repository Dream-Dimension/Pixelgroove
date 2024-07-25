import { type EventCallback } from '../system/EventPublisher';
import type IGameObject from './IGameObject';
import { type IPausable } from './IPausable';

export interface DeathEventData {
  livesRemaining: number
}

export default interface IPlayerShip extends IGameObject, IPausable {
  init: () => void
  onDeath: (callback: EventCallback<DeathEventData>) => () => void

}

export const PlayerShipName = Symbol.for('PlayerShip');
