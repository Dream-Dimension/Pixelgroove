import { container, inject, injectable } from 'tsyringe';
import ISoundAnalyzer, { ISoundAnalyzerName } from '../interfaces/ISoundAnalyzer';
import Rectangle from '../game_objects/geometry/Rectangle';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import assert from '../libs/asssert';
import DrawShapesBase from './DrawShapesBase';
import type IDrawFFTOnEdges from '../interfaces/IDrawFFTOnEdges';
import { type EdgeOrientation } from '../interfaces/IDrawFFTOnEdges';
import { map } from '../utils/Mathy';
import Circle from '../game_objects/geometry/Circle';

/**
 *
 * Responsible for drawing FFT values on the edges (top or bottom) of the screen.
 *
 *
 * The drawing is of a typical FFT bar graph that goes up and down:

 * Example Top (without Cherry):
 * ------------------------------
 * |||||||
 * ||||
 * | |
 *
 *
 *
 * Example Bottom (with Cherry):
 *
 * .  .
 * |..|...
 * |||||||.
 * ||||||||
 * ------------------------------
 *
 *
 * It supports drawing a core body (bar graph) and a cherry on top of said body.
 * Also supports turning them (core body and cherry) on and off individually.
 *
 */

@injectable()
class DrawFFTOnEdges extends DrawShapesBase implements IDrawFFTOnEdges {
  // TODO: set max width (for all shapes together)
  // TODO: set max height (for all shapes together)

  constructor (@inject(IP5InstanceName) p5Instance: IP5Instance,
    @inject(ISoundAnalyzerName) private readonly soundAnalyzer: ISoundAnalyzer) {
    super(p5Instance);
    this.update = this.update.bind(this);
  }

  private _cherryVisible = true;
  private _coreBodyVisible = true;
  private _edge: EdgeOrientation = 'top';

  public get cherryVisible (): boolean {
    return this._cherryVisible;
  }

  public set cherryVisible (enabled: boolean) {
    this._cherryVisible = enabled;
  }

  public get coreBodyVisible (): boolean {
    return this._coreBodyVisible;
  }

  public set coreBodyVisible (enabled: boolean) {
    this._coreBodyVisible = enabled;
  }

  /**
   * Which edge of the screen to draw the FFT on.
   */
  public get edge (): EdgeOrientation {
    return this._edge;
  }

  public set edge (edge: EdgeOrientation) {
    assert(edge === 'top' || edge === 'bottom', 'Edge must be either top or bottom');
    this._edge = edge;
  }

  /**
   * The placemenet is a bit odd since it's off the screen by default.
   * It's designed to be placed at the bottom of the screen by the movement behavior.
   *
   * All the rectangles will be above the canavs if drawn without
   * translating them further down.
   */
  public update (): void {
    const p = this.p5Instance.sketch;
    assert(p != null, 'P5 Sketch was null in FFTToShapes');
    if (p == null) return;

    const spectrum = this.soundAnalyzer.fft; // array of values from 0-255
    const SCALE_FACTOR = 0.3;
    const maxShapeHeight = p.height * SCALE_FACTOR;

    // Bottom of the screen version:
    const shapes = [];

    const width = p.width;
    const widthPercentage = 0.9;
    const horizotalOffset = width * (1 - widthPercentage); // We want to omit this much from the start
    // of the screen. Give the player some room
    const spectrumStepSize = 4;
    const cheryWidth = (p.width * widthPercentage) / spectrum.length;
    const baseWidth = 5;

    for (let i = 0; i < spectrum.length; i += spectrumStepSize) {
      const shapeHeight = map(spectrum[i],
        0, this.soundAnalyzer.FFT_MAX_VALUE, // range fft spectrum is in
        0, maxShapeHeight // range we want it in
      );

      const x = map(i, 0, spectrum.length, width, horizotalOffset);
      // Core Body:
      const coreBody = new Rectangle(baseWidth, shapeHeight);
      coreBody.offset.x = x + cheryWidth / 2 - baseWidth / 2; // Center it bellow the cherry.
      // We want the rectangle to be drawn from the bottom up:
      // so we offset it by it's own height so it is drawn from the bottom up.
      if (this.edge === 'bottom') {
        coreBody.offset.y = -shapeHeight;
      } else if (this.edge === 'top') {
        coreBody.offset.y = 0;
      }
      // Cherry on top:
      const cherry = container.resolve(Circle);
      cherry.radius = cheryWidth / 2;
      const cherryYSpacer = 0;
      cherry.offset.x = x + cheryWidth / 2;
      // We want this to appear right after the core body:
      if (this.edge === 'bottom') {
        cherry.offset.y = -(shapeHeight + cherryYSpacer + cherry.radius);
      } else if (this.edge === 'top') {
        cherry.offset.y = (shapeHeight + cherryYSpacer + cherry.radius);
      }

      if (this.coreBodyVisible) shapes.push(coreBody); // TODO: only if body is enabled
      if (this.cherryVisible) shapes.push(cherry); // TODO: only if cherry enabled
    }

    this.shapes = shapes;
  };
};

export default DrawFFTOnEdges;

export const DrawFFTOnEdgesName = Symbol.for('DrawFFTOnEdges');
