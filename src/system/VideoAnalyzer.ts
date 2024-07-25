import '@tensorflow/tfjs-backend-webgl';
import { injectable, inject } from 'tsyringe';
import Localizer from '../utils/Localizer';
import type * as p5 from 'p5';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import type IVideoAnalyzer from '../interfaces/IVideoAnalyzer';
import type GoBackCb from '../types/GoBackCb';
import IVideoPlayer, { IVideoPlayerName } from '../interfaces/IVideoPlayer';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import type IFace from '../interfaces/IFace';
import IDrawBehavior from '../interfaces/IDrawBehavior';
import { DrawSimpleFeatureDebugName } from '../behaviors/DrawSimpleFeatureDebug';
import type IObjectedDetected from '../interfaces/IObjectDetected';
import type IPose from '../interfaces/IPose';
import { DrawPoseDebugName } from '../behaviors/DrawPoseDebug';
import { Palette } from '../utils/Theme';
import IVideoMetadataStore, { IVideoMetadataStoreName } from '../interfaces/IVideoMetadataStore';
import { styleButton } from '../libs/ui';

export const MIN_ANALYSIS_PERCENTAGE = 99;
/**
  The purpose of this module is to analyze a video file and extract features from it.
  It does a frame-by-frame analysis and so real time playback is not garanteed.

  One caveat: we are assuming all videos are 29.9 FPS and advancing frames at this rate.
  This is done for the time being since we likely need to extrac FPS via node.js + FFMPEG.

  Example of features it can extract:
    - faces
    - body poses
    - objects
*/

@injectable()
class VideoAnalyzer implements IVideoAnalyzer {
  private isActive = false;
  private isLoading = true;
  private goBackBtn: p5.Element | undefined;
  private saveBtn: p5.Element | undefined;
  private saveStatusText: p5.Element | undefined;
  private goBackCb: GoBackCb = () => { };

  constructor (
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance,
    @inject(IVideoPlayerName) private readonly videoPlayer: IVideoPlayer,
    @inject(IVideoMetadataStoreName) private readonly dataStore: IVideoMetadataStore,
    @inject(DrawSimpleFeatureDebugName) private readonly simpleFeatureDrawer: IDrawBehavior<IFace[] | IObjectedDetected[]>,
    @inject(DrawPoseDebugName) private readonly drawPosesDebug: IDrawBehavior<IPose[]>
  ) {
  }

  load = async (goBackCb: GoBackCb = () => { }): Promise<void> => {
    const leftMargin = 10;
    let currY = 10;
    const stepSizeY = 50;
    this.isLoading = true;
    this.goBackCb = goBackCb;
    this.isActive = true;

    this.goBackBtn = this.p5Instance.sketch?.createButton(Localizer.t('goBack'));
    this.goBackBtn?.position(leftMargin, currY += stepSizeY);
    this.goBackBtn?.mouseClicked(this.unload);
    styleButton(this.goBackBtn);

    this.saveBtn = this.p5Instance.sketch?.createButton(Localizer.t('save'));
    this.saveBtn?.position(leftMargin, currY += stepSizeY);
    this.saveBtn?.mouseClicked(this.saveDataSoFar);
    this.saveBtn?.hide();
    styleButton(this.saveBtn);

    this.saveStatusText = this.p5Instance.sketch?.createDiv('');
    this.saveStatusText?.html(Localizer.t('loading'));
    this.saveStatusText?.style('color', Palette.blue);
    this.saveStatusText?.style('background-color', Palette.white);
    this.saveStatusText?.position(leftMargin, currY += stepSizeY);
    this.saveStatusText?.hide();
    await this.videoPlayer.stop();
    this.videoPlayer.enableAnalyze();

    const analysisData = await this.dataStore.getData(this.videoPlayer.fileGUID);
    const percetnageAlreadyAnalyzed = analysisData?.percentageAnalyzed ?? 0;
    if (percetnageAlreadyAnalyzed >= MIN_ANALYSIS_PERCENTAGE) {
      this.unload();
      return;
    }
    this.videoPlayer.jumpToPercentage(percetnageAlreadyAnalyzed);

    this.isLoading = false;
    this.dataStore.autoSaveToDiskEvery(10);
    this.videoPlayer.playOneFrameAtATime();
  };

  unload = (): void => {
    this.saveDataSoFar();
    this.isActive = false;
    this.goBackBtn?.remove();
    this.saveBtn?.remove();
    this.saveStatusText?.remove();
    this.videoPlayer.stopPlayingOneFrameAtAtime();
    this.videoPlayer.disableAnalyze();
    this.goBackCb();
  };

  private readonly saveDataSoFar = (): void => {
    this.saveStatusText?.html(Localizer.t('saving'));
    this.saveStatusText?.show();

    const percentage = this.videoPlayer.saveFeaturesDetectedSoFar();
    this.saveStatusText?.html(Localizer.t('savedPercentage', { percentage }));
  };

  update = (): void => {
  };

  draw =  (): void => {
    if (!this.isActive) return;
    if (this.p5Instance?.sketch == null) return;
    this.videoPlayer.draw();
    const percentage = this.videoPlayer.percentageOfVideoPlayed();
    const textColor = this.p5Instance.sketch.color(Palette.blue);

    this.p5Instance.sketch.stroke(textColor);
    this.p5Instance.sketch.fill(textColor);
    this.p5Instance.sketch.textSize(30);

    if (this.isLoading) {
      this.p5Instance?.sketch.text(Localizer.t('loading'), 100, 30);
    } else {
      this.saveBtn?.show();
      this.p5Instance?.sketch.text(Localizer.t('processingPercentage', { percentage }), 100, 30);
    }

    // Let's go with datastore for now:
    const latestFeaturesDetected = this.dataStore.getLatestFrameFeatures(this.videoPlayer?.fileGUID);

    if (latestFeaturesDetected != null) {
      this.simpleFeatureDrawer.draw(latestFeaturesDetected?.faces ?? []);
      this.simpleFeatureDrawer.draw(latestFeaturesDetected?.objectsDetected ?? []);
      this.drawPosesDebug.draw(latestFeaturesDetected?.bodyPoses ?? []);
    }
  };

}

export default VideoAnalyzer;
