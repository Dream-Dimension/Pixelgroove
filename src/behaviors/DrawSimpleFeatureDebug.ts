import { inject, injectable } from 'tsyringe';
import type IFace from '../interfaces/IFace';
import type IDrawBehavior from '../interfaces/IDrawBehavior';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import { ProbabilityRanges } from '../utils/Probability';
import IVideoPlayer, { IVideoPlayerName } from '../interfaces/IVideoPlayer';
import assert from '../libs/asssert';
import type IObjectedDetected from '../interfaces/IObjectDetected';
import { map } from '../utils/Mathy';

/**
 * A debugging drawing behavior that draws faces detected by ML model.
 */
@injectable()
class DrawSimpleFeatureDebug implements IDrawBehavior<IFace[] | IObjectedDetected[]> {
  constructor (
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(IVideoPlayerName) private readonly videoPlayer: IVideoPlayer,
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance) {}

  draw = (faces?: IFace[] | IObjectedDetected[]): void => {
    assert(faces != null, 'Faces was null in draw faces');
    if (faces == null) return;

    faces.forEach(faceDetected => {
      assert(this.p5Instance.sketch != null, 'Sketch null in draw faces');
      if (this.p5Instance.sketch == null) return;

      const { topLeft, bottomRight, probability } = faceDetected;
      if (topLeft == null || bottomRight == null) return;
      const left = { x: topLeft[0], y: topLeft[1] };
      const right = { x: bottomRight[0], y: bottomRight[1] };

      // Color code based on probability of it being a face:
      if (probability >= ProbabilityRanges.HIGH) {
        this.p5Instance.sketch.stroke(0, 255, 0);
      } else if (probability >= ProbabilityRanges.MODERATE) {
        this.p5Instance.sketch.stroke(0, 0, 255);
      } else {
        this.p5Instance.sketch.stroke(255, 0, 0);
      }
      this.p5Instance.sketch?.noFill();

      const originalVideoWidth = this.videoPlayer.originalVideoWidth;
      const originalVideoHeight = this.videoPlayer.originalVideoHeight;

      // Adjust coordiantes for adjusting to canvas dimensions vs original video dimensions:
      const leftX = map(left.x, 0, originalVideoWidth, 0, this.videoPlayer.width);
      const leftY = map(left.y, 0, originalVideoHeight, 0, this.videoPlayer.height);

      const rightX = map(right.x, 0, originalVideoWidth, 0, this.videoPlayer.width);
      const rightY = map(right.y, 0, originalVideoHeight, 0, this.videoPlayer.height);

      this.p5Instance.sketch.rect(leftX, leftY, rightX - leftX, rightY - leftY);
    });
  };
};

export default DrawSimpleFeatureDebug;
export const DrawSimpleFeatureDebugName = Symbol.for('DrawSimpleFeatureDebug');
