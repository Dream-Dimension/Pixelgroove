import type * as p5 from 'p5';

export default interface ILine {
  get vertex1(): p5.Vector
  set vertex1(vertex: p5.Vector)

  get vertex2(): p5.Vector
  set vertex2(vertex: p5.Vector)

  get width(): number
  set width(width: number)

  get height(): number
  set height(height: number)
};

export const ILineName = Symbol.for('ILine');
