const waitUntilThenCallCb = (isDone: () => boolean, cb: () => void, retryTime = 50): void => {
  if (isDone()) {
    cb();
    return;
  }
  setTimeout(() => {
    waitUntilThenCallCb(isDone, cb, retryTime);
  }, retryTime);
};

const waitUntil = async (isDone: () => boolean, retryTime = 50): Promise<void> => {
  await new Promise<void>((resolve) => {
    waitUntilThenCallCb(isDone, resolve, retryTime);
  });
};

export default waitUntil;
