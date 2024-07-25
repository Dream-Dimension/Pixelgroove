import { inject, injectable } from 'tsyringe';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import type IPlayerStats from '../interfaces/IPlayerStats';
import assert from '../libs/asssert';
import Localizer from '../utils/Localizer';
import { Palette } from '../utils/Theme';

const INTIAL_LIVES = 6;
@injectable()
class PlayerStats implements IPlayerStats {
  private _points = 0;
  private _lives = INTIAL_LIVES;
  private _powerUpsCount = 0;
  private _paused = false;
  private _level = 1;

  constructor (
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance) {}

  public pause = (): void => {
    this._paused = true;
  };

  public resume = (): void => {
    this._paused = false;
  };

  public isPaused = (): boolean => {
    return this._paused;
  };

  get powerUpsCount (): number {
    return this._powerUpsCount;
  }

  set powerUpsCount (newCount: number) {
    this._powerUpsCount = newCount;
  }

  get level (): number {
    return this._level;
  }

  set level (lvl: number) {
    this._level = lvl;
  }

  get points (): number {
    return this._points;
  }

  set points (newPoints: number) {
    this._points = newPoints;
  }

  get lives (): number {
    return this._lives;
  }

  set lives (newLives: number) {
    this._lives = newLives;
  }

  public reset = (): void => {
    this._level = 1;
    this._lives = INTIAL_LIVES;
    this.points = 0;
    this.powerUpsCount = 0;
  };

  public init = (): void => {
    this.destroy();
    this._paused = false;
    this.reset();
  };

  public update = (): void => {
    // Add your implementation here
  };

  public draw = (): void => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in player stats draw');
    if (this.p5Instance.sketch == null) return;
    const TEXT_SIZE = 32;
    const TEXT_SPACING = TEXT_SIZE * 1.2;
    const LEFT_MARGIN = 10;
    let currentTextSpacing = 10;
    // TODO: update this and use Localization:
    this.p5Instance.sketch.stroke(Palette.black);
    this.p5Instance.sketch.color(Palette.white);
    this.p5Instance.sketch.fill(Palette.white);

    this.p5Instance.sketch?.strokeWeight(1);
    this.p5Instance.sketch?.textSize(TEXT_SIZE);
    this.p5Instance.sketch?.text(Localizer.t('score', { score: this.points }), LEFT_MARGIN, currentTextSpacing += TEXT_SPACING);
    const livesStr = '❤️ x ' + this._lives;
    this.p5Instance.sketch?.text(`${livesStr}`, LEFT_MARGIN, currentTextSpacing += TEXT_SPACING);
    this.p5Instance.sketch?.text(`🌟 x ${this.powerUpsCount}`, LEFT_MARGIN, currentTextSpacing += TEXT_SPACING);
    const fps = this.p5Instance.sketch?.frameRate().toFixed(2);
    this.p5Instance.sketch?.text(Localizer.t('level', { level: this._level }), LEFT_MARGIN, currentTextSpacing += TEXT_SPACING);

    // this.p5Instance.sketch?.text(Localizer.t('fps', { fps }), LEFT_MARGIN, currentTextSpacing += TEXT_SPACING);
    this.isPaused() && this.p5Instance.sketch?.text(Localizer.t('paused'), LEFT_MARGIN, currentTextSpacing += TEXT_SPACING);
  };

  public destroy = (): void => {
    this.logger.log('Destroying player stats');
  };
};
export default PlayerStats;
