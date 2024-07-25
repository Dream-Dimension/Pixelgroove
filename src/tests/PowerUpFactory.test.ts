import 'reflect-metadata';
import { container, instanceCachingFactory } from 'tsyringe';
import type IFactory from '../interfaces/IFactory';
import { PowerUpType } from '../interfaces/IFactory';
import type IP5Instance from '../interfaces/IP5Instance';
import { IP5InstanceName } from '../interfaces/IP5Instance';
import { ISoundAnalyzerName } from '../interfaces/ISoundAnalyzer';
import PowerUpFactory from '../factories/PowerUpFactory';

describe('EnemyFactory', () => {
  let powerupFactor: IFactory<PowerUpType>;
  let mockP5Instance: IP5Instance;

  beforeEach(() => {
    // Mock dependencies
    mockP5Instance = {
      // @ts-expect-error - p5 is a mock
      sketch: {}
    };

    const mockSoundAnalyzer = {
    };

    // Setup dependency injection
    container.register(IP5InstanceName, { useFactory: instanceCachingFactory(() => mockP5Instance) });
    container.register(ISoundAnalyzerName, { useFactory: instanceCachingFactory(() => mockSoundAnalyzer) });
    powerupFactor = container.resolve(PowerUpFactory);
  });

  describe('create method', () => {
    it('should create FFTTop powerup with specific properties', () => {
      const powerup = powerupFactor.create(PowerUpType.FFTTop);
      expect(powerup).toHaveProperty('drawBehavior');
      expect(powerup.drawBehavior).toHaveProperty('edge', 'top');
      // Add more property checks specific to FFTTop enemy
    });

    it('should create FFTBottom powerup with specific properties', () => {
      const powerup = powerupFactor.create(PowerUpType.FFTBottom);
      expect(powerup).toHaveProperty('drawBehavior');
      expect(powerup.drawBehavior).toHaveProperty('edge', 'bottom');
      // Check for specific properties unique to FFTBottom enemy
    });
  });
});
