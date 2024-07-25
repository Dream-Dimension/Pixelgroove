import type * as p5 from 'p5';

/**
 * Movement behaviors are primarily responsible for updating the position of a game object.
 *
 * Examples include moving at random, moving towards a target, or not moving at all.
 */
export default interface IMovementBehavior {
  init: () => void
  update: () => void
  destroy: () => void
  get position(): p5.Vector
  set position(newPosition: p5.Vector)
};
