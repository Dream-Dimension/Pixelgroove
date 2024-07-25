import type IFace from './IFace';

/**
 * A face object returned by the BlazeFace model minus the landmarks.
 */
export interface IObjectedDetected extends IFace {
  // /** The upper left-hand corner of the face. */
  topLeft: [number, number]
  /** The lower right-hand corner of the face. */
  bottomRight: [number, number]
  /** Probability of the face detection. */
  probability: number
  /** Type of object detected: e.g person, hat, etc */
  type: string

};

export default IObjectedDetected;
