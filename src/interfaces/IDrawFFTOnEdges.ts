import { type IDrawBehaviorParams } from './IDrawBehavior';
import type IDrawShapesBehavior from './IDrawShapesBehavior';

export type EdgeOrientation = 'top' | 'bottom';

interface IDrawFFTOnEdges extends IDrawShapesBehavior<IDrawBehaviorParams> {
  set edge (edge: EdgeOrientation)
  get edge (): EdgeOrientation

  set cherryVisible (enabled: boolean)
  get cherryVisible (): boolean

  set coreBodyVisible (enabled: boolean)
  get coreBodyVisible (): boolean

}

export default IDrawFFTOnEdges;
