import { inject, injectable } from 'tsyringe';
import type IDrawBehavior from '../interfaces/IDrawBehavior';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import { ProbabilityRanges } from '../utils/Probability';
import IVideoPlayer, { IVideoPlayerName } from '../interfaces/IVideoPlayer';
import assert from '../libs/asssert';
import { map } from '../utils/Mathy';
import type IPose from '../interfaces/IPose';
import { BODY_PARTS, type IKeyPoint } from '../interfaces/IPose';
/**
 * A debugging drawing behavior that draws poses detected by ML model.
 */
@injectable()
class DrawPoseDebug implements IDrawBehavior<IPose[]> {
  // Define the pairs of keypoints to draw lines between
  private readonly keypointPairs = [
    { start: 'leftEar', end: 'rightEar' },
    { start: 'leftShoulder', end: 'rightShoulder' },
    { start: 'leftHip', end: 'rightHip' },
    { start: 'leftKnee', end: 'rightKnee' },
    { start: 'leftAnkle', end: 'rightAnkle' },
    { start: 'leftEye', end: 'rightEye' },
    { start: 'leftShoulder', end: 'leftElbow' },
    { start: 'rightShoulder', end: 'rightElbow' },
    { start: 'leftElbow', end: 'leftWrist' },
    { start: 'rightElbow', end: 'rightWrist' },
    { start: 'leftHip', end: 'leftKnee' },
    { start: 'rightHip', end: 'rightKnee' },
    { start: 'leftKnee', end: 'leftAnkle' },
    { start: 'rightKnee', end: 'rightAnkle' },
    { start: 'leftShoulder', end: 'leftHip' },
    { start: 'rightShoulder', end: 'rightHip' },
    { start: 'nose', end: 'leftEye' },
    { start: 'nose', end: 'rightEye' },
    { start: 'leftEye', end: 'leftEar' },
    { start: 'rightEye', end: 'rightEar' }
  ];

  constructor (
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(IVideoPlayerName) private readonly videoPlayer: IVideoPlayer,
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance) {}

  draw = (poses?: IPose[]): void => {
    assert(poses != null, 'Poses was null in draw pose');
    if (poses == null) return;
    const originalVideoWidth = this.videoPlayer.originalVideoWidth;
    const originalVideoHeight = this.videoPlayer.originalVideoHeight;

    poses.forEach(pose => {
      assert(this.p5Instance.sketch != null, 'Sketch null in draw pose');
      if (this.p5Instance.sketch == null) return;

      this.keypointPairs.forEach(pair => {
        const startKeypoint = pose.keypoints.find(kp => kp.part === pair.start);
        const endKeypoint = pose.keypoints.find(kp => kp.part === pair.end);

        if (startKeypoint != null && endKeypoint != null && this.p5Instance?.sketch != null && startKeypoint.probability > 0.35 && endKeypoint.probability > 0.35) {
          const startX = map(startKeypoint.position.x, 0, originalVideoWidth, 0, this.videoPlayer.width);
          const startY = map(startKeypoint.position.y, 0, originalVideoHeight, 0, this.videoPlayer.height);
          const endX = map(endKeypoint.position.x, 0, originalVideoWidth, 0, this.videoPlayer.width);
          const endY = map(endKeypoint.position.y, 0, originalVideoHeight, 0, this.videoPlayer.height);

          this.p5Instance.sketch.stroke(255, 255, 0); // Set line color
          this.p5Instance.sketch.line(startX, startY, endX, endY);

          this.drawKeypoint(startKeypoint, startX, startY);
          this.drawKeypoint(endKeypoint, endX, endY);
        }
      });
    });
  };

  private drawKeypoint (keypoint: IKeyPoint, x: number, y: number): void {
    if (this.p5Instance.sketch == null) return;

    // Set color based on probability
    if (keypoint.probability >= ProbabilityRanges.HIGH) {
      this.p5Instance.sketch.stroke(0, 255, 0);
    } else if (keypoint.probability >= ProbabilityRanges.MODERATE) {
      this.p5Instance.sketch.stroke(0, 0, 255);
    } else {
      this.p5Instance.sketch.stroke(255, 255, 0);
    }

    this.p5Instance.sketch.noFill();
    const radius = BODY_PARTS.includes(keypoint.part) ? 2 : 10;
    this.p5Instance.sketch.circle(x, y, radius);
  }
};

export default DrawPoseDebug;
export const DrawPoseDebugName = Symbol.for('DrawPoseDebug');
