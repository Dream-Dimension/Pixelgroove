import { inject, injectable } from 'tsyringe';
import ILogger, { ILoggerName } from '../interfaces/ILogger';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import { ProbabilityRanges } from '../utils/Probability';
import IVideoPlayer, { IVideoPlayerName } from '../interfaces/IVideoPlayer';
import assert from '../libs/asssert';
import DrawShapesBase from './DrawShapesBase';
import Rectangle from '../game_objects/geometry/Rectangle';
import type IShape from '../interfaces/IShape';
import IVideoMetadataStore, { IVideoMetadataStoreName } from '../interfaces/IVideoMetadataStore';
import { type IDrawBehaviorParams } from '../interfaces/IDrawBehavior';
import type IRectangle from '../interfaces/IRectangle';
import { ShapeType } from '../interfaces/IShape';
import { type Vector } from 'p5';

const THICK = 10;
const THIN = 2;

/**
 * A drawing behavior that draws simple features like objects and faces detected by the ML models.
 * It will be coupled to the current video playing and the timestamp when this update is called.
 */
@injectable()
class DrawSimpleFeatures extends DrawShapesBase {
  private shoulDrawFaces = true;
  constructor (
    @inject(ILoggerName) private readonly logger: ILogger,
    @inject(IVideoPlayerName) private readonly videoPlayer: IVideoPlayer,
    @inject(IVideoMetadataStoreName) private readonly dataStore: IVideoMetadataStore,
    @inject(IP5InstanceName) protected readonly p5Instance: IP5Instance) {
    super(p5Instance);
    this.draw = this.draw.bind(this);
  }

  /**
   * Draw faces only.
   */
  public enableDrawFacesMode = (shouldDrawFaces: boolean): void => {
    this.shoulDrawFaces = shouldDrawFaces;
  };

  /**
   * Draw detected objects only.
   */
  public enableDrawDetectedObjectsMode = (shouldDrawObjects: boolean): void => {
    this.shoulDrawFaces = !shouldDrawObjects;
  };

  public async update (): Promise<void> {
    const currentTime = this.videoPlayer.videoElement?.time() ?? 0;
    const featuresNow = await this.dataStore.getDataNear(this.videoPlayer.fileGUID, currentTime);
    const simpleFeatures = this.shoulDrawFaces ? (featuresNow?.faces ?? []) : (featuresNow?.objectsDetected ?? []);
    const shapes: IShape[] = [];

    simpleFeatures.forEach(detectedFeature => {
      assert(this.p5Instance.sketch != null, 'Sketch null in draw features');
      if (this.p5Instance.sketch == null) return;

      const { topLeft, bottomRight, probability } = detectedFeature;
      if (topLeft == null || bottomRight == null) return;
      const left = { x: topLeft[0], y: topLeft[1] };
      const right = { x: bottomRight[0], y: bottomRight[1] };

      if (probability < ProbabilityRanges.MODERATE && this.shoulDrawFaces) {
        return;
      }

      this.p5Instance.sketch?.noFill();

      const originalVideoWidth = this.videoPlayer.originalVideoWidth;
      const originalVideoHeight = this.videoPlayer.originalVideoHeight;

      // Adjust coordiantes for adjusting to canvas dimensions vs original video dimensions:
      const leftX = this.p5Instance.sketch.map(left.x, 0, originalVideoWidth, 0, this.videoPlayer.width);
      const leftY = this.p5Instance.sketch.map(left.y, 0, originalVideoHeight, 0, this.videoPlayer.height);

      const rightX = this.p5Instance.sketch.map(right.x, 0, originalVideoWidth, 0, this.videoPlayer.width);
      const rightY = this.p5Instance.sketch.map(right.y, 0, originalVideoHeight, 0, this.videoPlayer.height);

      const rectWidth = rightX - leftX;
      const rectHeight = rightY - leftY;
      const rect = new Rectangle(rectWidth, rectHeight);
      rect.offset.x = leftX;
      rect.offset.y = leftY;
      shapes.push(rect);
    });
    this.shapes = shapes;
  };

