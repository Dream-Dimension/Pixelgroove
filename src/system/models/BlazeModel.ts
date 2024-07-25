import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

import type { NormalizedFace } from '@tensorflow-models/blazeface';
import ILogger, { ILoggerName } from '../../interfaces/ILogger';
import { inject, injectable } from 'tsyringe';
import { BASE_MODELS_URL } from '../../interfaces/IMediaModel';
import type IMediaModel from '../../interfaces/IMediaModel';
import type IFace from '../../interfaces/IFace';

const BLAZE_MODEL_URL = `${BASE_MODELS_URL}/blaze-face/model.json`;

/**
 * This model is responsible for detecting faces.
 */
@injectable()
class BlazeModel implements IMediaModel<IFace[]> {
  // TODO: move these out to own model classes:
  protected model: blazeface.BlazeFaceModel | null = null;
  constructor (@inject(ILoggerName) protected readonly logger: ILogger) { }

  load = async (): Promise<void> => {
    this.logger.log('BlazeModel: loading...');
    try {
      await tf.setBackend('webgl');
      const config = {
        modelUrl: BLAZE_MODEL_URL
      };

      this.model = await blazeface.load(config);

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

  runOn = async (data: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<IFace[]> => {
    const results = await this.model?.estimateFaces(data, false);

    if (results != null) {
      return results.map((result: NormalizedFace): IFace => {
        const topLeft = this.processTensor1D(result.topLeft);
        const bottomRight = this.processTensor1D(result.bottomRight);
        const probability = this.processTensor1D(result.probability ?? [0])[0] ?? 0;
        return {
          topLeft: [topLeft[0], topLeft[1]],
          bottomRight: [bottomRight[0], bottomRight[1]],
          probability
        };
      });
    }
    return [];
  };
};

export default BlazeModel;
export const BlazeModelName = Symbol.for('BlazeModel');
