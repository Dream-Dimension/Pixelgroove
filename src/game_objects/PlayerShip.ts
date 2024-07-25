import * as p5 from 'p5';
import { debounce, throttle } from 'lodash';
import { container, inject, injectable } from 'tsyringe';
import type IPlayerShip from '../interfaces/IPlayerShip';
import GameObject from './GameObject';
import UserInputDrivenMovement, { UserInputDrivenMovementName } from '../behaviors/UserInputDrivenMovement';
import { type IDrawBehaviorParams } from '../interfaces/IDrawBehavior';
import DrawShapesBase from '../behaviors/DrawShapesBase';
import IDrawShapesBehavior from '../interfaces/IDrawShapesBehavior';
import assert from '../libs/asssert';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import SimpleMovement from '../behaviors/SimpleMovement';
import { type CollisionBenefits, type IGameAgent } from '../interfaces/IGameAgent';
import { Palette } from '../utils/Theme';
import GameAgent from './GameAgent';
import { EnemyManagerName } from '../managers/EnemyManager';
import { IEnemyManager } from '../interfaces/IEnemyManager';
import EventPublisher, { type UnsubscribeCb, type EventCallback } from '../system/EventPublisher';
import InputManager, { GameInputType, InputManagerName } from '../system/InputManager';
import { PowerUpManagerName } from '../managers/PowerUpManager';
import { IPowerUpManager } from '../interfaces/IPowerUpManager';
import ISoundAnalyzer, { ISoundAnalyzerName } from '../interfaces/ISoundAnalyzer';
import Circle from './geometry/Circle';
import { map } from '../utils/Mathy';
import Triangle from './geometry/Triangle';
import IPlayerStats, { IPlayerStatsName } from '../interfaces/IPlayerStats';
import DrawBlinds, { DrawBlindsName } from '../behaviors/DrawBlinds';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import type DrawShip from '../behaviors/DrawShip';
import { DrawShipName } from '../behaviors/DrawShip';

import { type DeathEventData } from '../interfaces/IPlayerShip';

/*
export enum ShipBenefit {
  IncreasedSpeed,
  DecreasedSize,
  WaveformBulletBurst,
  ShootInMultpileDirections
} */

export enum PlayerShipEvents {
  Death = 'death',
  // Other events can be added here
}

type ShootingDirections = p5.Vector[];

const BULLET_FIRING_RATE = 250; /// ms, firing rate.
const BULLET_SPEED = 500; //  units per second

const SHIP_WIDTH = 45;
const SHIP_HEIGHT = 35;
const DEATH_DURATION = 600; // ms
const POWERING_COLOR = Palette.powerUpBaseColor;
const DAMAGE_COLOR = Palette.enemeyBaseColor;
const BODY_COLOR = Palette.black;
const STROKE_COLOR = Palette.white;
const DEFAULT_SCALE = 1.0;
/**
 * Represents the main entity the player controls, can: fire, move.
 */
@injectable()
class PlayerShip extends GameObject implements IPlayerShip {
  private readonly _drawShipBehavior: DrawShip | undefined; // TODO: investgate better aprpoach
  private _bullets: IGameAgent[] = [];
  private _paused = false;
  private _waveFormBulletSpurr: IGameAgent[] = [];
  private readonly eventPublisher = new EventPublisher<DeathEventData>();

  private fireUnsubscribeCb: UnsubscribeCb = () => {};
  // TODO: consider removing these and using the shapes own width/height:
  private readonly _width = SHIP_WIDTH;
  private readonly _height = SHIP_HEIGHT;
  private _currentScaleFactor = DEFAULT_SCALE;
  private justDied = false;
  private receivingPower = false;

