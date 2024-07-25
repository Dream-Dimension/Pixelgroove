import type * as p5 from 'p5';
export const ShapeDefaultSizeName = 'ShapeDefaultSize';

// enum representing ShapeTypes
export enum ShapeType {
  circle = 'circle',
  triangle = 'triangle',
  rectangle = 'rectangle',
  polygon = 'polygon',
  line = 'line'
};

export default interface IShape {
  get width(): number
  set width(width: number)
  get height(): number
  set height(height: number)
  get offset(): p5.Vector
  set offset(offset: p5.Vector)
  type: ShapeType
  get justCollided(): boolean
  set justCollided(collided: boolean)
};

export const DEFAULT_SHAPE_SIZE = 100;
