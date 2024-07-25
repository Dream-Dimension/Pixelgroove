import type GoBackCb from '../types/GoBackCb';
import type IDrawBehavior from './IDrawBehavior';

export default interface IVideoAnalyzer extends IDrawBehavior<void> {
  load: (goBackCb?: GoBackCb) => void
  update: () => void
}

export const IVideoAnalyzerName = Symbol.for('IVideoAnalyzer');
