import { inject, injectable } from 'tsyringe';
import { type IDrawBehaviorParams } from '../interfaces/IDrawBehavior';
import DrawShapesBase from './DrawShapesBase';
import { ShapeType } from '../interfaces/IShape';
import type ITriangle from '../interfaces/ITriangle';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import ISoundAnalyzer, { ISoundAnalyzerName } from '../interfaces/ISoundAnalyzer';
import { type IDrawShip } from '../interfaces/IDrawShip';
import { ParticleSystemName, IParticleSystem, ColorTheme } from '../managers/ParticleSystem';

@injectable()
class DrawShip extends DrawShapesBase implements IDrawShip {
  private _waveFormEnabled = false;
  private _isDead = false;
  private _paused = false;

  constructor (
    @inject(ParticleSystemName) private readonly particleSystem: IParticleSystem,
    @inject(ISoundAnalyzerName) protected readonly soundAnalyzer: ISoundAnalyzer,
    @inject(IP5InstanceName) protected readonly p5Instance: IP5Instance) {
    super(p5Instance);
  }

  public pause = (): void => {
    this._paused = true;
  };

  public resume = (): void => {
    this._paused = false;
  };

  public isPaused = (): boolean => {
    return this._paused;
  };

  set waveformEnabled (_waveFormEnabled: boolean) {
    this._waveFormEnabled = _waveFormEnabled;
  }

  get waveformEnabled (): boolean {
    return this._waveFormEnabled;
  }

  public draw (params?: IDrawBehaviorParams): void {
    const { position } = params ?? {};
    super.draw(params);
    if (this._isDead) {
      this.drawDeathAnimation();
    }
    if (position == null) return;

    if (!this.waveformEnabled) return;
    this.particleSystem.setColorTheme(ColorTheme.Green);

    if (!this._paused) {
      this.particleSystem.addExplosion(position.x, position.y, 2, 150);
    }

    if (this.p5Instance?.sketch == null) return;

    const shape = this.shapes.find(shape => shape.type === ShapeType.triangle);
    if (shape == null) return;
    const triangle = shape as unknown as ITriangle;

    const waveform = this.soundAnalyzer.waveform; // Replace with your actual waveform data source

    const vertices = [triangle.vertex1, triangle.vertex2, triangle.vertex3];
    const minX = Math.min(...vertices.map(v => v.x));
    const maxX = Math.max(...vertices.map(v => v.x));
    const minY = Math.min(...vertices.map(v => v.y));
    const maxY = Math.max(...vertices.map(v => v.y));
    const waveHeight = (maxY - minY) / 2;

    this.p5Instance.sketch.stroke(255, 255, 0); // Yellow color
    this.p5Instance.sketch.noFill();
    this.p5Instance.sketch.beginShape();

    waveform.forEach((waveformValue, index) => {
      if (this.p5Instance?.sketch == null) return;
      const localX = this.p5Instance.sketch.map(index, 0, waveform.length, minX, maxX);

      // Scale the amplitude based on the x-position
      const scale = this.getAmplitudeScale(index, waveform.length);
      const scaledWaveformValue = waveformValue * scale;

      const localY = this.p5Instance.sketch.map(scaledWaveformValue, -1, 1, -waveHeight, waveHeight);
      const waveX = position.x + shape.offset.x + localX;
      const waveY = position.y + shape.offset.y + (minY + maxY) / 2 + localY;

      this.p5Instance.sketch.vertex(waveX, waveY);
    });

    this.p5Instance.sketch.endShape();
  }

  // Setter for isDead
  public set isDead (value: boolean) {
    this._isDead = value;
  }

  // Getter for isDead
  public get isDead (): boolean {
    return this._isDead;
  }

  private drawDeathAnimation (): void {
    if (this.p5Instance?.sketch == null) return;
    this.p5Instance.sketch.fill(255, 0, 0, 50); // Red color
    this.p5Instance.sketch.rect(0, 0, this.p5Instance.sketch.width, this.p5Instance.sketch.height);
  }

  // Function to calculate the scaling factor for the waveform amplitude
  private getAmplitudeScale (index: number, totalLength: number): number {
    // Use a quadratic or cubic function for a more gradual flattening
    const progress = index / totalLength;
    const scale = 1 - Math.pow(progress, 3); // Cubic scaling
    return Math.max(scale, 0); // Ensures the scale is not negative
  }
}

export default DrawShip;
export const DrawShipName = Symbol.for('DrawShipName');