  private drawDetectedObject (position: Vector, shape: IShape): void {
    assert(this.p5Instance.sketch != null, 'Sketch was null in draw simple feature');
    if (position == null) return;
    if (this.p5Instance.sketch == null) return;
    // //////////////////////////////////////////////////////
    const color = this.p5Instance.sketch.color(this.bodyColor);
    const rectangle = shape as unknown as IRectangle;
    const x = position.x + shape.offset.x;
    const y = position.y + shape.offset.y;
    const width = rectangle.width;
    const height = rectangle.height;
    // Dot properties
    const dotSize = 10; // Size of each dot
    const spaceBetweenDots = 10; // Space between dots

    const drawAngleBracket = (cornerX: number, cornerY: number, size: number, isTop: boolean, isLeft: boolean): void => {
      if (this.p5Instance?.sketch == null) return;
      const angleSize = size; // Size of each leg of the angle bracket
      this.p5Instance.sketch.stroke(255); // White color
      this.p5Instance.sketch.strokeWeight(THICK); // Stroke thickness

      // Determine direction multipliers based on corner type
      const xMultiplier = isLeft ? 1 : -1;
      const yMultiplier = isTop ? 1 : -1;

      // Draw the two lines of the bracket
      this.p5Instance.sketch.line(cornerX, cornerY, cornerX + (angleSize * xMultiplier), cornerY);
      this.p5Instance.sketch.line(cornerX, cornerY, cornerX, cornerY + (angleSize * yMultiplier));
    };

    // Function to draw dotted line
    const drawDottedLine = (fromX: number, fromY: number, toX: number, toY: number): void => {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const dotCount = distance / (dotSize + spaceBetweenDots);
      const dotXIncrement = dx / dotCount;
      const dotYIncrement = dy / dotCount;

      for (let i = 0; i < dotCount; i++) {
        this.p5Instance.sketch?.point(fromX + i * dotXIncrement, fromY + i * dotYIncrement);
      }
    };

    const drawAllDottedLines = (): void => {
      // Draw dotted lines around the rectangle
      // Top edge
      drawDottedLine(x, y, x + width, y);

      // Right edge
      drawDottedLine(x + width, y, x + width, y + height);

      // Bottom edge
      drawDottedLine(x, y + height, x + width, y + height);

      // Left edge
      drawDottedLine(x, y, x, y + height);
    };

    if (shape.justCollided) {
      this.p5Instance.sketch.strokeWeight(1);
      color.setAlpha(255 * 0.2);
      this.p5Instance.sketch.stroke(color);
      const lineSpacing = 75; // Spacing between each diagonal line

      // Draw diagonal lines starting from the top left corner
      for (let offset = 0; offset <= (width + height); offset += lineSpacing) {
        let startX = x;
        let startY = y + offset;
        let endX = x + offset;
        let endY = y;

        // Adjust the start and end points if they are out of bounds
        if (startY > y + height) {
          startY = y + height;
          startX = x + (offset - height);
        }

        if (endX > x + width) {
          endX = x + width;
          endY = y + (offset - width);
        }
        this.p5Instance?.sketch?.line(startX, startY, endX, endY);
      }

      // Setup Draw Surrounding dots:
      this.p5Instance.sketch.strokeWeight(8);
      color.setAlpha(255 * 1.0);
      this.p5Instance.sketch.stroke(color);
      drawAllDottedLines();
      const bracketSize = 20; // Define the size of the angle brackets
      drawAngleBracket(x, y, bracketSize, true, true); // Top-left corner
      drawAngleBracket(x + width, y, bracketSize, true, false); // Top-right corner
      drawAngleBracket(x, y + height, bracketSize, false, true); // Bottom-left corner
      drawAngleBracket(x + width, y + height, bracketSize, false, false); // Bottom-right corner
    } else {
      // Draw dotted liens
      this.p5Instance.sketch.strokeWeight(4);
      color.setAlpha(255 * 1.0);
      this.p5Instance.sketch.stroke(color);
      drawAllDottedLines();
    }
  }

