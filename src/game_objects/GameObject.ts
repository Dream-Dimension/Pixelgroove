import * as p5 from 'p5';
import type IMovementBehavior from '../interfaces/IMovementBehavior';
import Shape from './geometry/Shape';
import { type IDrawBehaviorParams } from '../interfaces/IDrawBehavior';
import type IGameObject from '../interfaces/IGameObject';
import assert from '../libs/asssert';
import type IDrawShapesBehavior from '../interfaces/IDrawShapesBehavior';

/**
 * The basis of game objects in the game representing things like:
 *    - the player ship
 *    - enemies
 *    - power ups
 *    - bullets
 *
 * A game object can be drawn and moved via behaviors (strategy pattern).
 *
 */
abstract class GameObject implements IGameObject {
  protected _movementBehavior: IMovementBehavior | undefined;
  protected _drawBehavior: IDrawShapesBehavior<IDrawBehaviorParams> | undefined;
  private _isDestroyed = false;
  /**
   * Checks if two game objects collide based on the individual shapes
   * that make each up.
   *
   * @returns true if the two game objects collide
   */
  constructor () {
    this.draw = this.draw.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  /**
   * Returns true if any of the game objects in the first set collide with any of the game objects in the second set.
   * Has the safety feature of not comparing the same object with itself but can be turned off.
   *
   * Will also handle single single game objects or arrays of game objects for each set.
   */
  static collisionBetweenTwoSets = (gameObjects1: IGameObject[] | GameObject, gameObjects2: IGameObject[] | GameObject, excludeComparingSameObjects = true): boolean => {
    if (gameObjects1 == null || gameObjects2 == null) return false;
    if (!Array.isArray(gameObjects1)) gameObjects1 = [gameObjects1];
    if (!Array.isArray(gameObjects2)) gameObjects2 = [gameObjects2];

    for (const gameObject1 of gameObjects1) {
      for (const gameObject2 of gameObjects2) {
        if (excludeComparingSameObjects && gameObject1 === gameObject2) {
          // When don't want to compare the same object with itself:
          continue;
        } else if (GameObject.collide(gameObject1, gameObject2)) {
          return true;
        }
      }
    }
    return false;
  };

  static collide = (gameObject1: IGameObject, gameObject2: IGameObject): boolean => {
    assert(gameObject1.drawBehavior != null, 'Draw behavior was null in game object collide');
    const shapes1 = gameObject1.drawBehavior?.shapes ?? [];
    const position1 = gameObject1.movementBehavior?.position ?? new p5.Vector(0, 0);
    const shapes2 = gameObject2.drawBehavior?.shapes ?? [];
    const position2 = gameObject2.movementBehavior?.position ?? new p5.Vector(0, 0);

    for (const shape1 of shapes1) {
      shape1.justCollided = false;
    }

    for (const shape2 of shapes2) {
      shape2.justCollided = false;
    }

    for (const shape1 of shapes1) {
      for (const shape2 of shapes2) {
        if (Shape.collide(shape1, position1, shape2, position2)) {
          shape1.justCollided = true;
          shape2.justCollided = true;
          return true;
        }
      }
    }

    return false;
  };

  public get position (): p5.Vector {
    return this.movementBehavior?.position ?? new p5.Vector(0, 0);
  }

  public set drawBehavior (drawBehavior: IDrawShapesBehavior<IDrawBehaviorParams>) {
    this._drawBehavior = drawBehavior;
  }

  public get drawBehavior (): IDrawShapesBehavior<IDrawBehaviorParams> | undefined {
    return this._drawBehavior;
  }

  public set movementBehavior (movementBehavior: IMovementBehavior) {
    this._movementBehavior = movementBehavior;
  }

  public get movementBehavior (): IMovementBehavior | undefined {
    return this._movementBehavior;
  }

  public update (): void {
    this.drawBehavior?.update();
    this.movementBehavior?.update();
  };

  public draw (): void {
    assert(this.movementBehavior != null, 'Movemenet behavior was null in game object draw');
    assert(this.drawBehavior != null, 'Draw behavior was null in game object draw');
    assert(this.drawBehavior?.shapes != null, 'Null shapes to draw in game object draw');

    if (this.drawBehavior == null) return;
    if (this.movementBehavior == null) return;

    this.drawBehavior?.draw({
      position: this.position
    });
  };

  // TODO: trigger an animation sequence
  // call drawBehavior.destroy(position, triggerAnimation: true) // true by default/optional.
  // Or even better.. maybe we add an animation behavior to all game objs
  // by defaults it does nothing.
  public destroy (): void {
    this._isDestroyed = true;
  };

  public get isDestroyed (): boolean {
    return this._isDestroyed;
  }
}

export default GameObject;
