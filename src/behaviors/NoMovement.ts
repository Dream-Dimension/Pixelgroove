import * as p5 from 'p5';
import { injectable } from 'tsyringe';

import type IMovementBehavior from '../interfaces/IMovementBehavior';

@injectable()
export default class NoMovement implements IMovementBehavior {
  private _position: p5.Vector = new p5.Vector(0, 0);

  get position (): p5.Vector {
    return this._position;
  };

  set position (newPosition: p5.Vector) {
    this._position = newPosition;
  };

  public init = (): void => {
    // Do nothing
  };

  public update = (): void => {
    // Do nothing
  };

  public destroy = (): void => {};
};
export const NoMovementName = Symbol.for('NoMovement');
