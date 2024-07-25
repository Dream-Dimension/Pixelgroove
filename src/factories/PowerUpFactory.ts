import { container, inject, injectable } from 'tsyringe';
import DrawPowerUp from '../behaviors/DrawPowerUp';
import type IFactory from '../interfaces/IFactory';
import { PowerUpType } from '../interfaces/IFactory';
import FollowMouseMovement from '../behaviors/FollowMouseMovement';
import assert from '../libs/asssert';
import DrawFFTOnEdges from '../behaviors/DrawFFTOnEdges';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import SimpleMovement from '../behaviors/SimpleMovement';
import { type IGameAgent } from '../interfaces/IGameAgent';
import GameAgent from '../game_objects/GameAgent';
import { Palette } from '../utils/Theme';
import DrawSimpleFeatures from '../behaviors/DrawSimpleFeatures';
import DrawPose from '../behaviors/DrawPose';
import Circle from '../game_objects/geometry/Circle';
import { random } from 'lodash';

/**
 * Factory for creating power ups.
 *
 * Each power up has a mixture of behaviors (via the strategy pattern).
 *
 * These can be mixed and matched and initialized with different parameters
 * to create a variety of power ups.
 *
 * A notable type of power up is the FFT Power Up which updates according
 * to the beat of the music.
 *
 */
@injectable()
class PowerUpFactory implements IFactory<PowerUpType> {
  constructor (
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance
  ) {
  }

  public create = (type: PowerUpType = PowerUpType.Simple): IGameAgent => {
    if (type === PowerUpType.FollowMouse) {
      return this.createMouseFollower();
    } else if (type === PowerUpType.FFTTop) {
      return this.createFFTPowerUpTop();
    } else if (type === PowerUpType.FFTBottom) {
      return this.createFFTPowerUpBottom();
    } else if (type === PowerUpType.Faces) {
      return this.createFacesPowerUp();
    } else if (type === PowerUpType.ObjectsDetected) {
      return this.createObjectsDetectedPowerUp();
    } else if (type === PowerUpType.Poses) {
      return this.createPosesPowerUp();
    } else if (type === PowerUpType.Simple) {
      return this.createSimplePowerUp();
    }
    assert(type != null, 'Type was null in createPowerUp');
    return this.createSimplePowerUp();
  };

  private readonly createObjectsDetectedPowerUp = (): IGameAgent => {
    const powerUp = this.createFacesPowerUp();
    powerUp.collisionBenefits = ['smaller-ship', 'points-on-contact'];
    (powerUp.drawBehavior as DrawSimpleFeatures).enableDrawDetectedObjectsMode(true);
    powerUp.rewardsPoints = 5;
    return powerUp;
  };

  private readonly createPosesPowerUp = (): IGameAgent => {
    const powerUp = container.resolve(GameAgent);
    const movementBehavior = container.resolve(SimpleMovement);
    const drawBehavior = container.resolve(DrawPose);
    powerUp.collisionBenefits = ['backwards-bullets'];

    powerUp.movementBehavior = movementBehavior;
    drawBehavior.bodyColor = Palette.powerUpBaseColor;
    drawBehavior.strokeColor = Palette.powerUpBaseColor;

    powerUp.drawBehavior = drawBehavior;
    movementBehavior.position.x = 0;
    movementBehavior.position.y = 0;
    movementBehavior.speed.x = 0;
    movementBehavior.speed.y = 0;
    return powerUp;
  };

  private readonly createFacesPowerUp = (): IGameAgent => {
    const powerUp = container.resolve(GameAgent);
    const movementBehavior = container.resolve(SimpleMovement);
    const drawBehavior = container.resolve(DrawSimpleFeatures);
    powerUp.collisionBenefits = ['ff-waveform-bullet-spur'];

    powerUp.movementBehavior = movementBehavior;
    drawBehavior.bodyColor = Palette.powerUpBaseColor;
    drawBehavior.strokeColor = Palette.powerUpBaseColor;

    powerUp.drawBehavior = drawBehavior;
    movementBehavior.position.x = 0;
    movementBehavior.position.y = 0;
    movementBehavior.speed.x = 0;
    movementBehavior.speed.y = 0;
    return powerUp;
  };

