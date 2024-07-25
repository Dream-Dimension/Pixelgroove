import { injectable, inject } from 'tsyringe';
import type IVideoPlayer from '../interfaces/IVideoPlayer';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import type * as p5 from 'p5';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import type P5File from '../interfaces/P5File';
import P5Static from '../libs/P5Static';
import waitUntil from '../utils/WaitUntil';
import { clamp } from '../utils/Mathy';
import type ISoundAnalyzer from '../interfaces/ISoundAnalyzer';
import { type FrameFeatures, type FeaturesDetectedByTimestamp, type VideoFileGuid, type VideoFileBasicInfo } from '../interfaces/VideoAugmentationData';
import type VideoAugmentationData from '../interfaces/VideoAugmentationData';
import { HTML5VideoEvents } from '../interfaces/IVideoPlayer';
import assert from '../libs/asssert';
import type IFace from '../interfaces/IFace';
import IMediaModel from '../interfaces/IMediaModel';
import type IObjectedDetected from '../interfaces/IObjectDetected';
import type IPose from '../interfaces/IPose';
import { BlazeModelName } from './models/BlazeModel';
import { CocoModelName } from './models/CocoModel';
import { PosenetModelName } from './models/PosenetModel';
import IVideoMetadataStore, { IVideoMetadataStoreName } from '../interfaces/IVideoMetadataStore';
import EventPublisher, { type EventCallback } from './EventPublisher';

const { LOAD_METADATA, CAN_PLAY, CAN_PLAY_THROUGH } = HTML5VideoEvents;
const LOOP_INCREASE_EVENT = 'loopIncreased';
/**
  The purpose of this module is to load and play a video file in a safe manner.

  It also provides a way to analyze the sound  (via FFT) of the video file as it is being played.

  It also generates a GUID for the video file.
*/
const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const { TIME_UPDATE } = HTML5VideoEvents;
// const ENDED_EVENT = 'ended';

@injectable()
class VideoPlayer implements IVideoPlayer, ISoundAnalyzer {
  public readonly FFT_MAX_VALUE = 255;
  private isLoadingModels = false;
  private modelsAreLoaded = false;
  private latestFeaturesDetected: FrameFeatures | undefined;
  private _frameAnalysisEnabled = false;
  private _isPlayingOneFrameAtATime = false;
  private _fftNumberOfBins = 64;
  private videoFile: P5File | undefined;
  private _videoElement: p5.MediaElement | undefined;
  private sound: p5.SoundFile | undefined;
  private _fft: p5.FFT | undefined;
  private featuresDetected: FeaturesDetectedByTimestamp = {};
  private _volume: number = MAX_VOLUME;
  private readonly loopCountPublisher = new EventPublisher<number>();

  // Screen shake properties
  private _shakeIntensity: number = 0;
  private _shakeDuration: number = 0;
  private _shakeStartTime: number = 0;

  private _loopCount = 0;
  private lastTime = 0;
  private readonly loopSubscribers: Array<(loopCount: number) => void> = [];

  // Property to store the timestamp of the last analyzed frame
  private lastAnalyzedFrameNumber: number = -1;

  // Frame duration for 29 FPS (in seconds)
  // NOTE: we assume all videos are 29fps
  private readonly frameDuration: number = 1 / 29.97;
  static readonly isPowerOfTwo = (value: number): boolean => {
    return value > 0 && (value & (value - 1)) === 0;
  };

  constructor (
    @inject(BlazeModelName) private readonly blazeModel: IMediaModel<IFace[]>,
    @inject(PosenetModelName) private readonly poseModel: IMediaModel<IPose[]>,
    @inject(CocoModelName) private readonly cocoModel: IMediaModel<IObjectedDetected[]>,
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance,
    @inject(IVideoMetadataStoreName) private readonly dataStore: IVideoMetadataStore,
    @inject(ILoggerName) private readonly logger: ILogger) {
  }

  public subscribeToLoopCount = (callback: EventCallback<number>): () => void => {
    return this.loopCountPublisher.subscribe(LOOP_INCREASE_EVENT, callback);
  };

  private readonly notifySubscribers = (): void => {
    this.loopCountPublisher.publish(LOOP_INCREASE_EVENT, this._loopCount);
  };

