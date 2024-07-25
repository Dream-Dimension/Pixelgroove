export default interface ILogger {
  log: (message: string, params?: object) => void
  warning: (message: string, params?: object) => void
  error: (message: string, params?: object) => void
}

export const ILoggerName = Symbol.for('ILogger');
