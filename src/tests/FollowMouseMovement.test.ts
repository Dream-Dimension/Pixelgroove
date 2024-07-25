import * as p5 from 'p5';
import 'reflect-metadata';
import { container } from 'tsyringe';
import type IP5Instance from '../interfaces/IP5Instance';
import FollowMouseMovement from '../behaviors/FollowMouseMovement';
import { IP5InstanceName } from '../interfaces/IP5Instance';

jest.mock('p5');

describe('FollowMouseMovement', () => {
  let followMouseMovement: FollowMouseMovement;
  let mockP5Instance: IP5Instance;

  beforeEach(() => {
    // Mock the p5 instance
    mockP5Instance = {
      // @ts-expect-error - p5 is a mock
      sketch: {
        mouseX: 0,
        mouseY: 0
      }
    };

    // Register the mock with tsyringe
    container.registerInstance(IP5InstanceName, mockP5Instance);

    // Instantiate the class
    followMouseMovement = container.resolve(FollowMouseMovement);
  });

  // test('init does not to throw errors', () => {
  //   expect(() => { followMouseMovement.init(); }).not.toThrow();
  // });

  test('position getter and setter', () => {
    const newPosition = new p5.Vector(10, 20);
    followMouseMovement.position = newPosition;
    expect(followMouseMovement.position).toEqual(newPosition);
  });

  test('update method updates position based on mouse coordinates', () => {
    // @ts-expect-error - p5 is a mock
    mockP5Instance.sketch.mouseX = 100;
    // @ts-expect-error - p5 is a mock
    mockP5Instance.sketch.mouseY = 200;
    followMouseMovement.update();
    expect(followMouseMovement.position.x).toBe(100);
    expect(followMouseMovement.position.y).toBe(200);
  });

  // test('destroy does not throw errors', () => {
  //   expect(() => { followMouseMovement.destroy(); }).not.toThrow();
  // });
});
