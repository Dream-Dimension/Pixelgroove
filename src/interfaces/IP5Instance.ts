import type * as p5 from 'p5';

export default interface IP5Instance {
  sketch: p5 | undefined // instanced version of p5
  init: (cb: (sketch: p5) => void) => void
  width: () => number
  height: () => number
};

export const IP5InstanceName = Symbol.for('IP5Instance');
