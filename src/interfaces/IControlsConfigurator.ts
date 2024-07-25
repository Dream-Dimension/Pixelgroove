import type GoBackCb from '../types/GoBackCb';
import type IDrawBehavior from './IDrawBehavior';

export default interface IControlsConfigurator extends IDrawBehavior<void> {
  // Add methods and properties here
  load: (goBackCb?: GoBackCb) => void
  update: () => void
}

export const IControlsConfiguratorName = Symbol.for('IControlsConfigurator');
