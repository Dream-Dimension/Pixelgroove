/**
 * If condition fails, logs a warning.
 *
 * To be used in development as a first pass of design by contract. It won't break production.
 *
 * Reasoning for creating:
 *
 * Had difficulty importing the npm assert library in TS so added this simplified version for now.
 *
 */
const assert = (test: boolean, msg: string): void => {
  if (!test) {
    console.error(msg);
  }
};

export default assert;
