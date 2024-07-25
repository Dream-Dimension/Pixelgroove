import { inject, injectable } from 'tsyringe';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import type IVideoMetadataStore from '../interfaces/IVideoMetadataStore';
import { type MediaMetadataQueryOptions } from '../interfaces/IVideoMetadataStore';
import { type VideoTimestamp, type FrameFeatures, type VideoFileGuid } from '../interfaces/VideoAugmentationData';
import type VideoAugmentationData from '../interfaces/VideoAugmentationData';
import assert from '../libs/asssert';

/**
  This module stores & retrieves timeseries metadata corresponding to a video file.
  TODO: Updates to the data through this interface do not guarantee saving to long term storage.

  To get long term persistance use saveData().
*/

@injectable()
class VideoMetadataStore implements IVideoMetadataStore {
  videoMetaData: Record<string, VideoAugmentationData> = {};
  private autoSaveIntervalId: number | undefined;
  db: IDBDatabase | undefined;

  constructor (
    @inject(ILoggerName) private readonly logger: ILogger) {}

  initDB = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('VideoMetadataDB', 1);

      request.onerror = (event) => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos', { keyPath: 'guid' });
        }
      };
    });
  };
  
  // Commits the in-memory data to disk
  commitToDisk = async (): Promise<void> => {
    for (const guid in this.videoMetaData) {
      await this.saveDataToDisk(guid, this.videoMetaData[guid]);
    }
  };

  // Automatically saves data to disk every specified interval
  autoSaveToDiskEvery = (seconds: number): void => {
    if (this.autoSaveIntervalId !== undefined) {
      clearInterval(this.autoSaveIntervalId); // Clear existing interval
    }
    this.autoSaveIntervalId = setInterval(() => {
      this.commitToDisk();
    }, seconds * 1000) as unknown as number;
  };

  disableAutoSave = () => {
    clearInterval(this.autoSaveIntervalId); // Clear existing interval
  }
  
  // Saves data to in-memory storage
  saveToMemory = (guid: VideoFileGuid, data: VideoAugmentationData): void => {
    assert(guid != null, 'GUID is null');
    this.videoMetaData[guid] = data;
  };

  // Loads data from in-memory storage
  loadFromMemory = (guid: VideoFileGuid): VideoAugmentationData | undefined => {
    return this.videoMetaData[guid];
  };

  saveDataToDisk = async (guid: VideoFileGuid, data: VideoAugmentationData): Promise<void> => {
    assert(data != null, 'Data saved is null');
    assert(this.db != null, 'Db is null');
    if (data == null || this.db == null) return;

    const transaction = this.db?.transaction(['videos'], 'readwrite');
    const store = transaction.objectStore('videos');

    const existingDataRequest = store.get(guid);

    existingDataRequest.onsuccess = () => {
      const existingData = existingDataRequest.result;

      if (existingData != null) {
        if (Object.keys(existingData.featuresDetected).length > Object.keys(data.featuresDetected).length) {
          console.error('Existing data already has more data than the new data');
          return;
        }
      }

      store.put({ guid, ...data });
    };

    existingDataRequest.onerror = () => {
      console.error('Error reading existing data');
    };
  };

  private readonly loadDataFromDisk = async (guid: VideoFileGuid): Promise<VideoAugmentationData | undefined> => {
    return await new Promise((resolve, reject) => {
      if (this.db == null) {
        this.initDB();
        resolve(undefined);
        return;
      }
      const transaction = this.db.transaction(['videos']);
      const store = transaction.objectStore('videos');
      const request = store.get(guid);

      request.onsuccess = () => {
        if (request.result != null) {
          console.log('Data loaded successfully');
          this.saveToMemory(guid, request.result);
          resolve(request.result);
        } else {
          resolve(undefined);
        }
      };

      request.onerror = () => {
        console.error('Error loading data');
        reject(request.error);
      };
    });
  };

  public getLatestFrameFeatures = (guid: VideoFileGuid): FrameFeatures | undefined=> {
    const videoMetaData = this.getDataFromMemory(guid);
    if (videoMetaData?.featuresDetected == null) {
      return undefined;
    }

    // Sort the timestamps numerically and get the latest one
    const timestamps = Object.keys(videoMetaData.featuresDetected).map(Number);
    if (timestamps.length === 0) {
      return undefined;
    }
    const latestTimestamp = Math.max(...timestamps);
    return videoMetaData.featuresDetected[latestTimestamp];
  };

  public getDataFromMemory = (guid: VideoFileGuid): VideoAugmentationData | undefined => {
    return this.videoMetaData[guid];
  }
  
  public getData = async (guid: VideoFileGuid): Promise<VideoAugmentationData | undefined> => {
    if (this.videoMetaData[guid] != null) {
      return this.videoMetaData[guid];
    }
    const result =  await this.loadDataFromDisk(guid);
    return result;
  };

  public getDataNear = async (guid: string, timestamp: VideoTimestamp, options?: MediaMetadataQueryOptions | undefined): Promise<FrameFeatures | undefined> => {
    // Get narest to the time passed in:
    const videoMetaData = await this.getData(guid);
    if (videoMetaData == null) {
      return undefined;
    }

    let closestTimestamp: VideoTimestamp | null = null;
    let minimumDifference: number = Infinity;
    const DIFFERENCE_THRESHOLD = 0.5;

    // Iterate over the featuresDetected to find the closest timestamp
    for (const currentTimestampStr in videoMetaData.featuresDetected) {
      const currentTimestamp = Number(currentTimestampStr); // Cast the timestamp to a number
      const difference = Math.abs(timestamp - currentTimestamp);

      if (difference < minimumDifference && difference < DIFFERENCE_THRESHOLD) {
        minimumDifference = difference;
        closestTimestamp = currentTimestamp;
      }
    }

    // Return the features for the closest timestamp, if found
    if (closestTimestamp !== null) {
      return videoMetaData.featuresDetected[closestTimestamp];
    } else {
      return undefined;
    }
  };
};

export default VideoMetadataStore;
