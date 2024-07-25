import { injectable } from 'tsyringe';
import type ILogger from '../interfaces/ILogger';

@injectable()
class Logger implements ILogger {
  log = (message: string, params?: object): void => {
    console.log(message, params ?? '');
  };

  warning = (message: string, params?: object): void => {
    console.warn(message, params ?? '');
  };

  error = (message: string, params?: object): void => {
    console.error(message, params ?? '');
  };
}

export default Logger;