  public get loopCount (): number {
    return this._loopCount;
  }

  public get videoElement (): p5.MediaElement | undefined {
    if (this._videoElement == null) return undefined;
    return this._videoElement;
  };

  private set videoElement (videoElement: p5.MediaElement) {
    this._videoElement = videoElement;
  }

  public advanceToFrame = (frame: number): void => {
    const videoElement = this.videoElement;
    assert(videoElement != null, 'Video element is null');
    if (videoElement == null) return;
    const videoHtmlEl = videoElement.elt as HTMLVideoElement;
    videoHtmlEl.currentTime = this.frameDuration * frame;
  };

  public get width (): number {
    return this.videoElement?.width ?? this.originalVideoWidth;
  }

  public get height (): number {
    return this.videoElement?.height ?? this.originalVideoHeight;
  }

  public get originalVideoWidth (): number {
    return this.videoElement?.elt?.videoWidth ?? 0;
  }

  public get originalVideoHeight (): number {
    return this.videoElement?.elt?.videoHeight ?? 0;
  }

  /**
   * Number of bins are the "bands" / "bar graphs" count we want when computing an FFT over some audio.
   * Essentially how granular we want it to be. See p5 docs for details.
   */
  public get fftNumberOfBins (): number {
    return this._fftNumberOfBins;
  }

  public set fftNumberOfBins (numberOfBins: number) {
    assert(this.isValidNumberOfBins(numberOfBins), 'Invalid number of bins.  Must be a power of 2 between 16-1024');
    if (!this.isValidNumberOfBins(numberOfBins)) return;
    this._fftNumberOfBins = numberOfBins;
  }

  public get fft (): number[] {
    if (this._fft == null) return [];
    return this._fft?.analyze(this._fftNumberOfBins).splice(0, this._fftNumberOfBins);
  };

  public get waveform (): number[] {
    const BAD_WAVEFORM_VALUE = -1;
    if (this._fft == null) return [];
    return this._fft?.waveform().filter(x => x != null && x !== BAD_WAVEFORM_VALUE);
  };

  public set volume (volume: number) {
    assert(volume >= MIN_VOLUME && volume <= MAX_VOLUME, 'Volume must be between 0 and 1');
    volume = clamp(volume, MIN_VOLUME, MAX_VOLUME);
    this.videoElement?.volume(0);
    this.sound?.setVolume(volume);
    this._volume = volume;
  };

  public get volume (): number {
    return this._volume;
  }

  public enableAnalyze = (): void => {
    this._frameAnalysisEnabled = true;
    this.dataStore.autoSaveToDiskEvery(10);
  };

  public disableAnalyze = (): void => {
    this._frameAnalysisEnabled = false;
    this.dataStore.disableAutoSave();
  };

  private readonly loadModels = async (): Promise<void> => {
    if (this.modelsAreLoaded) return;
    this.isLoadingModels = true;
    await this.blazeModel?.load();
    await this.cocoModel?.load();
    await this.poseModel?.load();
    this.isLoadingModels = false;
    this.modelsAreLoaded = true;
  };

  // Returns at what % we saved.
  public saveFeaturesDetectedSoFar = (): number => {
    const videoFileBasicInfo = this.videoFileBasicInfo;
    const percentageAnalyzed = this.percentageOfVideoPlayed();
    const videoAugmentationData: VideoAugmentationData = {
      videoFileInfo: videoFileBasicInfo,
      featuresDetected: this.featuresDetected,
      percentageAnalyzed
    };
    assert(percentageAnalyzed !== 0, 'percentageAnalyzed zero in save features');
    if (percentageAnalyzed === 0) return 0;
    this.dataStore.saveToMemory(this.fileGUID, videoAugmentationData);
    (async () => {
      await this.dataStore.commitToDisk();
    })();
    const percentage = this.percentageOfVideoPlayed();
    return percentage;
  };

  public percentageOfVideoPlayed = (decimalsPlaces = 2): number => {
    return Number(((this.videoElement?.elt?.currentTime ?? 0) /
       (this.videoElement?.elt.duration ?? 1) * 100).toFixed(decimalsPlaces));
  };

  stopPlayingOneFrameAtAtime = (): void => {
    this._isPlayingOneFrameAtATime = false;
  };

