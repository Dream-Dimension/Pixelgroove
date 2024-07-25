import 'reflect-metadata';
import { injectable, inject } from 'tsyringe';
import Localizer from '../utils/Localizer';
import type * as p5 from 'p5';
import IGameManager, { IGameManagerName } from '../interfaces/IGameManager';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import IVideoAnalyzer, { IVideoAnalyzerName } from '../interfaces/IVideoAnalyzer';
import type ICentralControl from '../interfaces/ICentralControl';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import type P5File from '../interfaces/P5File';
import { FileType } from '../interfaces/P5File';
import IVideoPlayer, { IVideoPlayerName } from '../interfaces/IVideoPlayer';
import InputManager, { InputManagerName } from '../system/InputManager';
import IControlsConfigurator, { IControlsConfiguratorName } from '../interfaces/IControlsConfigurator';
import { Palette } from '../utils/Theme';
import IVideoMetadataStore, { IVideoMetadataStoreName } from '../interfaces/IVideoMetadataStore';
import { MIN_ANALYSIS_PERCENTAGE } from '../system/VideoAnalyzer';
import { styleButton } from '../libs/ui';
import VideoAugmentationData from '../interfaces/VideoAugmentationData';
const LEFT_MARGIN = 10;

/**
  Responsinble for presenting the user with an introduction to the application.
  Providing the option to pre-analyze a video file or play a game
  using that media file as the basis for gameplay.
*/
@injectable()
class CentralControl implements ICentralControl {
  private isActive = false;
  private isLoading = false;
  private fileInput: p5.Element | undefined;
  private _file: P5File | undefined;
  private analyzeVideoBtn: p5.Element | undefined;
  private playGameBtn: p5.Element | undefined;
  private quitBtn: p5.Element | undefined;
  private fullScreenToggleBtn: p5.Element | undefined;
  private configureControlsBtn: p5.Element | undefined;
  private analysisData: VideoAugmentationData | undefined;
  constructor (
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance,
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(IVideoPlayerName) private readonly videoPlayer: IVideoPlayer,
    @inject(InputManagerName) private readonly inputManager: InputManager,
    @inject(IVideoMetadataStoreName) private readonly dataStore: IVideoMetadataStore,
    @inject(IControlsConfiguratorName) private readonly controlsConfigurator: IControlsConfigurator,
    @inject(IGameManagerName) private readonly gameManager: IGameManager,
    @inject(IVideoAnalyzerName) private readonly videoAnalyzer: IVideoAnalyzer
  ) {
  }

  readonly init = (): void => {
    this.p5Instance.init((sketch: p5) => {
      sketch.setup = () => {
        this.setup(this.p5Instance.sketch as p5);
        this.inputManager.loadMappingsFromLocalStorage();
      };

      sketch.draw = () => {
        this.draw(this.p5Instance.sketch as p5);
      };
    });
  };

  private readonly setup = (sketch: p5): void => {
    this.logger.log('Central: sketch setup.');
    const canvas = sketch.createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent('wrapper');
    this.addUI();
  };

  private readonly handleQuit = (): void => {
    if (window.electron != null) {
      window.electron.quitApp();
    }
  };

  private readonly toggleFullScreen = (): void => {
    if (window.electron != null) {
      window.electron.toggleFullScreen();
    }
  };

  private readonly addUI = (): void => {
    this.isActive = true;
    const VERT_SPACER = 50;
    let verticalY = 0;

    this.quitBtn = this.p5Instance.sketch?.createButton(Localizer.t('exit'));
    this.quitBtn?.mouseClicked(this.handleQuit);
    this.quitBtn?.position(LEFT_MARGIN, verticalY += VERT_SPACER);

    this.fullScreenToggleBtn = this.p5Instance.sketch?.createButton(Localizer.t('toggleFullScreen'));
    this.fullScreenToggleBtn?.mouseClicked(this.toggleFullScreen);
    this.fullScreenToggleBtn?.position(LEFT_MARGIN, verticalY += VERT_SPACER);

    this.configureControlsBtn = this.p5Instance.sketch?.createButton(Localizer.t('configureControls'));
    this.configureControlsBtn?.mouseClicked(this.configureControls);
    this.configureControlsBtn?.position(LEFT_MARGIN, verticalY += VERT_SPACER);

    this.fileInput = this.p5Instance.sketch?.createFileInput(this.handleFile);
    this.fileInput?.position(LEFT_MARGIN, verticalY += VERT_SPACER);

    this.analyzeVideoBtn = this.p5Instance.sketch?.createButton(Localizer.t('preAnalyzeRecommended'));
    this.analyzeVideoBtn?.mouseClicked(this.loadVideoAnalyzer);
    this.analyzeVideoBtn?.position(LEFT_MARGIN, verticalY += VERT_SPACER);

    this.analyzeVideoBtn?.hide();

    this.playGameBtn = this.p5Instance.sketch?.createButton(Localizer.t('play'));
    this.playGameBtn?.mouseClicked(this.playGame);
    this.playGameBtn?.position(LEFT_MARGIN, verticalY += VERT_SPACER * 2);
    this.playGameBtn?.hide();

    styleButton(this.quitBtn);
    styleButton(this.fullScreenToggleBtn);
    styleButton(this.configureControlsBtn);
    styleButton(this.fileInput);

    if (this._file != null) {
      this.handleFile(this._file);
    }
  };

