import { inject, injectable } from 'tsyringe';
import { type IDrawBehaviorParams } from '../interfaces/IDrawBehavior';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import type IRectangle from '../interfaces/IRectangle';
import type IShape from '../interfaces/IShape';
import { ShapeType } from '../interfaces/IShape';
import assert from '../libs/asssert';
import { type IDrawShapeBase } from '../interfaces/IDrawShapeBase';
import { Palette } from '../utils/Theme';
import type ICircle from '../interfaces/ICircle';
import type ITriangle from '../interfaces/ITriangle';

interface AnimationState {
  startTime: number
  startValue: number
  targetValue: number
  duration: number
  active: boolean
}

const interpolateTime = (currentTime: number, startTime: number, duration: number, startValue: number, endValue: number): number => {
  const elapsedTime = currentTime - startTime;
  if (elapsedTime > duration) {
    return endValue;
  }
  const ratio = elapsedTime / duration;
  return startValue + ratio * (endValue - startValue);
};

/**
 * The base for drawing behaviors. It just takes shape objects and draws them very crudely.
 *
 * It supports being able to change colors for the entire set of shapes to draw.
 */
@injectable()
class DrawShapesBase implements IDrawShapeBase {
  private _shapes: IShape[] = [];
  private _strokeWidth: number = 1;
  private _alpha: number = 0.3;
  private _strokeColor: string = Palette.neutralBaseColor;
  private _bodyColor: string = Palette.neutralBaseColor;
  private scaleFactors: number[] = [];

  private widthAnimation: AnimationState = { startTime: 0, startValue: 0, targetValue: 0, duration: 0, active: false };
  private heightAnimation: AnimationState = { startTime: 0, startValue: 0, targetValue: 0, duration: 0, active: false };
  private alphaAnimation: AnimationState = { startTime: 0, startValue: 0, targetValue: 0, duration: 0, active: false };

  constructor (
    @inject(IP5InstanceName) protected readonly p5Instance: IP5Instance) {
    this.draw = this.draw.bind(this);
    this.update = this.update.bind(this);
  }

  public set strokeWidth (width: number) {
    this._strokeWidth = width;
  }

  public get strokeWidth (): number {
    return this._strokeWidth;
  }

  public set alpha (alpha: number) {
    this._alpha = alpha;
  }

  public get alpha (): number {
    return this._alpha;
  }

  /**
   * Scales all shapes sizes by the scale factor passed.
   */
  public scaleBy (scale: number): void {
    this.scaleShapesBy(scale);
    this.scaleFactors.push(scale);
  }

  private animatePropertyTransition (currentTime: number, animationState: AnimationState, updateProperty: (value: number) => void): void {
    if (currentTime - animationState.startTime >= animationState.duration) {
      animationState.active = false; // Stop the animation
      return;
    }
    const interpolatedValue = interpolateTime(currentTime, animationState.startTime, animationState.duration, animationState.startValue, animationState.targetValue);
    updateProperty(interpolatedValue);
  }

  private scaleShapesBy (scale: number): void {
    this.shapes.forEach(shape => {
      if (shape.type === ShapeType.rectangle) {
        const rectangle = shape as unknown as IRectangle;
        rectangle.width *= scale;
        rectangle.height *= scale;
      } else if (shape.type === ShapeType.circle) {
        const circle = shape as unknown as ICircle;
        circle.radius *= scale;
      } else if (shape.type === ShapeType.triangle) {
        // TODO: scale this better, this will destroy odd shaped triangles:
        const triangle = shape as unknown as ITriangle;
        triangle.width *= scale;
        triangle.height *= scale;
      }
    });
  }

  /**
   * Reset all scales applied up to this point.
   */
  public resetScale (): void {
    this.scaleFactors.forEach(lastScale => {
      const inverseScale = 1 / lastScale;
      this.scaleShapesBy(inverseScale);
    });
    this.scaleFactors = [];
  }

  set bodyColor (color: string) {
    this._bodyColor = color;
  }

  get bodyColor (): string {
    return this._bodyColor;
  }

  public set strokeColor (color: string) {
    this._strokeColor = color;
  }

  public get strokeColor (): string {
    return this._strokeColor;
  }

