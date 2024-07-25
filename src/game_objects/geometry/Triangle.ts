// Triangle.ts
import { inject, injectable } from 'tsyringe';
import Shape from './Shape';
import * as p5 from 'p5';
import type ITriangle from '../../interfaces/ITriangle';
import { ShapeDefaultSizeName, DEFAULT_SHAPE_SIZE, ShapeType } from '../../interfaces/IShape';

/**
 * For setting width and height of the triangle, it will turn it into
 * a ship like triangle.
 *
 * // TODO: make it so it scales the triangle and keeps it's overall shape if possible
 */
@injectable()
class Triangle extends Shape implements ITriangle {
  private _vertex1: p5.Vector;
  private _vertex2: p5.Vector;
  private _vertex3: p5.Vector;

  constructor (
    @inject(ShapeDefaultSizeName) width: number = DEFAULT_SHAPE_SIZE,
    @inject(ShapeDefaultSizeName) height: number = DEFAULT_SHAPE_SIZE) {
    super();
    this.type = ShapeType.triangle;
    // Initialize vertices with default positions
    this._vertex1 = new p5.Vector(0, 0); // top left
    this._vertex2 = new p5.Vector(0, 50); // bottom left
    this._vertex3 = new p5.Vector(25, 50); // middle center front
    this.width = width;
    this.height = height;
  }

  private calculateVertices (width = 10, height = 10): void {
    // Calculate the vertices based on the width and height
    this._vertex1 = new p5.Vector(0, 0); // top left
    this._vertex2 = new p5.Vector(0, height); // bottom left
    this._vertex3 = new p5.Vector(width, height / 2); // middle center front
  }

  get vertex1 (): p5.Vector {
    return this._vertex1;
  }

  set vertex1 (vertex: p5.Vector) {
    this._vertex1 = vertex;
  }

  get vertex2 (): p5.Vector {
    return this._vertex2;
  }

  set vertex2 (vertex: p5.Vector) {
    this._vertex2 = vertex;
  }

  get vertex3 (): p5.Vector {
    return this._vertex3;
  }

  set vertex3 (vertex: p5.Vector) {
    this._vertex3 = vertex;
  }

  set width (width: number) {
    this.calculateVertices(width, this.height);
  }

  get width (): number {
    // Calculate width as the maximum horizontal distance between the three vertices
    const xCoords = [this._vertex1.x, this._vertex2.x, this._vertex3.x];
    return Math.max(...xCoords) - Math.min(...xCoords);
  }

  set height (height: number) {
    this.calculateVertices(this.width, height);
  }

  get height (): number {
    // Calculate height as the maximum vertical distance between the three vertices
    const yCoords = [this._vertex1.y, this._vertex2.y, this._vertex3.y];
    return Math.max(...yCoords) - Math.min(...yCoords);
  }
}

export default Triangle;
