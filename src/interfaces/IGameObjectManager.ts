import type GameObject from '../game_objects/GameObject';
import { type IPausable } from './IPausable';

interface IGameObjectManager extends IPausable {
  init: () => void
  update: () => void
  draw: () => void
  destroy: () => void
  checkForCollisionWith: (gameObjects: GameObject[] | GameObject) => boolean
};

export default IGameObjectManager;
