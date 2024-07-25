import 'reflect-metadata';
import Setup from './core/Setup';

/**
 * Entry point to the frontend side of the application:
 */
const setup = new Setup();
void (async () => {
  await setup.init();
})();
