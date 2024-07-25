import * as p5 from 'p5';
import { inject, injectable } from 'tsyringe';
import assert from '../libs/asssert';
import type IMovementBehavior from '../interfaces/IMovementBehavior';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';

/**
 * Movement behavior that updates position to be the mouse x and y at the time update is called.
 */
@injectable()
export default class FollowMouseMovement implements IMovementBehavior {
  private _position: p5.Vector = new p5.Vector(0, 0);
  private readonly _speed: p5.Vector = new p5.Vector(0, 0);
  constructor (
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance
  ) {
  }

  public init = (): void => {
    // Do nothing
  };

  get position (): p5.Vector {
    return this._position;
  };

  set position (newPosition: p5.Vector) {
    this._position = newPosition;
  };

  public update = (): void => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in follow mouse movement update');
    if (this.p5Instance.sketch == null) return;
    this._position.x = this.p5Instance.sketch.mouseX;
    this._position.y = this.p5Instance.sketch.mouseY;
  };

  public destroy = (): void => {};
};
export const FollowMouseMovementName = Symbol.for('FollowMouseMovement');
