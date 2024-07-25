import type * as p5 from 'p5';

export interface IDrawBehaviorParams {
  position: p5.Vector
};

/**
 * Draw behaviors are primarily responsible for drawing a game object
 * on the screen based on a set of shapes and a world position.
 *
 */
// Concrete classes can replace T with void if no params are needed.
interface IDrawBehavior<T> {
  draw: (params?: T) => void
};

export default IDrawBehavior;

export const IDrawBehaviorName = Symbol.for('IDrawBehavior');
