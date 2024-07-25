import { inject, injectable } from 'tsyringe';
import IFactory, { PowerUpType } from '../interfaces/IFactory';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import GameObject from '../game_objects/GameObject';
import { PowerUpFactoryName } from '../factories/PowerUpFactory';
import { type IGameAgent } from '../interfaces/IGameAgent';
import assert from '../libs/asssert';
import { type IPowerUpManager } from '../interfaces/IPowerUpManager';
import type IGameObject from '../interfaces/IGameObject';
import IPlayerStats, { IPlayerStatsName } from '../interfaces/IPlayerStats';
import type DrawPowerUp from '../behaviors/DrawPowerUp';
import { ParticleSystemName, IParticleSystem, ColorTheme } from './ParticleSystem';

/** Responsible for managing how many power ups are allowed on screen at once.
/*
/* Adds or removes power ups based on current game conditions.
*/
@injectable()
class PowerUpManager implements IPowerUpManager {
  private _powerUps: IGameAgent[] = [];
  private _nonConsumablePowerUps: IGameAgent[] = [];
  private _powerUpsToDestroyOnNextUpdate: IGameAgent[] = [];
  private _paused = false;
  private readonly _maxPowerUps = 3;
  private livesThreshold = 8; // give more lives-power ups, if player lives falls bellow this number
  private _powerUpSpawnInterval = 100;
  private readonly _intervalsToClear: NodeJS.Timeout[] = [];

  private _initialized = false;

  constructor (
    @inject(PowerUpFactoryName) private readonly powerUpFactory: IFactory<PowerUpType>,
    @inject(IPlayerStatsName) private readonly playerStats: IPlayerStats,
    @inject(ParticleSystemName) private readonly particleSystem: IParticleSystem,
    @inject(ILoggerName) private readonly logger: ILogger
  ) {
  }

  public pause = (): void => {
    this._paused = true;
  };

  public resume = (): void => {
    this._paused = false;
  };

  public isPaused = (): boolean => {
    return this._paused;
  };

  public increaseDifficulty = (): void => {
    this.livesThreshold = Math.floor(this.livesThreshold / 2);
    this._powerUpSpawnInterval *= 2;
  };

  public getPowerUpsThatCollide = (agent: IGameObject | IGameAgent): IGameAgent[] => {
    assert(agent != null, 'Agent was null in power ups manager collide');

    const powerupsThatCollide = this.allPowerUps().filter((powerUp) => {
      return GameObject.collide(agent, powerUp);
    });

    powerupsThatCollide.forEach((powerUp) => {
      if (this._powerUps.includes(powerUp)) {
        this.playerStats.powerUpsCount += 1;
        this._powerUpsToDestroyOnNextUpdate.push(powerUp);
        if (powerUp.movementBehavior != null && powerUp.drawBehavior?.shapes[0]?.offset != null) {
          this.particleSystem.setColorTheme(ColorTheme.White);
          this.particleSystem.addExplosion(
            powerUp.movementBehavior.position.x + powerUp.drawBehavior?.shapes[0]?.offset.x,
            powerUp.movementBehavior.position.y + powerUp.drawBehavior?.shapes[0]?.offset.y,
            300,
            200
          );
        }
      }
    });
    return powerupsThatCollide;
  };

  private readonly allPowerUps = (): IGameAgent[] => {
    return [...this._powerUps, ...this._nonConsumablePowerUps];
  };

  /**
   * We have a set of  power ups related to faces, and other features.
   * When you are over them, they give you power ups.
   * Those power ups include things like:
   *  -- moving faster
   *  -- ship is smaller
   *   -- ship shoots in multiple directions
   *  -- ship shoots in a wave form
   *
   *  Ultimately it is the player ship that is responsible for applying those powers to itself.
   *
   */
  public init = (): void => {
    this.destroy();
    this._initialized = true;
    this._paused = false;

    this._nonConsumablePowerUps.push(this.powerUpFactory.create(PowerUpType.FFTTop));
    this._nonConsumablePowerUps.push(this.powerUpFactory.create(PowerUpType.FFTBottom));
    this._nonConsumablePowerUps.push(this.powerUpFactory.create(PowerUpType.Poses));
    // IMPORTANT: the order of these matters for now due to shipFront code in PlayerShip.
    // to make it not matter we can make the way we consume power ups be priority dependent in PlayerShip.
    this._nonConsumablePowerUps.push(this.powerUpFactory.create(PowerUpType.ObjectsDetected));
    this._nonConsumablePowerUps.push(this.powerUpFactory.create(PowerUpType.Faces));

    const intervalId = setInterval(this.addPowerUpIfPossible, this._powerUpSpawnInterval);
    this._intervalsToClear.push(intervalId);
  };

  private readonly addPowerUpIfPossible = (): void => {
    if (this.isPaused()) return;

    if (this._powerUps.length >= this._maxPowerUps) {
      return;
    }

    const powerUp = this.powerUpFactory.create(PowerUpType.Simple);
    if (this.playerStats.lives <= this.livesThreshold) {
      // TODO: consider moving this into factory?
      // and have it create extra life power up for us with these featuers:
      powerUp.collisionBenefits = ['extra-life'];
      (powerUp.drawBehavior as DrawPowerUp)?.shouldDrawHeart(true);
    } else {
      (powerUp.drawBehavior as DrawPowerUp)?.shouldDrawStar(true);
    }

    this._powerUps.push(powerUp);
  };

  public checkForCollisionWith = (gameObjects: GameObject[] | GameObject): boolean => {
    assert(gameObjects != null, 'GameObjects were null in power up manager checkForCollision');
    if (gameObjects == null) return false;

    return GameObject.collisionBetweenTwoSets(gameObjects, this._powerUps);
  };

  private readonly removePowerUps = (powerUpsToRemove: IGameAgent[]): void => {
    if (powerUpsToRemove.length === 0) return;
    for (const powerUp of powerUpsToRemove) {
      powerUp.destroy();
    }

    this._powerUps = this._powerUps.filter(powerUp => !powerUpsToRemove.includes(powerUp));
  };

  public update = (): void => {
    if (!this._initialized) {
      this.logger.warning('update: Power up manager not initialized, initializing now');
      this.init();
    }
    if (this.isPaused()) return;

    this.removePowerUps(this._powerUpsToDestroyOnNextUpdate);
    for (const powerUp of this.allPowerUps()) {
      powerUp.update();
    }
  };

  public draw = (): void => {
    if (!this._initialized) {
      this.logger.warning('draw: Power up manager not initialized, initializing now');
      this.init();
    }
    for (const powerUp of this.allPowerUps()) {
      powerUp.draw();
    }
  };

  public destroy = (): void => {
    this.logger.log('destroy: Power up manager destroying');
    for (const powerUp of this.allPowerUps()) {
      powerUp.destroy();
    }
    this._powerUps = [];
    this._nonConsumablePowerUps = [];
    this._powerUpsToDestroyOnNextUpdate = [];
    this._intervalsToClear.forEach(clearInterval);
  };
};

export default PowerUpManager;
export const PowerUpManagerName = Symbol.for('PowerUpManager');
