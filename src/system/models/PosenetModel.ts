import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';

import ILogger, { ILoggerName } from '../../interfaces/ILogger';
import { inject, injectable } from 'tsyringe';
import { BASE_MODELS_URL } from '../../interfaces/IMediaModel';
import type IMediaModel from '../../interfaces/IMediaModel';
import type IPose from '../../interfaces/IPose';

const POSE_MODEL_URL = `${BASE_MODELS_URL}/posenet/model-stride16.json`;

/**
 * This model is responsible for detecting faces.
 */
@injectable()
class PosenetModel implements IMediaModel<IPose[]> {
  // TODO: move these out to own model classes:
  private _net: posenet.PoseNet | null = null;
  constructor (@inject(ILoggerName) protected readonly logger: ILogger) { }

  load = async (): Promise<void> => {
    this.logger.log('Pose model: loading...');
    try {
      await tf.setBackend('webgl');

      // TODO: move to own class:
      this._net = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75,
        modelUrl: POSE_MODEL_URL
      });

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

  runOn = async (data: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<IPose[]> => {
    const results = await this._net?.estimateMultiplePoses(data, {
      flipHorizontal: false,
      maxDetections: 5,
      scoreThreshold: 0.5,
      nmsRadius: 20
    });
    let poses: IPose[] = [];
    if (results != null) {
      poses = results?.map(r => {
        const keypoints = r.keypoints.map(k => {
          return {
            ...k,
            probability: k.score
          };
        });
        return {
          keypoints,
          probability: r.score
        };
      });
    }
    return poses;
  };
};

export default PosenetModel;
export const PosenetModelName = Symbol.for('PosenetModel');
