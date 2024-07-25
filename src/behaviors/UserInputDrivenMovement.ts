import * as p5 from 'p5';
import { inject, injectable } from 'tsyringe';
import type IMovementBehavior from '../interfaces/IMovementBehavior';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import type IShape from '../interfaces/IShape';
import InputManager, { GameInputType, InputManagerName } from '../system/InputManager';
import assert from '../libs/asssert';

// TODO: account for screen size?
const DEFAULT_MOVEMENT_AMOUNT = 500;
const MS_IN_SEC = 1000;

/**
 * Sets up listeners to listen for movement events like up, down, left, right to update position.
 */
@injectable()
export default class UserInputDrivenMovement implements IMovementBehavior {
  constructor (
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance,
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(InputManagerName) private readonly inputManager: InputManager
  ) {
    this.logger = logger;
  }

  public init = (): void => {
    this.bindUserInputs();
  };

  /**
   * Binds movement for quick press downs on a button:
   */
  private readonly bindUserInputs = (): void => {
    // TODO: unbind
    /*
    this.inputManager.addEventListener(GameInputType.Up, () => {
      this.position.y -= DEFAULT_MOVEMENT_AMOUNT;
    });

    this.inputManager.addEventListener(GameInputType.Down, () => {
      this.position.y += DEFAULT_MOVEMENT_AMOUNT;
    });

    this.inputManager.addEventListener(GameInputType.Left, () => {
      this.position.x -= DEFAULT_MOVEMENT_AMOUNT;
    });

    this.inputManager.addEventListener(GameInputType.Right, () => {
      this.position.x += DEFAULT_MOVEMENT_AMOUNT;
    });
    */
  };

  /**
   * Handles updates for continues press downs on a button:
   */
  private handleHeldDownInputs (movementAmount: number): void {
    const MAX_FOR_KEYBOARD_BASED_MOVEMENT = 0.75;
    // Adjust movement for Up direction
    const upStatus = this.inputManager.getActionStatus(GameInputType.Up, MAX_FOR_KEYBOARD_BASED_MOVEMENT);
    if (upStatus.isActive) {
      this.position.y -= movementAmount * upStatus.value;
    }

    // Adjust movement for Down direction
    const downStatus = this.inputManager.getActionStatus(GameInputType.Down, MAX_FOR_KEYBOARD_BASED_MOVEMENT);
    if (downStatus.isActive) {
      this.position.y += movementAmount * downStatus.value;
    }

    // Adjust movement for Left direction
    const leftStatus = this.inputManager.getActionStatus(GameInputType.Left, MAX_FOR_KEYBOARD_BASED_MOVEMENT);
    if (leftStatus.isActive) {
      this.position.x -= movementAmount * leftStatus.value;
    }

    // Adjust movement for Right direction
    const rightStatus = this.inputManager.getActionStatus(GameInputType.Right, MAX_FOR_KEYBOARD_BASED_MOVEMENT);
    if (rightStatus.isActive) {
      this.position.x += movementAmount * rightStatus.value;
    }
  }

  private _position: p5.Vector = new p5.Vector(0, 0);

  public get position (): p5.Vector {
    return this._position;
  };

  public set position (newPosition: p5.Vector) {
    this._position = newPosition;
  };

  public update = (shapes?: IShape[]): void => {
    assert(this.p5Instance.sketch != null, 'p5 instance was null in UserInputDrivenMovement update');
    if (this.p5Instance.sketch == null) return;
    // p5.js provides deltaTime in milliseconds, so divide by 1000 to get seconds
    const scaleFactor = this.p5Instance.sketch.deltaTime / MS_IN_SEC;
    const movementAmount = DEFAULT_MOVEMENT_AMOUNT * scaleFactor;
    // If 1 second has elapsed, move by DEFAULT_MOVEMENT_AMOUNT
    // if 0.5 seconds have elapsed, move by DEFAULT_MOVEMENT_AMOUNT / 2
    this.handleHeldDownInputs(movementAmount);

    // MVP for now. eventually should account for shape size.
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.y < 0) this.position.y = 0;
    const screenWidth = this.p5Instance.width();
    const screenHeight = this.p5Instance.height();
    if (this.position.x > screenWidth) this.position.x = screenWidth;
    if (this.position.y > screenHeight) this.position.y = screenHeight;
  };

  public destroy = (): void => {
    // TODO: unbind user inputs
  };
};

export const UserInputDrivenMovementName = Symbol.for('UserInputDrivenMovement');
