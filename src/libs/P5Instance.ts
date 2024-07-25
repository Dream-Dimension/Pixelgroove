import { injectable } from 'tsyringe';
import * as p5 from 'p5';
import type IP5Instance from '../interfaces/IP5Instance';

/**
 * For details see ./GLOBAL_COMMENTS.md under the P5Instance section.
 */

@injectable()
class P5Instance implements IP5Instance {
  sketch: p5 | undefined;
  private instance: p5 | undefined; // not sure why this is different than sketch but it is

  init = (cb: (sketch: p5) => void): void => {
    // eslint-disable-next-line new-cap
    this.instance = new p5((sketch: p5) => {
      this.sketch = sketch;
      cb(sketch);
    });
  };

  width = (): number => {
    return this.sketch?.width ?? 0;
  };

  height = (): number => {
    return this.sketch?.height ?? 0;
  };
}

export default P5Instance;