  playOneFrameAtATime = (): void => {
    this._isPlayingOneFrameAtATime = true;
    this._playOneFrameAtAtime();
  };

  private readonly analyzeFrame = async (): Promise<void> => {
    const videoElement = this.videoElement;
    if (videoElement == null) throw new Error('Video element is null.');

    const videoHtmlEl = videoElement.elt as HTMLVideoElement;
    const currentFrameNumber = Math.floor(videoHtmlEl.currentTime / this.frameDuration);

    // Only analyze if we are on a new frame
    // Proceed with analysis only if this is a new frame
    if (this.lastAnalyzedFrameNumber === currentFrameNumber) {
      // Frame was already analyzed so we exit:
      return;
    }
    this.lastAnalyzedFrameNumber = currentFrameNumber;

    const features: FrameFeatures = {
      faces: [],
      objectsDetected: [],
      bodyPoses: [],
      fft: [],
      waveform: []
    };

    const faces = await this.blazeModel.runOn(videoElement.elt as HTMLVideoElement);
    const objectsDetected = await this.cocoModel.runOn(videoElement.elt as HTMLVideoElement);
    const poses = await this.poseModel.runOn(videoElement.elt as HTMLVideoElement);
    if (faces != null || objectsDetected != null || poses != null) {
      features.faces = faces ?? [];
      features.objectsDetected = objectsDetected ?? [];
      features.bodyPoses = poses ?? [];
      this.featuresDetected[videoHtmlEl.currentTime] = features;
    }

    this.latestFeaturesDetected = features;
    if (this._frameAnalysisEnabled  /*&& this.percentageOfVideoPlayed() > 0.98*/) {
      this.saveFeaturesDetectedSoFar();
    }
  };

  public jumpToPercentage = (percentage: number, autoPlay = true, callback?: () => void): void => {
    assert(this.videoElement != null, 'Video element is null');
    if (this.videoElement == null) return;

    const videoHtmlEl = this.videoElement.elt as HTMLVideoElement;

    // Ensure the percentage is between 0 and 100
    const clampedPercentage = clamp(percentage, 0, 100);
    // Calculate the time in seconds based on the percentage
    const timeInSeconds = (videoHtmlEl.duration * clampedPercentage) / 100;

    const onTimeUpdate = (): void => {
      // Wrap the async logic inside a non-async function
      void (async () => {
        // Remove the event listener after it's been triggered
        videoHtmlEl.removeEventListener('timeupdate', onTimeUpdate);

        // Await the play method
        try {
          if (autoPlay) {
            await videoHtmlEl.play();
          }
        } catch (error) {
          console.error('Error playing video:', error);
        }

        // Call the callback function if provided
        if (callback != null) {
          callback();
        }
      })();
    };

    // Add the time update event listener
    videoHtmlEl.addEventListener('timeupdate', onTimeUpdate);

    // Set the current time of the video to the calculated time
    videoHtmlEl.currentTime = timeInSeconds;
  };

  private readonly _playOneFrameAtAtime = (): void => {
    if (!this._isPlayingOneFrameAtATime) return;

    this.latestFeaturesDetected = undefined;

    void (async () => {
      const videoElement = this.videoElement;
      if (videoElement == null) throw new Error('Video element is null.');
      // Coding through interface?
      const videoHtmlEl = videoElement.elt as HTMLVideoElement;

      const oneFrameTimeSecs = 1 / 29.97; // in seconds, we assume 29.7 FPS
      if (videoHtmlEl.duration > videoHtmlEl.currentTime) {
        await this.analyzeFrame();
        if (!videoHtmlEl.ended) {
          // It is important we wait for the TIME_UPDATE event to fire
          // before moving to the next frame.
          //
          // Without doing this we risk the videoPlayer getting out of sync and blocking
          // causing a weird bug with the draw function falling behind. It only happens in some videos
          // and many times not at the start of the video.
          //
          // Bug: at times video freezes on one frame even though the video.currentTime is moving forward.
          // In essence curerntTime gets out of sync with the video frame being displayed in the UI.
          // The video eventually does continue but frames are skipped.
          // requestAnimation has no impact on this behavior.
          // setTimeouts helped but is variable and often longer than necessary.
          // Using the TIME_UPDATE event is a more deterministic solution.
          const onTimeUpdate = (): void => {
            videoHtmlEl.removeEventListener(TIME_UPDATE, onTimeUpdate);
            if (this._isPlayingOneFrameAtATime) {
              requestAnimationFrame(this._playOneFrameAtAtime);
            }
          };
          videoHtmlEl.addEventListener(TIME_UPDATE, onTimeUpdate);

          // Advance to the next frame:
          videoHtmlEl.currentTime += oneFrameTimeSecs;
        }
      }
    })();
  };

