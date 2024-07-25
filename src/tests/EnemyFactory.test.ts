import 'reflect-metadata';
import { container, instanceCachingFactory } from 'tsyringe';
import EnemyFactory from '../factories/EnemyFactory';
import type IFactory from '../interfaces/IFactory';
import { EnemyType } from '../interfaces/IFactory';
import type IP5Instance from '../interfaces/IP5Instance';
import { IP5InstanceName } from '../interfaces/IP5Instance';
import { ISoundAnalyzerName } from '../interfaces/ISoundAnalyzer';

describe('EnemyFactory', () => {
  let enemyFactory: IFactory<EnemyType>;
  let mockP5Instance: IP5Instance;

  beforeEach(() => {
    // Mock dependencies
    mockP5Instance = {
      height: () => { return 100; },
      width: () => { return 100; },
      // @ts-expect-error - p5 is a mock
      sketch: {
      }
    };

    const mockSoundAnalyzer = {
    };

    // Setup dependency injection
    container.register(IP5InstanceName, { useFactory: instanceCachingFactory(() => mockP5Instance) });
    container.register(ISoundAnalyzerName, { useFactory: instanceCachingFactory(() => mockSoundAnalyzer) });
    enemyFactory = container.resolve(EnemyFactory);
  });

  describe('create method', () => {
    it('should create FFTTop enemy with specific properties', () => {
      const enemy = enemyFactory.create(EnemyType.FFTTop);
      expect(enemy).toHaveProperty('drawBehavior');
      expect(enemy.drawBehavior).toHaveProperty('edge', 'top');
      // Add more property checks specific to FFTTop enemy
    });

    it('should create FFTBottom enemy with specific properties', () => {
      const enemy = enemyFactory.create(EnemyType.FFTBottom);
      expect(enemy).toHaveProperty('drawBehavior');
      expect(enemy.drawBehavior).toHaveProperty('edge', 'bottom');
      // Check for specific properties unique to FFTBottom enemy
    });
  });
});