  private readonly createFFTPowerUpTop = (): IGameAgent => {
    const powerUp = container.resolve(GameAgent);
    const movementBehavior = container.resolve(SimpleMovement);
    const drawBehavior = container.resolve(DrawFFTOnEdges);
    powerUp.movementBehavior = movementBehavior;
    drawBehavior.bodyColor = Palette.powerUpBaseColor;
    drawBehavior.strokeColor = Palette.powerUpBaseColor;

    drawBehavior.edge = 'top';
    drawBehavior.cherryVisible = false;
    drawBehavior.coreBodyVisible = true;
    powerUp.drawBehavior = drawBehavior;
    movementBehavior.position.x = 0;
    movementBehavior.position.y = 0;
    movementBehavior.speed.x = 0;
    movementBehavior.speed.y = 0;
    powerUp.rewardsPoints = 300;
    return powerUp;
  };

  private readonly createFFTPowerUpBottom = (): IGameAgent => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in createFFTPowerUp');

    const powerUp = container.resolve(GameAgent);
    const movementBehavior = container.resolve(SimpleMovement);
    const drawBehavior = container.resolve(DrawFFTOnEdges);
    drawBehavior.bodyColor = Palette.powerUpBaseColor;
    drawBehavior.strokeColor = Palette.powerUpBaseColor;

    powerUp.movementBehavior = movementBehavior;
    drawBehavior.edge = 'bottom';
    drawBehavior.cherryVisible = false;
    drawBehavior.coreBodyVisible = true;
    powerUp.drawBehavior = drawBehavior;
    movementBehavior.position.x = 0;
    movementBehavior.position.y = this.p5Instance.sketch?.height ?? 0;
    movementBehavior.speed.x = 0;
    movementBehavior.speed.y = 0;
    powerUp.rewardsPoints = 300;
    return powerUp;
  };

  private readonly createMouseFollower = (): IGameAgent => {
    const powerUp = container.resolve(GameAgent);
    const drawBehavior = container.resolve(DrawPowerUp);
    drawBehavior.bodyColor = Palette.powerUpBaseColor;
    drawBehavior.strokeColor = Palette.powerUpBaseColor;

    const movementBehavior = container.resolve(FollowMouseMovement);
    // TODO; create a simpler version of this
    const shape = container.resolve(Circle);
    shape.radius = 100;
    drawBehavior.shapes.push(shape);

    powerUp.movementBehavior = movementBehavior;
    powerUp.drawBehavior = drawBehavior;
    return powerUp;
  };

  private readonly createSimplePowerUp = (): IGameAgent => {
    const powerUp = container.resolve(GameAgent);
    const drawBehavior = container.resolve(DrawPowerUp);
    drawBehavior.bodyColor = Palette.powerUpBaseColor;
    drawBehavior.strokeColor = Palette.powerUpBaseColor;

    const movementBehavior = container.resolve(SimpleMovement);
    const shape = container.resolve(Circle);
    const targetWidth = 50;
    shape.width = 0;
    shape.offset.x = 100;
    shape.offset.y = 100;

    movementBehavior.position.x = random(this.p5Instance.width() * 0.7, this.p5Instance.width() * 0.9);
    movementBehavior.position.y = random(targetWidth, this.p5Instance.height() - targetWidth);
    movementBehavior.speed.x = 0;
    movementBehavior.speed.y = 0;
    drawBehavior.shapes.push(shape);
    drawBehavior.alpha = 0;
    drawBehavior.strokeWidth = 6;
    drawBehavior.setNewWidth(targetWidth, 500);
    drawBehavior.setNewAlpha(0.2, 50);
    powerUp.movementBehavior = movementBehavior;
    powerUp.drawBehavior = drawBehavior;
    return powerUp;
  };
};

export default PowerUpFactory;
export const PowerUpFactoryName = Symbol.for('PowerUpFactory');
