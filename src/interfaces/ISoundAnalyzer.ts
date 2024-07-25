interface ISoundAnalyzer {
  FFT_MAX_VALUE: number // 0 -> 255 is the standard fft range aka the max value an fft bin can give
  get fftNumberOfBins(): number // number of bins returned by the fft analyze() fxn.
  set fftNumberOfBins(numberOfBins: number)
  fft: number[]
  waveform: number[]

};

export default ISoundAnalyzer;
export const ISoundAnalyzerName = Symbol.for('ISoundAnalyzer');