  private readonly isValidNumberOfBins = (numBins: number): boolean => {
    const minNumBins = 16;
    const maxNumBins = 1024;
    return numBins >= minNumBins && numBins <= maxNumBins && VideoPlayer.isPowerOfTwo(numBins);
  };

  public load = async (_videoFile: P5File): Promise<HTMLVideoElement> => {
    assert(this.p5Instance.sketch != null, 'p5 sketch null in VideoPlayer.load');
    this._loopCount = 0;
    this.lastTime = 0;
    await this.loadModels();
    this.videoFile = _videoFile;
    this._isPlayingOneFrameAtATime = false;
    this._frameAnalysisEnabled = false;
    this.featuresDetected = {};
    const data = await this.dataStore.getData(this.fileGUID);
    if (data != null) {
      this.featuresDetected = data.featuresDetected;
    }
    // @ts-expect-error: missing proper method param match:
    this.videoElement = this.p5Instance.sketch?.createVideo(this.videoFile.data);
    this.videoElement?.stop();
    this.videoElement?.hide();
    this.videoElement?.volume(0);
    await this.loadVideoFully();
    this._fft = new P5Static.FFT();
    // @ts-expect-error: missing proper method param match:
    this.sound = this.p5Instance.sketch?.loadSound(this.videoFile.data);
    await waitUntil(this.soundIsLoaded);
    this.volume = MAX_VOLUME;
    return this.videoElement?.elt;
  };

  // Load videoWidth, videoHeight, etc as part of elt object
  private readonly loadVideoFully = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      let canPlay = false;
      let canPlayThroughFired = false;
      let loadedMetadataFired = false;

      const checkIfAllEventsFired = (): void => {
        if (canPlayThroughFired && loadedMetadataFired && canPlay) {
          resolve();
        }
      };

      this.videoElement?.elt.addEventListener(LOAD_METADATA, () => {
        loadedMetadataFired = true;
        checkIfAllEventsFired();
      });

      this.videoElement?.elt.addEventListener(CAN_PLAY, () => {
        canPlay = true;
        checkIfAllEventsFired();
      });

      // This is unlikly to be effective:
      // The purpose was to wait until the video is fully buffered
      // so we we can avoid problems with video getting stuck
      // when running video analyzer. A different solution was needed.
      this.videoElement?.elt.addEventListener(CAN_PLAY_THROUGH, () => {
        canPlayThroughFired = true;
        checkIfAllEventsFired();
      });

      this.videoElement?.elt.addEventListener('error', () => {
        reject(new Error('Error loading video'));
      });

