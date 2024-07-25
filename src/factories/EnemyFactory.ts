import { injectable, inject, container } from 'tsyringe';
import { EnemyType } from '../interfaces/IFactory';
import type IFactory from '../interfaces/IFactory';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import assert from '../libs/asssert';
import DrawFFTOnEdges from '../behaviors/DrawFFTOnEdges';
import SimpleMovement from '../behaviors/SimpleMovement';
import DrawShapesBase from '../behaviors/DrawShapesBase';
import { type IGameAgent } from '../interfaces/IGameAgent';
import GameAgent from '../game_objects/GameAgent';
import { Palette } from '../utils/Theme';
import Circle from '../game_objects/geometry/Circle';
import SineWaveMovement from '../behaviors/SineWaveMovement';
import MoveUpDownMovement from '../behaviors/MoveUpDownMovement';

@injectable()
class EnemyFactory implements IFactory<EnemyType> {
  constructor (
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance
  ) {
  }

  public create = (type: EnemyType): IGameAgent => {
    assert(type in EnemyType, 'Invalid enemy type');
    // if (type == null || !(type in EnemyType)) return new Enemy();
    if (type === EnemyType.FFTBottom) {
      return this.createFFTBottom();
    }
    if (type === EnemyType.FFTTop) {
      return this.createFFTTop();
    }
    if (type === EnemyType.MoveHorizontally) {
      return this.createMoveHorizontally();
    }
    if (type === EnemyType.BulletMoveHorizontally) {
      return this.createBulleteMoveHorizontally();
    }
    if (type === EnemyType.MoveAsSineWave) {
      return this.createMovingAsSinewave();
    }
    if (type === EnemyType.MoveUpAnDown) {
      return this.createUpDownMover();
    }
    return new GameAgent();
  };

  private readonly createBulleteMoveHorizontally = (): IGameAgent => {
    const powerUp = this.createMoveHorizontally();
    const drawBehavior = container.resolve(DrawShapesBase);
    powerUp.drawBehavior = drawBehavior;
    drawBehavior.bodyColor = Palette.yellow;
    drawBehavior.strokeColor = Palette.enemeyBaseColor;
    drawBehavior.strokeWidth = 3;
    const shape = container.resolve(Circle);
    shape.radius = 5;
    drawBehavior.shapes.push(shape);
    return powerUp;
  };

  private readonly createUpDownMover = (): IGameAgent => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in updownmover');

    const gameObject = container.resolve(GameAgent);
    const movementBehavior = container.resolve(MoveUpDownMovement);
    const drawBehavior = container.resolve(DrawShapesBase);
    drawBehavior.bodyColor = Palette.enemeyBaseColor;
    drawBehavior.strokeColor = Palette.white;
    drawBehavior.strokeWidth = 4;

    const shape = container.resolve(Circle);
    shape.radius = 15;
    drawBehavior.shapes.push(shape);
    gameObject.movementBehavior = movementBehavior;
    gameObject.drawBehavior = drawBehavior;

    gameObject.offensiveDamage = 1;
    gameObject.health = 1;
    gameObject.rewardsPoints = 10;

    return gameObject;
  };

  private readonly createMovingAsSinewave = (): IGameAgent => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in createMovingAsSinewave');

    const gameObject = container.resolve(GameAgent);
    const movementBehavior = container.resolve(SineWaveMovement);
    const drawBehavior = container.resolve(DrawShapesBase);
    drawBehavior.bodyColor = Palette.enemeyBaseColor;
    drawBehavior.strokeColor = Palette.white;
    drawBehavior.strokeWidth = 4;

    const shape = container.resolve(Circle);
    shape.radius = 15;
    drawBehavior.shapes.push(shape);
    gameObject.movementBehavior = movementBehavior;
    gameObject.drawBehavior = drawBehavior;

    gameObject.offensiveDamage = 1;
    gameObject.health = 1; // slower, more points TODO: visualize somehow.
    gameObject.rewardsPoints = 10; // TODO: should be fxn of speed

    return gameObject;
  };

  private readonly createMoveHorizontally = (): IGameAgent => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in moveHorizontally');

    const gameObject = container.resolve(GameAgent);
    const movementBehavior = container.resolve(SimpleMovement);
    const drawBehavior = container.resolve(DrawShapesBase);
    drawBehavior.bodyColor = Palette.enemeyBaseColor;
    drawBehavior.strokeColor = Palette.white;
    drawBehavior.strokeWidth = 4;

    const shape = container.resolve(Circle);
    shape.radius = 15;
    drawBehavior.shapes.push(shape);
    gameObject.movementBehavior = movementBehavior;
    gameObject.drawBehavior = drawBehavior;

    gameObject.offensiveDamage = 1;
    gameObject.health = 1; // slower, more points TODO: visualize somehow.
    gameObject.rewardsPoints = 10; // TODO: should be fxn of speed

    return gameObject;
  };

  private readonly createFFTTop = (): IGameAgent => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in createFFTPowerUp');

    const gameObject = container.resolve(GameAgent);
    const movementBehavior = container.resolve(SimpleMovement);
    const drawBehavior = container.resolve(DrawFFTOnEdges);
    gameObject.movementBehavior = movementBehavior;
    drawBehavior.edge = 'top';
    drawBehavior.bodyColor = Palette.enemeyBaseColor;
    drawBehavior.strokeColor = Palette.enemeyBaseColor;

    drawBehavior.coreBodyVisible = true;
    drawBehavior.cherryVisible = true;
    drawBehavior.coreBodyVisible = false;
    gameObject.drawBehavior = drawBehavior;
    movementBehavior.position.x = 0;
    movementBehavior.position.y = 0;
    movementBehavior.speed.x = 0;
    movementBehavior.speed.y = 0;
    return gameObject;
  };

  private readonly createFFTBottom = (): IGameAgent => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in createFFTPowerUp');

    const gameObject = container.resolve(GameAgent);
    const movementBehavior = container.resolve(SimpleMovement);
    const drawBehavior = container.resolve(DrawFFTOnEdges);
    gameObject.movementBehavior = movementBehavior;
    drawBehavior.edge = 'bottom';
    drawBehavior.bodyColor = Palette.enemeyBaseColor;
    drawBehavior.strokeColor = Palette.enemeyBaseColor;

    drawBehavior.coreBodyVisible = true;
    drawBehavior.cherryVisible = true;
    drawBehavior.coreBodyVisible = false;
    gameObject.drawBehavior = drawBehavior;
    movementBehavior.position.x = 0;
    movementBehavior.position.y = this.p5Instance.height();
    movementBehavior.speed.x = 0;
    movementBehavior.speed.y = 0;
    return gameObject;
  };
}

export default EnemyFactory;
export const EnemyFactoryName = 'EnemyFactory';
