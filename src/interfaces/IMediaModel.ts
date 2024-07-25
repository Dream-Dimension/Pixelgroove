export default interface IMediaModel<ResultType> {
  load: () => Promise<void>
  runOn: (data: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => Promise<ResultType>
};

export const BASE_MODELS_URL = './assets/models';
export const IMediaModelName = Symbol.for('IMediaModel');
