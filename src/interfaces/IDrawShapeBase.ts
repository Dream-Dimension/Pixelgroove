import { type IDrawBehaviorParams } from './IDrawBehavior';
import type IDrawBehavior from './IDrawBehavior';

export interface IDrawShapeBase extends IDrawBehavior<IDrawBehaviorParams> {
  scaleBy: (scale: number) => void
  resetScale: () => void
  set strokeColor (color: string)
  get strokeColor (): string
  set bodyColor (color: string)
  get bodyColor(): string
  set strokeWidth (width: number)
  get strokeWidth (): number
  set alpha (alpha: number)
  get alpha (): number
  setNewWidth: (newValue: number, duration?: number) => void
  setNewHeight: (newValue: number, duration?: number) => void
  setNewAlpha: (newValue: number, duration?: number) => void
}
