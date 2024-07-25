import * as p5 from 'p5';
import { inject, injectable } from 'tsyringe';
import type IMovementBehavior from '../interfaces/IMovementBehavior';
import SimpleMovement, { SPEED_DEFAULT_MAX, SPEED_DEFAULT_MIN } from './SimpleMovement';
import { clamp, random } from 'lodash';
import assert from '../libs/asssert';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import { map } from '../utils/Mathy';

const MS_IN_SEC = 1000;
/**
 * Moves the game object based on a sine wave pattern
 */
@injectable()
export default class SineWaveMovement extends SimpleMovement implements IMovementBehavior {
  private _angle: number = 0; // Property to track the angle
  private _initialPosition = new p5.Vector(0, 0);
  private _maxVertical: number = 50;

  constructor (
    @inject(IP5InstanceName) protected readonly p5Instance: IP5Instance) {
    super(p5Instance);
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
    this.init();
  }

  public override init (): void {
    super.init();
    this._speed.y = random(-1 * SPEED_DEFAULT_MIN, -1 * SPEED_DEFAULT_MAX);
    this._initialPosition = this.position.copy();
    this._maxVertical = random(50, this.p5Instance.height() * 0.3);
  }

  public override update (): void {
    assert(this.p5Instance.sketch != null, 'p5Instance.sketch is required update SineWaveMovement');
    if (this.p5Instance.sketch == null) {
      return;
    }

    const deltaTimeFactor = this.p5Instance.sketch.deltaTime / MS_IN_SEC;
    // Increment the angle based on speed and deltaTime
    this._angle += (this._speed.y * deltaTimeFactor) / 100; // Adjust the divisor for desired frequency

    // Calculate sine value
    const sineValue = Math.sin(this._angle);

    // Map sine value to a desired range for amplitude
    const amplitude = map(sineValue, -1, 1, -this._maxVertical, this._maxVertical); // Mapping from -1,1 to -50,50
    // Update position.y based on the mapped amplitude
    this.position.y = amplitude + this._initialPosition.y;
    this.position.y = clamp(this._initialPosition.y + amplitude, 0, this.p5Instance.height()); // Keep inbounds
    this.position.x += this._speed.x * deltaTimeFactor;
  };
};
export const SineWaveMovementName = Symbol.for('SineWaveMovement');