      this.videoElement?.elt.load();
    });
  };

  private readonly soundIsLoaded = (): boolean => {
    if (this.sound == null) return false;
    return this.sound.duration() > 0;
  };

  public get fileGUID (): VideoFileGuid {
    const fileName = this.videoFile?.file.name ?? '';
    const duration = this.videoElement?.elt?.duration.toString() ?? 0;
    const width = this.originalVideoWidth;
    const height = this.originalVideoHeight;

    return `${fileName}_t_${duration}_w_${width}_h_${height}`;
  };

  public get videoFileBasicInfo (): VideoFileBasicInfo {
    const name = this.videoFile?.file.name ?? '';
    const duration = this.videoElement?.elt?.duration ?? 0;
    const width = this.videoElement?.elt.videoWidth ?? 0;
    const height = this.videoElement?.elt.videoHeight ?? 0;

    return {
      guid: this.fileGUID,
      name,
      duration,
      dimensions: {
        width,
        height
      }
    };
  }

  public update = (): void => {
    if (this._frameAnalysisEnabled) {
      (void (async () => {
        const videoElement = this.videoElement;
        if (videoElement == null) return;

        // Check if the current time is greater than the last analyzed time plus the frame duration
        await this.analyzeFrame();
      })());
    }
  };

  // Method to start the screen shake
  public startScreenShake (intensity: number = 50, duration: number = 500): void {
    this._shakeIntensity = intensity;
    this._shakeDuration = duration;
    this._shakeStartTime = this.p5Instance.sketch?.millis() ?? 0;
  }

  // Updated draw method
  public draw = (x: number = 0, y: number = 0, width?: number, height?: number): void => {
    if (this.videoElement != null && this.p5Instance?.sketch != null) {
      const sketch = this.p5Instance.sketch;

      let drawX = x;
      let drawY = y;
      let drawWidth = width ?? this.width;
      let drawHeight = height ?? this.height;

      /*
      // Apply zoom if active
      if (this.isShaking()) {
        const zoomCenterX = drawX + drawWidth / 2;
        const zoomCenterY = drawY + drawHeight / 2;
        const ZOOM_FACTOR = 1.2;
        drawWidth *= ZOOM_FACTOR;
        drawHeight *= ZOOM_FACTOR;

        drawX = zoomCenterX - drawWidth / 2;
        drawY = zoomCenterY - drawHeight / 2;
      }
      */

      // Apply screen shake if active
      if (this.isShaking()) {
        drawX += sketch.random(-this._shakeIntensity, this._shakeIntensity);
        drawY += sketch.random(-this._shakeIntensity, this._shakeIntensity);
      }

      sketch.image(this.videoElement as p5.Element, drawX, drawY, drawWidth, drawHeight);
    }
  };

  // Helper method to check if the screen should shake
  private isShaking (): boolean {
    const currentTime = this.p5Instance.sketch?.millis() ?? 0;
    return (currentTime - this._shakeStartTime) < this._shakeDuration;
  }

  public play = (): void => {
    this.logger.log('Playing...');
    this._isPlayingOneFrameAtATime = false;
    this.videoElement?.play();
    this.sound?.play();
  };

  public loop = (): void => {
    this._isPlayingOneFrameAtATime = false;
    this.videoElement?.loop();
    this.sound?.loop();

    // Increment and notify on each loop
    if (this.videoElement?.elt != null) {
      const videoHtmlEl = this.videoElement.elt as HTMLVideoElement;

      /* For some reason this does not work:
      videoHtmlEl.addEventListener(ENDED_EVENT, () => {
        this._loopCount++;
        console.log('ended event::');
        this.notifySubscribers();
      });
      */

      videoHtmlEl.addEventListener('timeupdate', () => {
        const currentTime = videoHtmlEl.currentTime;
        // Check if the video has looped
        if (currentTime < this.lastTime) {
          this._loopCount++;
          this.notifySubscribers();
        }

        // Update the last time
        this.lastTime = currentTime;
      });
    }
  };

  public pause = (): void => {
    this.videoElement?.pause();
    this.sound?.pause();
  };

  public stop = async (): Promise<void> => {
    this.lastTime = 0;
    this.videoElement?.stop();
    this.videoElement?.time(0);
    this.sound?.stop();
    if (this.videoFile != null) {
      await this.load(this.videoFile);
    }
  };

  public readonly updateVideoToFillScreen = (): [number, number] => {
    assert(this.videoElement?.elt != null, 'Video element is null in VideoPlayer.updateVideoAndCanvasToFillScreen');

    const videoWidth = this.videoElement?.elt?.videoWidth ?? 0;
    const videoHeight = this.videoElement?.elt?.videoHeight ?? 0;
    const aspectRatio = videoWidth / videoHeight;

    // Calculate the maximum size within the window while maintaining the aspect ratio.
    let newWidth, newHeight;
    if (window.innerWidth / window.innerHeight > aspectRatio) {
      // Window is wider than video aspect ratio
      newHeight = window.innerHeight;
      newWidth = newHeight * aspectRatio;
    } else {
      // Window is taller than video aspect ratio
      newWidth = window.innerWidth;
      newHeight = newWidth / aspectRatio;
    }

    this.videoElement?.size(newWidth, newHeight);
    return [newWidth, newHeight];
  };
}

export default VideoPlayer;
