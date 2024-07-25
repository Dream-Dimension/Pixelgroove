import type * as p5 from 'p5';
import { inject, injectable } from 'tsyringe';
import IFactory, { EnemyType } from '../interfaces/IFactory';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import { EnemyFactoryName } from '../factories/EnemyFactory';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import assert from '../libs/asssert';
import { type IGameAgent } from '../interfaces/IGameAgent';
import GameObject from '../game_objects/GameObject';
import { type IEnemyManager } from '../interfaces/IEnemyManager';
import { throttle } from 'lodash';
import type IMovementBehavior from '../interfaces/IMovementBehavior';
import { ParticleSystemName, IParticleSystem, ColorTheme } from './ParticleSystem';

const BULLET_SPEED_MULTIPLIER = 1.5;

/** Responsible for managing enemies.
 *  Decies how often to spawn them, when to remove them (e.g when off screen)
 */
@injectable()
class EnemyManager implements IEnemyManager {
  private _enemies: IGameAgent[] = [];
  private _nonCollidableEnemies: IGameAgent[] = [];
  private _paused = false;
  private _bulletEnemies: IGameAgent[] = [];
  private _maxEnemies = 3;
  private _initialized = false;
  private readonly _enemySpawnInterval = 500;
  private readonly _intervalsToClear: NodeJS.Timeout[] = [];
  private readonly _timeOutsToclear: NodeJS.Timeout[] = [];

  private _enemyProbabilities: Array<{ type: EnemyType, weight: number }> = [
    { type: EnemyType.MoveUpAnDown, weight: 1 }, // weight =s likelihood of appearing
    { type: EnemyType.MoveHorizontally, weight: 5 },
    { type: EnemyType.MoveAsSineWave, weight: 5 }

    // Add more enemy types here with their respective weights
  ];

  constructor (
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance,
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(EnemyFactoryName) private readonly enemyFactory: IFactory<EnemyType>,
    @inject(ParticleSystemName) private readonly particleSystem: IParticleSystem
  ) {
  }

  public init = (): void => {
    this.destroy();
    this._initialized = true;
    this._paused = false;

    const fftTop = this.enemyFactory.create(EnemyType.FFTTop);
    const fftBottom = this.enemyFactory.create(EnemyType.FFTBottom);
    this._nonCollidableEnemies.push(fftTop);
    this._nonCollidableEnemies.push(fftBottom);

    const intervalId = setInterval(this.addEnemyIfPossible, this._enemySpawnInterval);
    this._intervalsToClear.push(intervalId);

    // Star escalating: TODO: can make recursive. and each time take longer to escalate.
    const timeoutId = setTimeout(() => {
      //  more enemies
      const intervalId2 = setInterval(this.addEnemyIfPossible, this._enemySpawnInterval * 0.6);
      this._intervalsToClear.push(intervalId2);
    }, 1000 * 20);
    this._timeOutsToclear.push(timeoutId);
  };

  public increaseDifficulty = (): void => {
    this._maxEnemies++;
    this._enemyProbabilities = [
      { type: EnemyType.MoveUpAnDown, weight: 2 }, // weight =s likelihood of appearing
      { type: EnemyType.MoveHorizontally, weight: 1 },
      { type: EnemyType.MoveAsSineWave, weight: 1 }
    ];
  };

  private readonly addEnemyIfPossible = (): void => {
    if (this.isPaused()) return;
    if (this._enemies.length >= this._maxEnemies) {
      return;
    }

    const enemyType = this.selectEnemyTypeBasedOnProbability();
    const enemy = this.enemyFactory.create(enemyType);
    this._enemies.push(enemy);
  };

  private readonly selectEnemyTypeBasedOnProbability = (): EnemyType => {
    // Add all probabilities together.
    const totalWeight = this._enemyProbabilities.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of this._enemyProbabilities) {
      if (random < item.weight) {
        return item.type;
      }
      random -= item.weight;
    }