  // This is likely getting called by GameObject.draw
  // which injects the movement.position into the params.
  public draw (params?: IDrawBehaviorParams): void {
    const shapes = this.shapes;
    const { position } = params ?? {};
    assert(shapes != null, 'Shapes was null in draw power up');
    assert(position != null, 'Position was null in draw power up');
    assert(this.p5Instance.sketch != null, 'Sketch was null in draw power up');

    if (position == null) return;
    if (shapes == null || shapes.length === 0) return;
    if (this.p5Instance.sketch == null) return;

    for (const shape of shapes) {
      const color = this.p5Instance.sketch.color(this.bodyColor);
      const strokeColor = this.p5Instance.sketch.color(this.strokeColor);

      color.setAlpha(255 * this.alpha);
      this.p5Instance.sketch.fill(color);
      color.setAlpha(255);
      this.p5Instance.sketch.stroke(strokeColor);
      this.p5Instance.sketch.strokeWeight(this.strokeWidth);
      if (shape.type === ShapeType.rectangle) {
        const rectangle = shape as unknown as IRectangle;
        this.p5Instance.sketch.rect(position.x + shape.offset.x, position.y + shape.offset.y, rectangle.width, rectangle.height);
      } else if (shape.type === ShapeType.circle) {
        const circle = shape as unknown as ICircle;
        this.p5Instance.sketch.circle(position.x + shape.offset.x, position.y + shape.offset.y, circle.radius * 2);
      } else if (shape.type === ShapeType.triangle) {
        const triangle = shape as unknown as ITriangle;
        // Calculate the absolute positions of the triangle's vertices
        const x1 = position.x + shape.offset.x + triangle.vertex1.x;
        const y1 = position.y + shape.offset.y + triangle.vertex1.y;
        const x2 = position.x + shape.offset.x + triangle.vertex2.x;
        const y2 = position.y + shape.offset.y + triangle.vertex2.y;
        const x3 = position.x + shape.offset.x + triangle.vertex3.x;
        const y3 = position.y + shape.offset.y + triangle.vertex3.y;

        this.p5Instance.sketch.triangle(x1, y1, x2, y2, x3, y3);
      }
    }
  };

  public setNewWidth (newWidth: number, duration: number = 500): void {
    assert(this.p5Instance.sketch != null, 'Sketch was null in drawshapebase update');
    assert(this._shapes != null, 'Shapes was null in drawshapebase set');
    assert(this._shapes.length > 0, 'Shapes was empty in drawshapebase set');
    if (this.p5Instance.sketch == null) return;
    if (this._shapes == null || this._shapes.length === 0) return;
    // Make sure we are not already in the middle of the same animation:
    if (newWidth === this.widthAnimation.targetValue && duration === this.widthAnimation.duration) return;
    this.widthAnimation = {
      startTime: this.p5Instance.sketch.millis(),
      startValue: this._shapes[0].width, // kinda ugly.
      targetValue: newWidth,
      duration,
      active: true
    };
  }

  public setNewHeight (newHeight: number, duration: number = 500): void {
    assert(this.p5Instance.sketch != null, 'Sketch was null in drawshapebase setNewHeight');
    assert(this._shapes != null, 'Shapes was null in drawshapebase set');
    assert(this._shapes.length > 0, 'Shapes was empty in drawshapebase set');
    if (this.p5Instance.sketch == null) return;
    this.heightAnimation = {
      startTime: this.p5Instance.sketch.millis(),
      startValue: this._shapes[0].height,
      targetValue: newHeight,
      duration,
      active: true
    };
  }

  public setNewAlpha (newAlpha: number, duration: number = 1000): void {
    assert(this.p5Instance.sketch != null, 'Sketch was null in drawshapebase setNewAlpha');
    if (this.p5Instance.sketch == null) return;

    this.alphaAnimation = {
      startTime: this.p5Instance.sketch.millis(),
      startValue: this._alpha,
      targetValue: newAlpha,
      duration,
      active: true
    };
  }

  public get shapes (): IShape[] {
    return this._shapes;
  }

  public set shapes (shapes: IShape[]) {
    this._shapes = shapes;
  }

  public update (): void {
    assert(this.shapes != null, 'Shapes was null in shapes behavior');
    assert(this.p5Instance.sketch != null, 'Sketch was null in drawshapebase update');
    if (this.p5Instance.sketch == null) return;
    if (this.shapes == null) return;
    const currentTime = this.p5Instance.sketch.millis();

    if (this.widthAnimation.active) {
      this.animatePropertyTransition(currentTime, this.widthAnimation, (value) => {
        this._shapes.forEach(shape => {
          shape.width = value;
        });
      });
    }

    if (this.heightAnimation.active) {
      this.animatePropertyTransition(currentTime, this.heightAnimation, (value) => {
        this._shapes.forEach(shape => {
          shape.height = value;
        });
      });
    }

    if (this.alphaAnimation.active) {
      this.animatePropertyTransition(currentTime, this.alphaAnimation, (value) => {
        this._alpha = value;
      });
    }
  };

  public destroy = (): void => {};
}

export default DrawShapesBase;
export const DrawShapesBaseName = Symbol.for('DrawShapesBase');