  private readonly removeUI = (): void => {
    this.isActive = false;
    this.analyzeVideoBtn?.remove();
    this.quitBtn?.remove();
    this.playGameBtn?.remove();
    this.fileInput?.remove();
    this.configureControlsBtn?.remove();
    this.fullScreenToggleBtn?.remove();
  };

  private readonly loadVideoAnalyzer = (): void => {
    this.removeUI();
    this.videoAnalyzer.load(this.addUI);
  };

  private readonly configureControls = (): void => {
    this.removeUI();
    this.controlsConfigurator.load(this.addUI);
  };

  private readonly playGame = (): void => {
    this.removeUI();
    this.gameManager.load(this.addUI);
  };

  private readonly handleFile = async (file: P5File): Promise<void> => {
    if (file.type === FileType.VIDEO) {
      this._file = file;
      this.isLoading = true;
      setTimeout(async () => {
        // TODO: workaround, need to set "LOADING", true somewhere
        // was causing select component to block.
        // eslint-disable-next-line @typescript-eslint/no-misused-promises

        await this.videoPlayer.load(file);
        console.log('got here 1.1')
        this.videoPlayer.advanceToFrame(0);
        const [newWidth, newHeight] = this.videoPlayer.updateVideoToFillScreen();
        this.p5Instance.sketch?.resizeCanvas(newWidth, newHeight);
        this.analyzeVideoBtn?.show();
        this.playGameBtn?.show();
        try {
          const videoFullyAnalyzed = await this.videoFullyAnalyzed();
          console.log('Video Fully Analyzed', videoFullyAnalyzed);
          this.analysisData = await this.dataStore.getData(this.videoPlayer.fileGUID);
          if (videoFullyAnalyzed) {
            styleButton(this.analyzeVideoBtn);
            this.analyzeVideoBtn?.html(Localizer.t('preAnalyze'));
            styleButton(this.playGameBtn, 36, 20, 'white 3px solid');
          } else {
            this.analyzeVideoBtn?.html(Localizer.t('preAnalyzeRecommended'));
            styleButton(this.analyzeVideoBtn, 36, 20, 'white 3px solid');
            styleButton(this.playGameBtn);
          }
        } catch(e) {
          console.log('error', e);
          alert('Erro loading video');
        }
      }, 1);
      this.isLoading = false;
    } else {
      // TODO: prompt user to select a video file.
      this.logger.warning('Selected file is not a video.');
    }
  };

  public drawStatusOfVideoAnalysis = async (): Promise<void> => {
    const TEXT_SIZE = 30;
    const STROKE_WEIGHT = 5;
    this.p5Instance.sketch?.textSize(TEXT_SIZE);
    this.p5Instance.sketch?.stroke(Palette.black);
    this.p5Instance.sketch?.strokeWeight(STROKE_WEIGHT);

    this.p5Instance.sketch?.fill(Palette.white);
    const analysisData = this.analysisData;
    const percentage = analysisData?.percentageAnalyzed ?? 0;
    if (this._file == null) {
      this.p5Instance.sketch?.text(Localizer.t('selectVideoPlease'), LEFT_MARGIN, this.p5Instance.height() * 0.7);
      return;
    };

    if (this.isLoading) {
      this.p5Instance.sketch?.text(Localizer.t('loading'), LEFT_MARGIN, this.p5Instance.height() * 0.7);
    } else if (percentage >= MIN_ANALYSIS_PERCENTAGE) {
      this.p5Instance.sketch?.text(Localizer.t('videoIsFullyAnalyzed'), LEFT_MARGIN, this.p5Instance.height() * 0.7);
    } else if (percentage === 0) {
      this.p5Instance.sketch?.text(Localizer.t('recommendAnalyze'), LEFT_MARGIN, this.p5Instance.height() * 0.7);
    } else {
      this.p5Instance.sketch?.text(Localizer.t('notFullyAnalyzed', { percentage }), LEFT_MARGIN, this.p5Instance.height() * 0.7);
    }
  };

  private readonly videoFullyAnalyzed = async (): Promise<boolean> => {
    const analysisData = await this.dataStore.getData(this.videoPlayer.fileGUID);
    const percentage = analysisData?.percentageAnalyzed ?? 0;
    return percentage >= MIN_ANALYSIS_PERCENTAGE;
  };

  private readonly update = (): void => {
    this.gameManager.update();
    this.videoAnalyzer.update();
  };

  private readonly draw = async (sketch: p5): Promise<void> => {
    this.update();
    sketch.background(255);
    this.gameManager.draw();
    this.videoAnalyzer.draw();
    if (this.isActive) {
      this.videoPlayer.draw();
      await this.drawStatusOfVideoAnalysis();
    }
  };

  readonly destroy = (): void => {
    // Cleanup logic here...
  };
};

export default CentralControl;
