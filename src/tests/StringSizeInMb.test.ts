import stringSizeInMb, { BYTES_PER_MEGABYTE } from '../utils/StringSizeInMb';

describe('stringSizeInMb', () => {
  it('returns the size of a small string in megabytes', () => {
    const smallString = 'Hello, World!';
    const expectedSize = new Blob([smallString]).size / BYTES_PER_MEGABYTE;
    expect(stringSizeInMb(smallString)).toBeCloseTo(expectedSize);
  });

  it('returns the size of a large string, 1 megabyte', () => {
    const largeString = new Array(1024 * 1024).join('a'); // 1 MB string
    const expectedSize = new Blob([largeString]).size / BYTES_PER_MEGABYTE;
    expect(stringSizeInMb(largeString)).toBeCloseTo(expectedSize);
  });

  it('returns the size of a large string, 5 megabytes', () => {
    const largeString = new Array(1024 * 1024 * 5).join('a'); // 1 MB string
    const expectedSize = new Blob([largeString]).size / BYTES_PER_MEGABYTE;
    expect(stringSizeInMb(largeString)).toBeCloseTo(expectedSize);
  });

  it('returns zero for an empty string', () => {
    expect(stringSizeInMb('')).toBe(0);
  });
});
