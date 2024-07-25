// Line.ts
import { inject, injectable } from 'tsyringe';
import Shape from './Shape';
import * as p5 from 'p5';
import type ILine from '../../interfaces/ILine';
import { ShapeDefaultSizeName, DEFAULT_SHAPE_SIZE, ShapeType } from '../../interfaces/IShape';

@injectable()
class Line extends Shape implements ILine {
  private _vertex1: p5.Vector;
  private _vertex2: p5.Vector;

  constructor (
    @inject(ShapeDefaultSizeName) width: number = DEFAULT_SHAPE_SIZE,
    @inject(ShapeDefaultSizeName) height: number = 0) {
    super();
    this.type = ShapeType.line;
    this._vertex1 = new p5.Vector(0, 0);
    this._vertex2 = new p5.Vector(width, height);
  }

  get vertex1 (): p5.Vector {
    return this._vertex1;
  }

  set vertex1 (vertex: p5.Vector) {
    this._vertex1 = vertex;
    this.updateVertex2();
  }

  get vertex2 (): p5.Vector {
    return this._vertex2;
  }

  set vertex2 (vertex: p5.Vector) {
    this._vertex2 = vertex;
  }

  get width (): number {
    return Math.abs(this._vertex2.x - this._vertex1.x);
  }

  set width (width: number) {
    this._vertex2.x = this._vertex1.x + width;
  }

  get height (): number {
    return Math.abs(this._vertex2.y - this._vertex1.y);
  }

  set height (height: number) {
    this._vertex2.y = this._vertex1.y + height;
  }

  private updateVertex2 (): void {
    // Adjusts vertex2 to maintain the current width and height
    this._vertex2 = new p5.Vector(this._vertex1.x + this.width, this._vertex1.y + this.height);
  }
}

export default Line;
