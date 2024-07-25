import type * as p5 from 'p5';
import { debounce } from 'lodash';
import { inject, injectable } from 'tsyringe';
import Localizer from '../utils/Localizer';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import type IGameManager from '../interfaces/IGameManager';
import IVideoPlayer, { IVideoPlayerName } from '../interfaces/IVideoPlayer';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import type GoBackCb from '../types/GoBackCb';
import IVideoMetadataStore, { IVideoMetadataStoreName } from '../interfaces/IVideoMetadataStore';
import { PowerUpManagerName } from './PowerUpManager';
import { EnemyManagerName } from './EnemyManager';
import IPlayerShip, { PlayerShipName } from '../interfaces/IPlayerShip';
import IPlayerStats, { IPlayerStatsName } from '../interfaces/IPlayerStats';
import { type IEnemyManager } from '../interfaces/IEnemyManager';
import { Palette } from '../utils/Theme';
import { type UnsubscribeCb } from '../system/EventPublisher';
import InputManager, { GameInputType, InputManagerName } from '../system/InputManager';
import assert from '../libs/asssert';
import { MIN_ANALYSIS_PERCENTAGE } from '../system/VideoAnalyzer';
import { IParticleSystem, ParticleSystemName } from './ParticleSystem';
import { IPowerUpManager } from '../interfaces/IPowerUpManager';
import DrawPose, { DrawPoseName } from '../behaviors/DrawPose';
import { styleButton } from '../libs/ui';

/**
  This module is responsible for handling the game play loop.
  It overlays gameplay over a music video that it also uses as it's base for generating interactions.

  It leverages features extracted from the video to generate interactions.
  Ideally those features have been precompiled already to avoid lag and slow downs in gameplay.

  TODO: It support real time feature extraction but it is not recommended for low-end systems.
  Sound analysis can be done in real time with minimal slow-downs (even in low-end systems).
*/
@injectable()
class GameManager implements IGameManager {
  private isActive = false;
  private isLoading = false;
  private _isPaused = false;
  private exitBtn: p5.Element | undefined;
  private goBackCb: GoBackCb = () => {};
  private readonly x = 100;
  private readonly y = 100;
  private _isGameOver = false;
  private restarting = false;
  private unsubscribeCbs: UnsubscribeCb[] = [];
  private percetnageAlreadyAnalyzed = 0;

  constructor (
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance,
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(IVideoPlayerName) private readonly videoPlayer: IVideoPlayer,
    @inject(IVideoMetadataStoreName) private readonly dataStore: IVideoMetadataStore,
    @inject(PowerUpManagerName) private readonly powerUpManager: IPowerUpManager,
    @inject(EnemyManagerName) private readonly enemyManager: IEnemyManager,
    @inject(InputManagerName) private readonly inputManager: InputManager,
    @inject(PlayerShipName) private readonly playerShip: IPlayerShip,
    @inject(ParticleSystemName) private readonly particleSystem: IParticleSystem,
    @inject(IPlayerStatsName) private readonly playerStats: IPlayerStats,
    @inject(DrawPoseName) private readonly poseDrawer: DrawPose
  ) {
  }

  public restart = debounce((): void => {
    if (this.restarting) return;
    this.restarting = true;
    this.unsubscribeCbs.forEach(cb => {
      cb();
    });
    this.restarting = false;
    this.unload();
  }, 1000, { leading: true, trailing: false });

  private readonly pause = debounce((): void => {
    if (this._isGameOver) return;
    this._isPaused = !this._isPaused;

    if (this._isPaused) {
      this.videoPlayer.pause();
      this.playerStats.pause();
      this.enemyManager.pause();
      this.powerUpManager.pause();
      this.playerShip.pause();
    } else {
      this.videoPlayer.play();
      this.playerStats.resume();
      this.enemyManager.resume();
      this.powerUpManager.resume();
      this.playerShip.resume();
    }
  }, 500, { leading: true, trailing: false });

