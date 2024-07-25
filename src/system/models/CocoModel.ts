import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import ILogger, { ILoggerName } from '../../interfaces/ILogger';
import { inject, injectable } from 'tsyringe';
import { BASE_MODELS_URL } from '../../interfaces/IMediaModel';
import type IMediaModel from '../../interfaces/IMediaModel';
import type IFace from '../../interfaces/IFace';
import type IObjectedDetected from '../../interfaces/IObjectDetected';

const COCO_MODEL_URL = `${BASE_MODELS_URL}/coco/model.json`;

/**
 * This model is responsible for detecting objects (with labels: e.g person).
 */
@injectable()
class CocoModel implements IMediaModel<IFace[]> {
  // TODO: move these out to own model classes:
  private _coco: cocoSsd.ObjectDetection | null = null;
  constructor (@inject(ILoggerName) protected readonly logger: ILogger) { }

  load = async (): Promise<void> => {
    this.logger.log('Coco model: loading...');
    try {
      await tf.setBackend('webgl');

      this._coco = await cocoSsd.load({ modelUrl: COCO_MODEL_URL });

      this.logger.log('Loaded model');
    } catch (err) {
      this.logger.error('Error loading blaze model.');
    }
  };

  // TODO: for Tensor2D use:  landmarksArray = landmarks.arraySync();
  protected readonly processTensor1D = (value: tf.Tensor1D | number | number[]): number[] => {
    let numbersArray: number[] = [];
    if (value instanceof Array) {
      // Already a numbers array:
      numbersArray = value;
    } else if (value instanceof tf.tensor1d) {
      numbersArray = value.dataSync() as unknown as number[];
      // It's a tensor, use dataSync() to get a JavaScript array
    } else if (typeof value === 'number') {
      // It's a number, put it in an array:
      numbersArray = [value];
    } else {
      this.logger.warning('is not a tensor or array.');
    }
    return numbersArray;
  };

  runOn = async (data: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<IObjectedDetected[]> => {
    // TODO: move to own class:
    const objs = await this._coco?.detect(data);
    if (objs != null) {
      return objs.map((predictionResult: cocoSsd.DetectedObject): IObjectedDetected => {
        const [x, y, width, height] = predictionResult.bbox;

        const topLeftX = x;
        const topLeftY = y;
        const bottomRightX = x + width;
        const bottomRightY = y + height;
        const probability = predictionResult.score;
        return {
          type: predictionResult.class,
          topLeft: [topLeftX, topLeftY],
          bottomRight: [bottomRightX, bottomRightY],
          probability
        };
      });
    }
    return [];
  };
};

export default CocoModel;
export const CocoModelName = Symbol.for('CocoModel');