  constructor (
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance,
    @inject(UserInputDrivenMovementName) protected readonly _movementBehavior: UserInputDrivenMovement,
    @inject(ISoundAnalyzerName) protected readonly soundAnalyzer: ISoundAnalyzer,
    @inject(EnemyManagerName) private readonly enemyManager: IEnemyManager,
    @inject(PowerUpManagerName) private readonly powerUpManager: IPowerUpManager,
    @inject(DrawShipName) protected readonly _drawBehavior: IDrawShapesBehavior<IDrawBehaviorParams>,
    @inject(IPlayerStatsName) private readonly playerStats: IPlayerStats,
    @inject(InputManagerName) private readonly inputManager: InputManager,
    @inject(DrawBlindsName) private readonly drawBlinds: DrawBlinds,
    @inject(ILoggerName) private readonly logger: ILogger
  ) {
    super();
    this._drawShipBehavior = _drawBehavior as DrawShip;
    this.drawBehavior = _drawBehavior;

    this.draw = this.draw.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  public onDeath (callback: EventCallback<DeathEventData>): () => void {
    return this.eventPublisher.subscribe(PlayerShipEvents.Death, callback);
  }

  public pause = (): void => {
    this._paused = true;
    this._drawShipBehavior?.pause();
  };

  public resume = (): void => {
    this._paused = false;
    this._drawShipBehavior?.resume();
  };

  public isPaused = (): boolean => {
    return this._paused;
  };

  public init = (): void => {
    this.destroy();
    this._paused = false;

    assert(this.movementBehavior != null, 'Movement behavior was null in player ship init');
    assert(this.drawBehavior != null, 'Draw behavior was null in player ship init');
    assert(this.p5Instance.sketch != null, 'Sketch was null in player ship init');

    const shape = container.resolve(Triangle);
    shape.width = this._width;
    shape.height = this._height;
    this._bullets = [];
    this._waveFormBulletSpurr = [];

    if (this.drawBehavior != null) {
      this.drawBehavior.shapes = [shape];
    }

    if (this._drawShipBehavior != null) {
      this._drawShipBehavior.strokeColor = Palette.white;
      this._drawShipBehavior.bodyColor = Palette.black;
    }

    if (this.movementBehavior != null) {
      this.movementBehavior.position.x = (this.p5Instance.width()) * 0.1;
      this.movementBehavior.position.y = (this.p5Instance.height()) * 0.5;
    }
    this.movementBehavior?.init();

    this.fireUnsubscribeCb = this.inputManager.addEventListener(
      GameInputType.Fire,
      throttle(this.fireBullet, BULLET_FIRING_RATE, { leading: true, trailing: true }));
    this._paused = false;
  };

  private readonly shipFront = (): p5.Vector => {
    const width = this._width * this._currentScaleFactor;
    const height = this._height * this._currentScaleFactor;
    return this.movementBehavior?.position?.copy().add(width, height / 2) ?? new p5.Vector(0, 0);
  };

  private readonly fireBullet = (): void => {
    const bullet = this.createMoveHorizontallyBullet();
    this._bullets.push(bullet);
  };

  private readonly createMoveHorizontallyBullet = (radius = 2, speedX: number = BULLET_SPEED, speedY: number = 0, strokeWidth: number = 2, offset: p5.Vector = new p5.Vector(0, 0)): IGameAgent => {
    const gameObject = container.resolve(GameAgent);
    const movementBehavior = container.resolve(SimpleMovement);
    movementBehavior.speed.x = speedX;
    movementBehavior.speed.y = speedY;
    const drawBehavior = container.resolve(DrawShapesBase);
    drawBehavior.strokeWidth = strokeWidth;
    drawBehavior.bodyColor = Palette.powerUpBaseColor;
    drawBehavior.strokeColor = Palette.white;
    const shape = container.resolve(Circle);
    shape.radius = radius;
    drawBehavior.shapes.push(shape);
    gameObject.movementBehavior = movementBehavior;
    gameObject.drawBehavior = drawBehavior;

    movementBehavior.position.x = this.shipFront().x + offset.x;
    movementBehavior.position.y = this.shipFront().y + offset.y;

    return gameObject;
  };

  public stoppedBeingDamaged = (): void => {
    assert(this._drawShipBehavior != null, 'Draw shapes behavior was null in player ship in stopped being damaged');
  };

  private readonly attemptToSubtractOneLife = debounce(() => {
    this.justDied = true;
    this.playerStats.lives -= 1;
    this.eventPublisher.publish(PlayerShipEvents.Death, { livesRemaining: this.playerStats.lives });

    setTimeout(() => {
      this.justDied = false;
    }, DEATH_DURATION * 0.9);
  }, DEATH_DURATION, { leading: true, trailing: false });

  public pointsEarned = (pointsAmount: number): void => {
    this.playerStats.points += pointsAmount;
  };

  public activateShootInWaveForm = (): void => {
    const width = this.p5Instance.width();
    const height = this.p5Instance.height();

    const waveHeight = height * 0.15;
    const waveform = this.soundAnalyzer.waveform;

    // Define the number of bullets that will gradually transition
    // from the shipsFront to the waveform pattern.
    const transitioningBulletsCount = 8;

    this._waveFormBulletSpurr = waveform.map((waveformValue, index) => {
      const bullet = this.createMoveHorizontallyBullet(3, 0, 0, 3);
      if (bullet.movementBehavior != null) {
        const localX = map(index, 0, waveform.length, 0, width - this.shipFront().x);
        let localY;

        if (index < transitioningBulletsCount) {
          // Gradually interpolate the Y position for the transitioning bullets
          const transitionFactor = index / transitioningBulletsCount;
          localY = map(waveformValue, -0.1, 0.1, -waveHeight / 2, waveHeight / 2) * transitionFactor;
        } else {
          // Set the Y position according to the waveform pattern for the rest of the bullets (not interpolated)
          localY = map(waveformValue, -0.1, 0.1, -waveHeight / 2, waveHeight / 2);
        }

        bullet.movementBehavior.position.x = localX + this.shipFront().x;
        bullet.movementBehavior.position.y = localY + this.shipFront().y;
      }
      return bullet;
    });
  };

  public activateBenefit = (benefitTypes: CollisionBenefits[] | CollisionBenefits, params?: ShootingDirections | undefined): void => {
    if (benefitTypes == null) {
      return;
    }
    if (!Array.isArray(benefitTypes)) {
      benefitTypes = [benefitTypes];
    }

    if (benefitTypes.includes('smaller-ship')) {
      // this._drawShipBehavior?.resetScale();
      // this._currentScaleFactor = 0.5;
    }

    if (benefitTypes.includes('points-on-contact')) {
      this.receivingPower = true;
      this.pointsEarned(1);
      if (this._drawShipBehavior != null) {
        this._drawShipBehavior.waveformEnabled = true;
      }
    }

    // NOTE: if this doesn't come at the end, it won't have the right ship scale since the scale factor is set above:
    if (benefitTypes.includes('ff-waveform-bullet-spur')) {
      this.activateShootInWaveForm();
    }

    if (benefitTypes.includes('extra-life')) {
      this.playerStats.lives += 1;
    }

    if (benefitTypes.includes('backwards-bullets')) {
      this.shootBackwards();
    }
    // whena ctiviting shoot in multiple directions
    // add to our "shootInMultiple directions" duration

    // in constructor / init:
    // have an interval that is constantly decreasing shootInMultipleDirectionsDuration
    // bottoms out at zero.
  };

  private readonly shootBackwards = (): void => {
    const STROKE_WIDTH = 2;
    const BULLET_RADIUS = 5;
    const bullet = this.createMoveHorizontallyBullet(
      BULLET_RADIUS,
      BULLET_SPEED * -1.5,
      0,
      STROKE_WIDTH,
      new p5.Vector(-SHIP_WIDTH, 0)
    );

    this._bullets.push(this.createMoveHorizontallyBullet(
      BULLET_RADIUS,
      BULLET_SPEED * -1.5,
      BULLET_SPEED,
      STROKE_WIDTH,
      new p5.Vector(-SHIP_WIDTH, 0)
    ));
    this._bullets.push(bullet);
  };

  private readonly shootInMultipleDirection = (shootingDirections: ShootingDirections, durationSecs: number): void => {
    // For v1 we activate the benefit for 1 second.
  };

  private readonly bulletIsOffScreen = (bullet: IGameAgent): boolean => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in bulletIsOffScreen');
    assert(bullet.movementBehavior != null, 'Movement behavior was null in bulletIsOffScreen');
    if (bullet.movementBehavior == null || this.p5Instance.sketch == null) {
      return true;
    }
    if (bullet.movementBehavior.position == null) {
      return true;
    }

    // TODO: incorporate width + height of enemy:
    return bullet.movementBehavior.position.x < 0 ||
      bullet.movementBehavior.position.x > this.p5Instance.width() ||
      bullet.movementBehavior.position.y > this.p5Instance.height() ||
      bullet.movementBehavior.position.y < 0;
  };

