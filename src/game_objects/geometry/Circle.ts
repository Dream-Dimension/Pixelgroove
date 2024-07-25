import { injectable, inject } from 'tsyringe';
import Shape from './Shape';
import type IShape from '../../interfaces/IShape';
import { ShapeType, DEFAULT_SHAPE_SIZE, ShapeDefaultSizeName } from '../../interfaces/IShape';
import type ICircle from '../../interfaces/ICircle';

@injectable()
class Circle extends Shape implements ICircle, IShape {
  public _radius: number = DEFAULT_SHAPE_SIZE / 2;

  constructor (
    @inject(ShapeDefaultSizeName) width: number = DEFAULT_SHAPE_SIZE) {
    super();
    this._radius = width / 2;
    this.type = ShapeType.circle;
  }

  get radius (): number {
    return this._radius;
  }

  set radius (radius: number) {
    this._radius = radius;
  }

  get width (): number {
    return this._radius * 2;
  }

  set width (width: number) {
    this._radius = width / 2;
  }

  get height (): number {
    return this._radius * 2;
  }

  set height (height: number) {
    this._radius = height / 2;
  }
};

export default Circle;
