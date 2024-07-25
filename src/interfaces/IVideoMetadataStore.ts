import type VideoAugmentationData from './VideoAugmentationData';
import { type VideoFileGuid, type FrameFeatures, type VideoTimestamp } from './VideoAugmentationData';

export interface MediaMetadataQueryOptions {
  // beforeBufferMs: number
  afterBufferMS: number
};

interface IVideoMetadataStore {
  getData: (guid: VideoFileGuid) => Promise<VideoAugmentationData | undefined>
  // saveData: (guid: VideoFileGuid, data: VideoAugmentationData) => Promise<void>
  getDataNear: (guid: VideoFileGuid, timestamp: VideoTimestamp, options?: MediaMetadataQueryOptions) => Promise<FrameFeatures | undefined>
  getLatestFrameFeatures: (guid: VideoFileGuid) => FrameFeatures | undefined
  commitToDisk: () => Promise<void>;
  autoSaveToDiskEvery: (seconds: number) => void;
  saveToMemory: (guid: VideoFileGuid, data: VideoAugmentationData) =>void 
  loadFromMemory: (guid: VideoFileGuid) => VideoAugmentationData | undefined;
  getDataFromMemory: (guid: VideoFileGuid) => VideoAugmentationData | undefined
  disableAutoSave: () => void
};

export default IVideoMetadataStore;

export const IVideoMetadataStoreName = Symbol.for('IVideoMetadataStore');