    // Default to first type if none selected (should not happen in practice)
    return this._enemyProbabilities[0].type;
  };

  /**
   * Returns true if the enemy is off screen, false otherwise.
   *
   * Only considers enemy off screen if past the left side of the screen or
   * past the bottom of the screen or past the top of the screen.
   *
   * Does not consider enemies offscreen if past the right side of the screen (spawning area).
   *
   */
  private readonly enemeyIsOffScreen = (enemy: IGameAgent): boolean => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in enemy manager enemeyIsOffScreen');
    assert(enemy.movementBehavior != null, 'Movement behavior was null in enemy manager enemeyIsOffScreen');
    if (enemy.movementBehavior == null || this.p5Instance.sketch == null) {
      return true;
    }
    if (enemy.movementBehavior.position == null) {
      return true;
    }

    // TODO: incorporate width + height of enemy:
    return enemy.movementBehavior.position.x < 0 ||
     enemy.movementBehavior.position.y > this.p5Instance.height() ||
     enemy.movementBehavior.position.y < 0;
  };

  private readonly removeEnemies = (enemiesToRemove: IGameAgent[]): void => {
    for (const enemy of enemiesToRemove) {
      enemy.destroy();
    }

    this._enemies = this._enemies.filter(enemy => !enemiesToRemove.includes(enemy));
  };

  // Clean up enemies offscreen:
  private readonly cleanupEnemies = (): void => {
    const enemiesToRemove = [...this._enemies, ...this._bulletEnemies].filter(this.enemeyIsOffScreen);
    this.removeEnemies(enemiesToRemove);
  };

  private readonly _allEnemies = (): IGameAgent[] => {
    return [...this._enemies, ...this._nonCollidableEnemies, ...this._bulletEnemies];
  };

  /**
   * Check if bullet collids with enemies and if so damage / destroy them.
   */
  public damageEnemiesOnCollision = (agent: IGameAgent): { pointsEarned: number, collisionOccurred: boolean } => {
    assert(agent != null, 'Bullet was null in enemy manager damageElementsOnBulletCollision');
    let pointsEarned = 0;
    let collisionOccurred = false;
    if (agent == null) return { pointsEarned, collisionOccurred };

    const enemiesToRemove = [];
    for (const enemy of this._enemies) {
      if (GameObject.collide(enemy, agent)) {
        enemiesToRemove.push(enemy);
        if (enemy.movementBehavior?.position != null) {
          this.particleSystem.setColorTheme(ColorTheme.Yellow);
          this.particleSystem.addExplosion(
            enemy.movementBehavior.position.x,
            enemy.movementBehavior.position.y
          );
        }
        // better yet modify IGameAgent to have pointsValue and lifeLeft , and do enemy.lifLeft = lifeLeft - bullet.damageValue
        pointsEarned += enemy.rewardsPoints;
        collisionOccurred = true;
      }
    }
    this.removeEnemies(enemiesToRemove);
    return { pointsEarned, collisionOccurred };
  };

  public checkForCollisionWith = (gameObjects: GameObject[] | GameObject): boolean => {
    assert(gameObjects != null, 'Object(s) was/were null in enemy manager checkForPlayerCollision');
    if (gameObjects == null) return false;
    return GameObject.collisionBetweenTwoSets(gameObjects, this._allEnemies());
  };

  private readonly produceBullet = (enemy: IGameAgent): void => {
    assert(enemy.movementBehavior != null, 'Movement behavior was null in enemy manager produceBullet');
    if (enemy.movementBehavior == null) return;
    // Towards target move.
    const bullet = this.enemyFactory.create(EnemyType.BulletMoveHorizontally);
    if (bullet.movementBehavior == null) return;
    // Position bullet at enemy's (who shot it) position:
    bullet.movementBehavior.position.x = enemy.movementBehavior.position.x;
    bullet.movementBehavior.position.y = enemy.movementBehavior.position.y;

    function hasSpeed (movement: IMovementBehavior): movement is IMovementBehavior & { speed: p5.Vector } {
      return 'speed' in movement;
    }

    const DEFAULT_SPEED = -300;
    if (hasSpeed(enemy.movementBehavior) && hasSpeed(bullet.movementBehavior)) {
      bullet.movementBehavior.speed.x = enemy.movementBehavior.speed.x * BULLET_SPEED_MULTIPLIER;
      if (bullet.movementBehavior.speed.x <= 0) {
        bullet.movementBehavior.speed.x = DEFAULT_SPEED;
      }
    }

    this._bulletEnemies.push(bullet);
  };

  private readonly enemiesProduceBullets = throttle((enemies: IGameAgent[]): void => {
    for (const enemy of enemies) {
      if (enemy.movementBehavior != null) {
        // Only enemies on the right side of the screen can shoot:
        if (enemy.movementBehavior.position.x > this.p5Instance.width() * 0.6) {
          this.produceBullet(enemy);
        }
      }
    }
  }, 500); // Throttle the function

  public update = (): void => {
    if (!this._initialized) {
      this.logger.warning('update: Enemy manager not initialized, initializing now');
      this.init();
    }
    if (this.isPaused()) return;

    for (const enemy of this._allEnemies()) {
      enemy.update();
    }

    this.enemiesProduceBullets(this._enemies);

    this.cleanupEnemies();
  };

  public pause = (): void => {
    this._paused = true;
  };

  public resume = (): void => {
    this._paused = false;
  };

  public isPaused = (): boolean => {
    return this._paused;
  };

  public draw = (): void => {
    if (!this._initialized) {
      this.logger.warning('draw: Enemy manager not initialized, initializing now');
      this.init();
    }
    for (const enemy of this._allEnemies()) {
      enemy.draw();
    }
  };

  public destroy = (): void => {
    this.logger.log('destroy: enemy manager destroying');
    for (const enemy of this._allEnemies()) {
      enemy.destroy();
    }
    this._enemies = [];
    this._nonCollidableEnemies = [];
    this._bulletEnemies = [];

    this._intervalsToClear.forEach(clearInterval);
    this._timeOutsToclear.forEach(clearTimeout);
  };
};

export default EnemyManager;
export const EnemyManagerName = Symbol.for('EnemyManager');
