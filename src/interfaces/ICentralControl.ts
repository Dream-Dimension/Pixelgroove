export default interface ICentralControl {
  init: () => void
}

export const ICentralControlName = Symbol.for('ICentralControl');