  private drawWhiteCorner (x: number, y: number): void {
    if (this.p5Instance?.sketch == null) return;

    this.p5Instance.sketch.stroke(255); // White color
    this.p5Instance.sketch.strokeWeight(THICK); // Use the THICK constant for stroke weight

    // Drawing a dot
    this.p5Instance.sketch.point(x, y);
  }

  private drawFace (position: Vector, shape: IShape): void {
    assert(this.p5Instance.sketch != null, 'Sketch was null in draw simple feature');
    if (position == null) return;
    if (this.p5Instance.sketch == null) return;
    const rectangle = shape as unknown as IRectangle;

    const x = position.x + shape.offset.x;
    const y = position.y + shape.offset.y;
    const width = rectangle.width;
    const height = rectangle.height;
    const cornerLength = Math.min(width, height) * 0.1; // Adjust the length of the corner lines

    if (shape.justCollided) {
      this.p5Instance.sketch.strokeWeight(THICK);
    } else {
      this.p5Instance.sketch.strokeWeight(THIN);
    }
    // Set color and stroke for the lines
    const color = this.p5Instance.sketch.color(this.bodyColor);
    this.p5Instance.sketch.stroke(color);

    // Draw the four corner lines

    // Top-left corner
    this.p5Instance.sketch.line(x, y, x + cornerLength, y);
    this.p5Instance.sketch.line(x, y, x, y + cornerLength);

    // Top-right corner
    this.p5Instance.sketch.line(x + width, y, x + width - cornerLength, y);
    this.p5Instance.sketch.line(x + width, y, x + width, y + cornerLength);

    // Bottom-left corner
    this.p5Instance.sketch.line(x, y + height, x, y + height - cornerLength);
    this.p5Instance.sketch.line(x, y + height, x + cornerLength, y + height);

    // Bottom-right corner
    this.p5Instance.sketch.line(x + width, y + height, x + width, y + height - cornerLength);
    this.p5Instance.sketch.line(x + width, y + height, x + width - cornerLength, y + height);

    // //////////////////////////////////
    const midLineLength = cornerLength; // Length of the mid-side lines
    // Draw lines at the middle of each side
    // Middle of top edge
    this.p5Instance.sketch.line(x + width / 2 - midLineLength / 2, y, x + width / 2 + midLineLength / 2, y);

    // Middle of bottom edge
    this.p5Instance.sketch.line(x + width / 2 - midLineLength / 2, y + height, x + width / 2 + midLineLength / 2, y + height);

    // Middle of left edge
    this.p5Instance.sketch.line(x, y + height / 2 - midLineLength / 2, x, y + height / 2 + midLineLength / 2);

    // Middle of right edge
    this.p5Instance.sketch.line(x + width, y + height / 2 - midLineLength / 2, x + width, y + height / 2 + midLineLength / 2);
    if (shape.justCollided) {
      // Call the new method to draw white corners
      this.drawWhiteCorner(x, y); // Top-left corner
      this.drawWhiteCorner(x + width, y); // Top-right corner
      this.drawWhiteCorner(x, y + height); // Bottom-left corner
      this.drawWhiteCorner(x + width, y + height); // Bottom-right corner
    }
  }

  public draw (params?: IDrawBehaviorParams): void {
    const shapes = this.shapes;
    const { position } = params ?? {};
    assert(shapes != null, 'Shapes was null in draw simple feature');
    assert(position != null, 'Position was null in draw simple feature');
    assert(this.p5Instance.sketch != null, 'Sketch was null in draw simple feature');

    if (position == null) return;
    if (shapes == null || shapes.length === 0) return;
    if (this.p5Instance.sketch == null) return;

    for (const shape of shapes) {
      if (shape.type === ShapeType.rectangle) {
        if (this.shoulDrawFaces) {
          this.drawFace(position, shape);
        } else {
          this.drawDetectedObject(position, shape);
        }
      }
    }
  }
};

export default DrawSimpleFeatures;
export const DrawSipmleFeaturesName = Symbol.for('DrawSimpleFeatures');
