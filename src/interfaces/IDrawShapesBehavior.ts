import type IDrawBehavior from './IDrawBehavior';
import type IShape from './IShape';

interface IDrawShapesBehavior<T> extends IDrawBehavior<T> {
  draw: (params?: T) => void
  get shapes (): IShape[]
  set shapes (shapes: IShape[])
  update: () => void
  destroy: () => void
}

export default IDrawShapesBehavior;
export const IDrawShapesBehaviorName = Symbol.for('IDrawShapesBehavior');
