import { inject, injectable } from 'tsyringe';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import IVideoPlayer, { IVideoPlayerName } from '../interfaces/IVideoPlayer';
import assert from '../libs/asssert';
import Line from '../game_objects/geometry/Line';
import Circle from '../game_objects/geometry/Circle';
import type IPose from '../interfaces/IPose';
import { type IKeyPoint } from '../interfaces/IPose';
import p5 = require('p5');
import DrawShapesBase from './DrawShapesBase';
import { type IDrawBehaviorParams } from '../interfaces/IDrawBehavior';
import IVideoMetadataStore, { IVideoMetadataStoreName } from '../interfaces/IVideoMetadataStore';
import { Palette } from '../utils/Theme';

@injectable()
class DrawPose extends DrawShapesBase {
  private poses: IPose[] | undefined;

  private readonly keypointPairs = [
    // { start: 'leftEar', end: 'rightEar' },
    // { start: 'leftEye', end: 'rightEye' },
    // { start: 'nose', end: 'leftEye' },
    // { start: 'nose', end: 'rightEye' },
    // { start: 'leftEye', end: 'leftEar' },
    // { start: 'rightEye', end: 'rightEar' },
    { start: 'leftShoulder', end: 'rightShoulder' },
    { start: 'leftHip', end: 'rightHip' },
    { start: 'leftShoulder', end: 'leftElbow' },
    { start: 'rightShoulder', end: 'rightElbow' },
    { start: 'leftElbow', end: 'leftWrist' },
    { start: 'rightElbow', end: 'rightWrist' },
    { start: 'leftHip', end: 'leftKnee' },
    { start: 'rightHip', end: 'rightKnee' },
    { start: 'leftKnee', end: 'leftAnkle' },
    { start: 'rightKnee', end: 'rightAnkle' }
    // { start: 'leftShoulder', end: 'leftHip' },
    // { start: 'rightShoulder', end: 'rightHip' }
  ];

  constructor (
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(IVideoMetadataStoreName) private readonly dataStore: IVideoMetadataStore,
    @inject(IVideoPlayerName) private readonly videoPlayer: IVideoPlayer,
    @inject(IP5InstanceName) protected readonly p5Instance: IP5Instance) {
    super(p5Instance);
    this.draw = this.draw.bind(this);
  }

  public async update (): Promise<void> {
    const MIN_PROBABILITY = 0.6;
    const currentTime = this.videoPlayer.videoElement?.time() ?? 0;
    const featuresNow = await this.dataStore.getDataNear(this.videoPlayer.fileGUID, currentTime);
    this.poses = featuresNow?.bodyPoses;

    this.shapes = []; // Reset shapes array

    this.poses?.forEach(pose => {
      assert(this.p5Instance.sketch != null, 'Sketch null in draw pose');
      if (this.p5Instance.sketch == null) return;

      this.keypointPairs.forEach(pair => {
        const startKeypoint = pose.keypoints.find(kp => kp.part === pair.start);
        const endKeypoint = pose.keypoints.find(kp => kp.part === pair.end);

        if (startKeypoint != null && endKeypoint != null && this.p5Instance?.sketch != null &&
           startKeypoint.probability > MIN_PROBABILITY && endKeypoint.probability > MIN_PROBABILITY) {
          const startX = this.mapCoordinate(startKeypoint.position.x, this.videoPlayer.originalVideoWidth, this.videoPlayer.width);
          const startY = this.mapCoordinate(startKeypoint.position.y, this.videoPlayer.originalVideoHeight, this.videoPlayer.height);
          const endX = this.mapCoordinate(endKeypoint.position.x, this.videoPlayer.originalVideoWidth, this.videoPlayer.width);
          const endY = this.mapCoordinate(endKeypoint.position.y, this.videoPlayer.originalVideoHeight, this.videoPlayer.height);

          const line = new Line();
          line.vertex1 = new p5.Vector(startX, startY);
          line.vertex2 = new p5.Vector(endX, endY);
          this.shapes.push(line); // Add line to shapes array

          // Create and add circles for keypoints
          this.shapes.push(this.createKeypointCircle(startKeypoint, startX, startY));
          this.shapes.push(this.createKeypointCircle(endKeypoint, endX, endY));
        }
      });
    });
  }

  public draw (params?: IDrawBehaviorParams): void {
    if (this.p5Instance.sketch == null || this.shapes.length === 0) return;

    this.shapes.forEach(shape => {
      if (shape instanceof Line) {
        this.drawLimb(shape);
      } else if (shape instanceof Circle) {
        this.drawCircle(shape);
      }
    });
  }

  private createKeypointCircle (keypoint: IKeyPoint, x: number, y: number): Circle {
    const circle = new Circle();
    circle.radius = 2;
    circle.offset = new p5.Vector(x, y);
    return circle;
  }

  private drawCircle (circle: Circle): void {
    if (this.p5Instance.sketch == null) return;
    this.p5Instance.sketch.stroke(Palette.blue);
    this.p5Instance.sketch.noFill();
    this.p5Instance.sketch.circle(circle.offset.x, circle.offset.y, circle.radius * 2);
  }

  private drawLimb (line: Line): void {
    if (this.p5Instance.sketch == null) return;
    this.p5Instance.sketch.stroke(Palette.yellow);
    this.p5Instance.sketch.line(line.vertex1.x, line.vertex1.y, line.vertex2.x, line.vertex2.y);
  }

  private mapCoordinate (coordinate: number, originalSize: number, targetSize: number): number {
    return this.p5Instance.sketch?.map(coordinate, 0, originalSize, 0, targetSize) ?? 0;
  }
}

export default DrawPose;
export const DrawPoseName = Symbol.for('DrawPose');
