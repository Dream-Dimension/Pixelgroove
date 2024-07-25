export const BYTES_PER_MEGABYTE = 1024 * 1024;
const stringSizeInMb = (jsonStr: string): number => {
// Calculate the size in bytes
  const sizeInBytes = new Blob([jsonStr]).size;

  // Convert bytes to megabytes
  const sizeInMegabytes = sizeInBytes / BYTES_PER_MEGABYTE;
  return sizeInMegabytes;
};

export default stringSizeInMb;
