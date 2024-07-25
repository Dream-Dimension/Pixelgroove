export default interface ICircle {
  get radius(): number
  set radius(radius: number)
};

export const ICircleName = Symbol.for('ICircle');
