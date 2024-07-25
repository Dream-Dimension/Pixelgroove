import type * as p5 from 'p5';

export default interface ITriangle {
  get vertex1(): p5.Vector
  set vertex1(vertex: p5.Vector)
  get vertex2(): p5.Vector
  set vertex2(vertex: p5.Vector)
  get vertex3(): p5.Vector
  set vertex3(vertex: p5.Vector)

  // TODO: to be reconsidered:
  get height(): number
  set height(height: number)
  get width(): number
  set width(width: number)
};

export const ITriangleName = Symbol.for('ITriangle');