  load = async (goBackCb: GoBackCb = () => { }): Promise<void> => {
    assert(goBackCb != null, 'GoBack cb in game manager null');
    this.isLoading = true;
    this.unsubscribeCbs.push(this.inputManager.addEventListener(GameInputType.Pause, this.pause));

    this._isGameOver = false;
    this._isPaused = false;
    const blankCb = (): void => {};
    this.goBackCb = goBackCb ?? blankCb;
    this.isActive = true;
    this.playerStats.reset();

    this.videoPlayer.disableAnalyze();
    const analysisData = await this.dataStore.getData(this.videoPlayer.fileGUID);
    this.percetnageAlreadyAnalyzed = analysisData?.percentageAnalyzed ?? 0;

    // TODO: remove.
    // coding through interface BAD!
    // instead do, does data exist for this video?
    // if not we set it an internal variable to process frames

    this.dataStore.getDataNear(this.videoPlayer?.fileGUID, 0); // warm up cahche

    this.exitBtn?.remove();
    this.exitBtn = this.p5Instance.sketch?.createButton(Localizer.t('quit'));
    this.exitBtn?.position(10, 10);
    this.exitBtn?.mouseClicked(this.unload);
    styleButton(this.exitBtn);

    this.powerUpManager.init();
    this.enemyManager.init();
    this.playerShip.init();
    this.playerStats.init();
    this.videoPlayer.loop();
    this.isLoading = false;
    const cb = this.videoPlayer.subscribeToLoopCount(loopCount => {
      this.playerStats.level = loopCount + 1;
      this.enemyManager.increaseDifficulty();
      this.powerUpManager.increaseDifficulty();
      this.videoPlayer.saveFeaturesDetectedSoFar();
      this.videoPlayer.disableAnalyze();
    });
    this.unsubscribeCbs.push(cb);

    this.unsubscribeCbs.push(this.playerShip.onDeath(this.onPlayerDeath));
    this.logger.log('GameManger loaded.');
  };

  private readonly onPlayerDeath = (): void => {
    this.videoPlayer.startScreenShake();
  };

  public unload = (): void => {
    this.logger.log('Unloading GameManager...');
    this.unsubscribeCbs.forEach(cb => {
      cb();
    });
    this.unsubscribeCbs = [];

    // TODO unsub from event types
    this.videoPlayer.pause();
    this.isActive = false;
    this.exitBtn?.remove();
    this.powerUpManager.destroy();
    this.enemyManager.destroy();
    this.playerStats.destroy();
    this.goBackCb();
  };

  private readonly updateIfGameOver = (): void => {
    if (this.playerStats.lives <= 0 && !this._isGameOver) {
      this.pause();
      this._isGameOver = true;
    }
  };

  public update = (): void => {
    if (!this.isActive) return;
    if (this._isGameOver) return;
    if (this._isPaused) return;

    if (this.videoPlayer.percentageOfVideoPlayed() >= this.percetnageAlreadyAnalyzed && this.percetnageAlreadyAnalyzed < MIN_ANALYSIS_PERCENTAGE) {
      // TODO; maybe don't need to keep enabling it
      this.videoPlayer.enableAnalyze();
    }

    this.videoPlayer.update();
    this.powerUpManager.update();
    this.enemyManager.update();
    this.playerShip.update();
    this.playerStats.update();
    this.particleSystem.update();
    this.poseDrawer.update();
    this.updateIfGameOver();
  };

  public drawGameOver = (): void => {
    this.unsubscribeCbs.push(this.inputManager.addEventListener(GameInputType.Start, this.restart));

    const TEXT_SIZE = 100;
    this.p5Instance.sketch?.textSize(TEXT_SIZE);
    this.p5Instance.sketch?.stroke(Palette.white);
    this.p5Instance.sketch?.fill(Palette.enemeyBaseColor);
    const textStr = this.restarting ? Localizer.t('restarting') : Localizer.t('pressStartToContinue');
    this.p5Instance.sketch?.text(Localizer.t('gameOver'), 10, this.p5Instance.height() / 2);
    this.p5Instance.sketch?.text(textStr, 10, this.p5Instance.height() / 2 + TEXT_SIZE * 1.1);
  };

  public drawLoading = (): void => {
    this.p5Instance.sketch?.text(Localizer.t('loading'), this.p5Instance.width() * 0.3, this.p5Instance.height() / 2);
  };

  public draw = (): void => {
    if (!this.isActive) return;

    if (!this.isActive || this.p5Instance?.sketch == null || this.videoPlayer == null) return;
    this.videoPlayer.draw();
    if (this.isLoading) this.drawLoading();

    // For Debugging:
    /*
    const currentTime = this.videoPlayer.videoElement?.time() ?? 0;
    const featuresNow = this.dataStore.getDataNear(this.videoPlayer.fileGUID, currentTime);
    this.simpleFeatureDrawer.draw(featuresNow?.faces ?? []);
    this.simpleFeatureDrawer.draw(featuresNow?.objectsDetected ?? []);
    */

    this.poseDrawer.draw();
    // const currentTime = this.videoPlayer.videoElement?.time() ?? 0;
    // const featuresNow = this.dataStore.getDataNear(this.videoPlayer.fileGUID, currentTime);
    // this.drawPosesDebug.draw(featuresNow?.bodyPoses ?? []);

    // Main game objects:
    this.particleSystem.draw();
    this.powerUpManager.draw();
    this.playerShip.draw();
    this.playerStats.draw();
    this.enemyManager.draw();
    if (this._isGameOver) this.drawGameOver();
  };
}

export default GameManager;
