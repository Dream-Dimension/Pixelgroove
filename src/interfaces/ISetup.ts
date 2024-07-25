export default interface ISetup {
  init: () => void
}

export const ISetupName = Symbol.for('ISetup');
