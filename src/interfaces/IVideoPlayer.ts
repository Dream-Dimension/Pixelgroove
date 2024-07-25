import type * as p5 from 'p5';
import type P5File from './P5File';
import { type VideoFileGuid, type VideoFileBasicInfo } from './VideoAugmentationData';

// Consider:
// make this IMediaPlayer
// make a new interface for IVideoPlayer that extends it
// and overrides load and also adds getVideoElement

export default interface IVideoPlayer {
  load: (file: P5File) => Promise<HTMLVideoElement>
  draw: (x?: number, y?: number, width?: number, height?: number) => void
  play: () => void
  loop: () => void
  pause: () => void
  stop: () => Promise<void>
  get loopCount(): number
  subscribeToLoopCount: (callback: (loopCount: number) => void) => () => void
  advanceToFrame: (frame: number) => void
  updateVideoToFillScreen: () => [number, number]
  enableAnalyze: () => void
  disableAnalyze: () => void
  playOneFrameAtATime: () => void
  saveFeaturesDetectedSoFar: () => number
  percentageOfVideoPlayed: () => number
  stopPlayingOneFrameAtAtime: () => void
  jumpToPercentage: (percentage: number, autoPlay?: boolean, callback?: () => void) => void
  update: () => void
  startScreenShake: (intensity?: number, duration?: number) => void
  set volume(volume: number)
  get volume(): number
  get width(): number
  get height(): number
  get originalVideoWidth(): number
  get originalVideoHeight(): number
  videoFileBasicInfo: VideoFileBasicInfo
  fileGUID: VideoFileGuid
  videoElement: p5.MediaElement | undefined
}

export enum HTML5VideoEvents {
  TIME_UPDATE = 'timeupdate',
  CAN_PLAY = 'canplay',
  CAN_PLAY_THROUGH = 'canplaythrough',
  LOAD_METADATA = 'loadedmetadata'
};

export const IVideoPlayerName = Symbol.for('IVideoPlayer');
