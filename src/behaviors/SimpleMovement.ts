import * as p5 from 'p5';
import { inject, injectable } from 'tsyringe';
import type IMovementBehavior from '../interfaces/IMovementBehavior';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import assert from '../libs/asssert';
import { random } from 'lodash';

export const SPEED_DEFAULT_MIN = 300;
export const SPEED_DEFAULT_MAX = 900;
/**
 * Moves the game object based on speed (which calculated based on delta time (aka units per second))
 */
@injectable()
export default class SimpleMovement implements IMovementBehavior {
  protected _position: p5.Vector = new p5.Vector(0, 0);
  protected _speed: p5.Vector = new p5.Vector(0, 0);

  constructor (
    @inject(IP5InstanceName) protected readonly p5Instance: IP5Instance) {
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
    this.init();
  }

  /**
   * Units per second
   */
  get speed (): p5.Vector {
    return this._speed;
  }

  /**
   * In units per second
   */
  set speed (newSpeed: p5.Vector) {
    this._speed = newSpeed;
  }

  get position (): p5.Vector {
    return this._position;
  };

  set position (newPosition: p5.Vector) {
    this._position = newPosition;
  };

  public init (): void {
    assert(this.p5Instance.sketch != null, 'p5Instance.sketch is required init SimpleMovement');
    if (this.p5Instance.sketch == null) {
      return;
    }

    const { width, height } = this.p5Instance.sketch;
    const x = width;
    const y = random(height * 0.1, height * 0.9);
    this._position = new p5.Vector(x, y);
    this._speed = new p5.Vector(random(-1 * SPEED_DEFAULT_MIN, -1 * SPEED_DEFAULT_MAX), 0);
  };

  public update (): void {
    assert(this.p5Instance.sketch != null, 'p5Instance.sketch is required update SimpleMovement');
    if (this.p5Instance.sketch == null) {
      return;
    }
    const scaleFactor = (this.p5Instance.sketch.deltaTime ?? 1000) / 1000;
    this.position.add(this._speed.x * scaleFactor, this._speed.y * scaleFactor);
  };

  public destroy = (): void => {};
};
export const SimpleMovementName = Symbol.for('SimpleMovementName');
