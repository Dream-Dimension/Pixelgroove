import type IFace from './IFace';
import type IObjectedDetected from './IObjectDetected';
import type IPose from './IPose';

export interface FrameFeatures {
  faces: IFace[]
  objectsDetected: IObjectedDetected[]
  bodyPoses: IPose[] // toodo update
  fft: number[]
  waveform: number[]
}

export type VideoFileGuid = string;
export type VideoTimestamp = number;
export type FeaturesDetectedByTimestamp = Record<VideoTimestamp, FrameFeatures>;

export interface VideoFileBasicInfo {
  guid: VideoFileGuid
  name: string
  duration: number
  dimensions: {
    width: number
    height: number
  }
  // fps (can only be extracted via node)
  // filetype
}

interface VideoAugmentationData {
  featuresDetected: FeaturesDetectedByTimestamp
  // sceneTransitions: VideoTimestamp[]
  videoFileInfo: VideoFileBasicInfo
  percentageAnalyzed: number
};

export default VideoAugmentationData;
