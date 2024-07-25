import { type IDrawShapeBase } from './IDrawShapeBase';
import { type IPausable } from './IPausable';

export interface IDrawShip extends IDrawShapeBase, IPausable {
  waveformEnabled: boolean
  isDead: boolean
}
