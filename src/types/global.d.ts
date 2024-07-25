import type * as p5 from 'p5';

// Step 1: Define the Electron API interface
interface ElectronAPI {
  quitApp: () => void
  toggleFullScreen: () => void
}

declare global {
  interface Window {
    p5: typeof p5
    electron: ElectronAPI
  }
}
