export interface IPausable {
  pause: () => void
  resume: () => void
  isPaused: () => boolean
};
