import 'reflect-metadata';
import { container } from 'tsyringe';
import type ISetup from '../interfaces/ISetup';
import CentralControl from './CentralControl';
import Logger from '../utils/Logger';
import GameManager from '../managers/GameManager';
import VideoAnalyzer from '../system/VideoAnalyzer';
import type ILogger from '../interfaces/ILogger';
import { ILoggerName } from '../interfaces/ILogger';
import type IGameManager from '../interfaces/IGameManager';
import { IGameManagerName } from '../interfaces/IGameManager';
import type IVideoAnalyzer from '../interfaces/IVideoAnalyzer';
import { IVideoAnalyzerName } from '../interfaces/IVideoAnalyzer';
import type IVideoPlayer from '../interfaces/IVideoPlayer';
import { IVideoPlayerName } from '../interfaces/IVideoPlayer';
import VideoPlayer from '../system/VideoPlayer';
import type IP5Instance from '../interfaces/IP5Instance';
import { IP5InstanceName } from '../interfaces/IP5Instance';
import P5Instance from '../libs/P5Instance';
import type IMediaModel from '../interfaces/IMediaModel';
import BlazeModel, { BlazeModelName } from '../system/models/BlazeModel';
import type ISoundAnalyzer from '../interfaces/ISoundAnalyzer';
import { ISoundAnalyzerName } from '../interfaces/ISoundAnalyzer';
import type IFace from '../interfaces/IFace';
import type IVideoMetadataStore from '../interfaces/IVideoMetadataStore';
import { IVideoMetadataStoreName } from '../interfaces/IVideoMetadataStore';
import VideoMetadataStore from '../system/VideoMetadataStore';
import type IDrawBehavior from '../interfaces/IDrawBehavior';
import DrawSimpleFeatureDebug, { DrawSimpleFeatureDebugName } from '../behaviors/DrawSimpleFeatureDebug';
import DrawPowerUp, { DrawPowerUpName } from '../behaviors/DrawPowerUp';
import { type IDrawBehaviorParams } from '../interfaces/IDrawBehavior';
import type IFactory from '../interfaces/IFactory';
import { type EnemyType, type PowerUpType } from '../interfaces/IFactory';
import PowerUpFactory, { PowerUpFactoryName } from '../factories/PowerUpFactory';
import PowerUpManager, { PowerUpManagerName } from '../managers/PowerUpManager';
import type IPlayerShip from '../interfaces/IPlayerShip';
import { PlayerShipName } from '../interfaces/IPlayerShip';
import PlayerShip from '../game_objects/PlayerShip';
import type IMovementBehavior from '../interfaces/IMovementBehavior';
import type IRectangle from '../interfaces/IRectangle';
import { IRectangleName } from '../interfaces/IRectangle';
import Rectangle from '../game_objects/geometry/Rectangle';
import { DEFAULT_SHAPE_SIZE, ShapeDefaultSizeName } from '../interfaces/IShape';
import FollowMouseMovement, { FollowMouseMovementName } from '../behaviors/FollowMouseMovement';
import type IDrawShapesBehavior from '../interfaces/IDrawShapesBehavior';
import DrawFFTOnEdges, { DrawFFTOnEdgesName } from '../behaviors/DrawFFTOnEdges';
import type IDrawFFTOnEdges from '../interfaces/IDrawFFTOnEdges';
import EnemyFactory, { EnemyFactoryName } from '../factories/EnemyFactory';
import EnemyManager, { EnemyManagerName } from '../managers/EnemyManager';
import UserInputDrivenMovement, { UserInputDrivenMovementName } from '../behaviors/UserInputDrivenMovement';
import DrawShapesBase, { DrawShapesBaseName } from '../behaviors/DrawShapesBase';
import SimpleMovement, { SimpleMovementName } from '../behaviors/SimpleMovement';
import type IPlayerStats from '../interfaces/IPlayerStats';
import { IPlayerStatsName } from '../interfaces/IPlayerStats';
import PlayerStats from './PlayerStats';
import { type IGameAgent, IGameAgentName } from '../interfaces/IGameAgent';
import GameAgent from '../game_objects/GameAgent';
import { type IEnemyManager } from '../interfaces/IEnemyManager';
import InputManager, { InputManagerName } from '../system/InputManager';
import type IControlsConfigurator from '../interfaces/IControlsConfigurator';
import { IControlsConfiguratorName } from '../interfaces/IControlsConfigurator';
import ControlsConfigurator from './ControlsConfigurator';
import { type IPowerUpManager } from '../interfaces/IPowerUpManager';
import CocoModel, { CocoModelName } from '../system/models/CocoModel';
import type IObjectedDetected from '../interfaces/IObjectDetected';
import type ICircle from '../interfaces/ICircle';
import { ICircleName } from '../interfaces/ICircle';
import Circle from '../game_objects/geometry/Circle';
import type ITriangle from '../interfaces/ITriangle';
import { ITriangleName } from '../interfaces/ITriangle';
import Triangle from '../game_objects/geometry/Triangle';
import DrawBlinds, { DrawBlindsName } from '../behaviors/DrawBlinds';
import PosenetModel, { PosenetModelName } from '../system/models/PosenetModel';
import type IPose from '../interfaces/IPose';
import DrawPoseDebug, { DrawPoseDebugName } from '../behaviors/DrawPoseDebug';
import DrawShip, { DrawShipName } from '../behaviors/DrawShip';
import ParticleSystem, { type IParticleSystem, ParticleSystemName } from '../managers/ParticleSystem';
import DrawPose, { DrawPoseName } from '../behaviors/DrawPose';

