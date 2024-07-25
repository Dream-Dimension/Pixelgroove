import { injectable, inject } from 'tsyringe';
import Shape from './Shape';
import type IRectangle from '../../interfaces/IRectangle';
import type IShape from '../../interfaces/IShape';
import { ShapeType, DEFAULT_SHAPE_SIZE, ShapeDefaultSizeName } from '../../interfaces/IShape';

@injectable()
class Rectangle extends Shape implements IRectangle, IShape {
  public _width: number = DEFAULT_SHAPE_SIZE;
  public _height: number = DEFAULT_SHAPE_SIZE;

  constructor (
    @inject(ShapeDefaultSizeName) width: number = DEFAULT_SHAPE_SIZE,
    @inject(ShapeDefaultSizeName) height: number = DEFAULT_SHAPE_SIZE) {
    super();
    this._width = width;
    this._height = height;
    this.type = ShapeType.rectangle;
  }

  get width (): number {
    return this._width;
  }

  set width (width: number) {
    this._width = width;
  }

  get height (): number {
    return this._height;
  }

  set height (height: number) {
    this._height = height;
  }
};

export default Rectangle;
