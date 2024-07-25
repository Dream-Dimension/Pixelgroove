import { type IDrawBehaviorParams } from './IDrawBehavior';
import type IDrawShapesBehavior from './IDrawShapesBehavior';
import type IMovementBehavior from './IMovementBehavior';

interface IGameObject {
  set drawBehavior(drawBehavior: IDrawShapesBehavior<IDrawBehaviorParams>)
  get drawBehavior(): IDrawShapesBehavior<IDrawBehaviorParams> | undefined
  set movementBehavior(movementBehavior: IMovementBehavior)
  get movementBehavior(): IMovementBehavior | undefined

  destroy: () => void
  update: () => void
  draw: () => void
  get isDestroyed(): boolean
};

export default IGameObject;