/**
* Sets-up dependencies and loads the app.
*/
class Setup implements ISetup {
  init = async (): Promise<void> => {
    // Special singleton instance  covering multiple interfaces:
    container.registerSingleton(VideoPlayer);
    container.register<IVideoPlayer>(IVideoPlayerName, { useFactory: _container => _container.resolve(VideoPlayer) });
    container.register<ISoundAnalyzer>(ISoundAnalyzerName, { useFactory: _container => _container.resolve(VideoPlayer) });

    // System
    container.registerSingleton<IMediaModel<IFace[]>>(BlazeModelName, BlazeModel);
    container.registerSingleton<IMediaModel<IObjectedDetected[]>>(CocoModelName, CocoModel);
    container.registerSingleton<IMediaModel<IPose[]>>(PosenetModelName, PosenetModel);

    container.registerSingleton<IVideoMetadataStore>(IVideoMetadataStoreName, VideoMetadataStore);

    // Third Party:
    container.registerSingleton<IP5Instance>(IP5InstanceName, P5Instance);

    // Utils:
    container.registerSingleton<ILogger>(ILoggerName, Logger);
    container.registerSingleton(InputManagerName, InputManager);

    // Factories
    container.registerSingleton<IFactory<PowerUpType>>(PowerUpFactoryName, PowerUpFactory);
    container.registerSingleton<IFactory<EnemyType>>(EnemyFactoryName, EnemyFactory);

    // Managers:
    container.registerSingleton<IPowerUpManager>(PowerUpManagerName, PowerUpManager);
    container.registerSingleton<IEnemyManager>(EnemyManagerName, EnemyManager);
    container.registerSingleton<IParticleSystem>(ParticleSystemName, ParticleSystem);

    // Core:
    container.register<IGameManager>(IGameManagerName, { useClass: GameManager });
    container.register<IVideoAnalyzer>(IVideoAnalyzerName, { useClass: VideoAnalyzer });
    container.register<IControlsConfigurator>(IControlsConfiguratorName, { useClass: ControlsConfigurator });
    container.registerSingleton<IPlayerStats>(IPlayerStatsName, PlayerStats);

    // Game Objects:
    container.register<IGameAgent>(IGameAgentName, { useClass: GameAgent });
    container.registerSingleton<IPlayerShip>(PlayerShipName, PlayerShip);

    // Shapes:
    container.register(ShapeDefaultSizeName, { useValue: DEFAULT_SHAPE_SIZE });
    container.register<IRectangle>(IRectangleName, { useClass: Rectangle });
    container.register<ICircle>(ICircleName, { useClass: Circle });
    container.register<ITriangle>(ITriangleName, { useClass: Triangle });

    // Behaviors
    container.register<IDrawBehavior<IFace[] | IObjectedDetected[]>>(DrawSimpleFeatureDebugName, { useClass: DrawSimpleFeatureDebug });
    container.register<IDrawBehavior<IPose[]>>(DrawPoseDebugName, { useClass: DrawPoseDebug });
    container.register<DrawShapesBase>(DrawPoseName, { useClass: DrawPose });

    container.register<IDrawFFTOnEdges>(DrawFFTOnEdgesName, { useClass: DrawFFTOnEdges });
    container.register<IDrawShapesBehavior<IDrawBehaviorParams>>(DrawShapesBaseName, { useClass: DrawShapesBase });
    container.register<IDrawShapesBehavior<IDrawBehaviorParams>>(DrawShipName, { useClass: DrawShip });

    container.register<IDrawShapesBehavior<IDrawBehaviorParams>>(DrawPowerUpName, { useClass: DrawPowerUp });
    container.register<IDrawShapesBehavior<IDrawBehaviorParams>>(DrawBlindsName, { useClass: DrawBlinds });
    container.register<IMovementBehavior>(SimpleMovementName, { useClass: SimpleMovement });

    container.register<IMovementBehavior>(FollowMouseMovementName, { useClass: FollowMouseMovement });
    container.register<IMovementBehavior>(UserInputDrivenMovementName, { useClass: UserInputDrivenMovement });

    // Start the app:
    const centralControl = container.resolve(CentralControl);
    centralControl.init();
  };
}

export default Setup;
