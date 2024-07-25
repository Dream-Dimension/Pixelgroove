import { type NormalizedFace } from '@tensorflow-models/blazeface';

/**
 * A face object returned by the BlazeFace model minus the landmarks.
 */
interface IFace extends Omit<NormalizedFace, 'landmarks'> {
  /** The upper left-hand corner of the face. */
  topLeft: [number, number]
  /** The lower right-hand corner of the face. */
  bottomRight: [number, number]
  /** Probability of the face detection. */
  probability: number
};

export default IFace;
