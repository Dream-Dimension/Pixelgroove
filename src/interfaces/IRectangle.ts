export default interface IRectangle {
  get height(): number
  set height(height: number)
  get width(): number
  set width(width: number)
};

export const IRectangleName = Symbol.for('IRectangle');