  private readonly removeBullets = (bulletsToRemove: IGameAgent[]): void => {
    for (const enemy of bulletsToRemove) {
      enemy.destroy();
    }

    this._bullets = this._bullets.filter(bullet => !bulletsToRemove.includes(bullet));
  };

  private readonly cleanupBullets = (): void => {
    const toRemove = this._bullets.filter(this.bulletIsOffScreen);
    this.removeBullets(toRemove);
  };

  private readonly consumeEarnedPowerUps = (): void => {
    // Reset benefits:
    this._waveFormBulletSpurr = []; // Cleanups waveform bullets from last power up if any.
    if (this._drawShipBehavior != null) {
      this._drawShipBehavior.waveformEnabled = false;
    }
    this._drawShipBehavior?.resetScale();

    const powerUpsCollided = this.powerUpManager.getPowerUpsThatCollide(this);
    // if scale ship, we need to apply that one first.
    // otherwise the bullet spur wiil be wrong :(
    // This only works because of order of operations but it's fragile.
    for (const powerUp of powerUpsCollided) {
      this.activateBenefit(powerUp.collisionBenefits);
      this.pointsEarned(powerUp.rewardsPoints);
    }
  };

  public update (): void {
    if (this.isPaused()) return;
    this._currentScaleFactor = DEFAULT_SCALE;
    super.update();
    this.cleanupBullets();
    const bulletsToRemove: IGameAgent[] = [];
    this.receivingPower = false;
    // TODO:  make this a function that returns collided bullets
    // and we can remove those for nonspurr version:
    this.allBullets().forEach((bullet) => {
      const result = this.enemyManager.damageEnemiesOnCollision(bullet);
      if (result.collisionOccurred) {
        this.pointsEarned(result.pointsEarned);
        bulletsToRemove.push(bullet);
      }
      bullet.update();
    });

    /// Don't add bullets in spur.
    this.removeBullets(bulletsToRemove);
    this.consumeEarnedPowerUps();

    const playerIsHit = this.enemyManager.checkForCollisionWith(this) ?? false;
    if (playerIsHit) {
      this.attemptToSubtractOneLife();
    }
    this.drawBlinds.update();
    this._drawShipBehavior?.setNewWidth(this._width * this._currentScaleFactor, 200); // problem line
    this._drawShipBehavior?.setNewHeight(this._height * this._currentScaleFactor, 200);

    if (this._drawShipBehavior != null) {
      if (this.justDied) {
        this._drawShipBehavior.isDead = true;
        this._drawShipBehavior.bodyColor = DAMAGE_COLOR;
        this._drawShipBehavior.strokeColor = DAMAGE_COLOR;
      } else {
        this._drawShipBehavior.isDead = false;
        if (this.receivingPower) {
          this._drawShipBehavior.bodyColor = BODY_COLOR;
          this._drawShipBehavior.strokeColor = POWERING_COLOR;
        } else {
          this._drawShipBehavior.bodyColor = BODY_COLOR;
          this._drawShipBehavior.strokeColor = STROKE_COLOR;
        }
      }
    }
  };

  private readonly allBullets = (): IGameAgent[] => {
    return [...this._bullets, ...this._waveFormBulletSpurr];
  };

  public destroy (): void {
    this.logger.log('destroy: playership manager destroying');

    super.destroy();
    this.allBullets().forEach((bullet) => {
      bullet.destroy();
    });
    this._bullets = [];
    this._waveFormBulletSpurr = [];
    this.fireUnsubscribeCb();
  }

  public draw (): void {
    this.drawBlinds.draw({ position: new p5.Vector(0, this.position.y) });
    super.draw();
    this.allBullets().forEach((bullet) => {
      bullet.draw();
    });
  }
};

export default PlayerShip;
