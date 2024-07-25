import type GoBackCb from '../types/GoBackCb';
import type IDrawBehavior from './IDrawBehavior';

export default interface IGameManager extends IDrawBehavior<void> {
  // Add methods and properties here
  load: (goBackCb?: GoBackCb) => void
  update: () => void
}

export const IGameManagerName = Symbol.for('IGameManager');
