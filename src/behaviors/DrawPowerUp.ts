import { inject, injectable } from 'tsyringe';
import DrawShapesBase from './DrawShapesBase';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import ISoundAnalyzer, { ISoundAnalyzerName } from '../interfaces/ISoundAnalyzer';
import { type IDrawShapeBase } from '../interfaces/IDrawShapeBase';
import { type IDrawBehaviorParams } from '../interfaces/IDrawBehavior';
import type IRectangle from '../interfaces/IRectangle';
import { ShapeType } from '../interfaces/IShape';
import type ICircle from '../interfaces/ICircle';

@injectable()
class DrawPowerUp extends DrawShapesBase implements IDrawShapeBase {
  private heartEnabled: boolean = false;
  private starEnabled: boolean = false; // New property for star drawing

  // This is copied from the super's constructor to allow for dependency injection:
  constructor (@inject(IP5InstanceName) p5Instance: IP5Instance,
    @inject(ISoundAnalyzerName) soundAnalyzer: ISoundAnalyzer) {
    super(p5Instance);
  }

  public shouldDrawHeart (enable: boolean): void {
    this.heartEnabled = enable;
  }

  public shouldDrawStar (enable: boolean): void {
    this.starEnabled = enable;
  }

  private drawStar (centerX: number, centerY: number, radius: number): void {
    if (!this.starEnabled || this.p5Instance?.sketch == null) return;

    const angle = Math.PI / 5; // Angle between star points
    this.p5Instance.sketch.beginShape();
    for (let i = 0; i < 10; i++) {
      const r = (i % 2 === 0) ? radius : radius / 2;
      const x = centerX + r * Math.cos(i * angle - Math.PI / 2);
      const y = centerY + r * Math.sin(i * angle - Math.PI / 2);
      this.p5Instance.sketch.vertex(x, y);
    }
    this.p5Instance.sketch.endShape(this.p5Instance.sketch.CLOSE);
  }

  private drawHeart (centerX: number, centerY: number, size: number): void {
    if (this.p5Instance?.sketch == null) return;
    if (!this.heartEnabled || this.p5Instance?.sketch == null) return;
    this.p5Instance.sketch.beginShape();
    for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
      const x = 16 * Math.pow(Math.sin(angle), 3);
      const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));

      // Adjust scale here
      const scaledX = centerX + (size * x) / 16; // scaling down the x component
      const scaledY = centerY + (size * y) / 16; // scaling down the y component

      this.p5Instance.sketch.vertex(scaledX, scaledY);
    }
    this.p5Instance.sketch.endShape('close');
  }

  public draw (params?: IDrawBehaviorParams): void {
    super.draw(params);
    const shapes = this.shapes;
    const { position } = params ?? {};

    // Draw a heart within the first shape, if any
    if (shapes != null && shapes.length > 0 && position != null) {
      const firstShape = shapes[0];
      let centerX, centerY, symbolSize;

      switch (firstShape.type) {
        case ShapeType.rectangle: {
          const rectangle = firstShape as unknown as IRectangle;
          centerX = position.x + firstShape.offset.x + rectangle.width / 2;
          centerY = position.y + firstShape.offset.y + rectangle.height / 2;
          // Set heart size to a fraction of the smaller dimension of the rectangle
          symbolSize = Math.min(rectangle.width, rectangle.height) / 4;
          break;
        }
        case ShapeType.circle: {
          const circle = firstShape as unknown as ICircle;
          centerX = position.x + firstShape.offset.x;
          centerY = position.y + firstShape.offset.y;
          // Set heart size to a fraction of the circle's radius
          symbolSize = circle.radius * 0.5;
          break;
        }
        // Add cases for other shape types if needed
      }

      if (centerX != null && centerY != null && symbolSize != null) {
        this.drawHeart(centerX, centerY, symbolSize);
        this.drawStar(centerX, centerY, symbolSize);
      }
    }
  }
};

export default DrawPowerUp;
export const DrawPowerUpName = Symbol.for('DrawPowerUp');
