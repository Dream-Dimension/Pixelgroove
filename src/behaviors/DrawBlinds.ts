import { container, inject, injectable } from 'tsyringe';
import DrawShapesBase from './DrawShapesBase';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import assert from '../libs/asssert';
import Rectangle from '../game_objects/geometry/Rectangle';
import { Palette } from '../utils/Theme';

@injectable()
class DrawBlinds extends DrawShapesBase {
  private readonly blindsToBuildPerHeight = 3;
  private wasInitialized = false;
  constructor (@inject(IP5InstanceName) p5Instance: IP5Instance) {
    super(p5Instance);
    this.update = this.update.bind(this);
  };

  public init = (): void => {
    assert(this.p5Instance.sketch != null, 'Sketch was null in DrawBlinds init');
    if (this.p5Instance.sketch == null) return;
    this.wasInitialized = true;
    this.shapes = [];
    const canvasWidth = this.p5Instance.width();
    const canvasHeight = this.p5Instance.height();
    // Space between blinds is equal to blind height.
    const heightOfBlind = canvasHeight / ((this.blindsToBuildPerHeight * 2) - 1);
    const totalBlindsToBuild = 3 * this.blindsToBuildPerHeight; // Some for the bottom some for the top.

    // Draw the blinds offset by one full canvasHeight above so we can
    // move the ship and have it still cover up and down.
    // Also center on ship:
    const startingOffset = -canvasHeight + heightOfBlind / 2;
    for (let i = 0; i < totalBlindsToBuild; i++) {
      const rect = container.resolve(Rectangle);
      rect.height = heightOfBlind;
      rect.width = canvasWidth;
      const y = heightOfBlind * i * 2;
      rect.offset.y = startingOffset + y;
      this.shapes.push(rect);
    }
    this.strokeWidth = 0;
    this.alpha = 0.3;
    this.bodyColor = Palette.black;
  };

  public update (): void {
    super.update();
    if (!this.wasInitialized) {
      this.init();
    }
  };
};

export default DrawBlinds;
export const DrawBlindsName = Symbol.for('DrawBlinds');
