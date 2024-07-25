import type * as p5 from 'p5';
import { inject, injectable } from 'tsyringe';
import InputManager, { GameInputType, InputManagerName } from '../system/InputManager';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';
import Localizer from '../utils/Localizer';
import type IControlsConfigurator from '../interfaces/IControlsConfigurator';
import type GoBackCb from '../types/GoBackCb';
import { Palette } from '../utils/Theme';

@injectable()
class ControlsConfigurator implements IControlsConfigurator {
  private isActive = false;
  private exitBtn: p5.Element | undefined;
  private clearConfigBtn: p5.Element | undefined;

  private goBackCb: GoBackCb = () => {};
  private feedBackText: p5.Element | undefined;
  private readonly controllersDetectedText: p5.Element | undefined;
  private upBtn: p5.Element | undefined;
  private downBtn: p5.Element | undefined;
  private leftBtn: p5.Element | undefined;
  private rightBtn: p5.Element | undefined;
  private shootBtn: p5.Element | undefined;
  private startBtn: p5.Element | undefined;
  private pauseBtn: p5.Element | undefined;

  constructor (
    @inject(IP5InstanceName) private readonly p5Instance: IP5Instance,
    @inject(InputManagerName) private readonly inputManager: InputManager
  ) {
    console.log('ControlsConfigurator');
  }

  public draw = (): void => {
    if (!this.isActive) {
      return;
    }
    console.log('draw');
  };

  public load = (goBackCb: GoBackCb = () => {}): void => {
    this.goBackCb = goBackCb;
    this.isActive = true;
    this.addUI();
  };

  private readonly addUI = (): void => {
    const buttonsHeight = 60;
    let currentButtonY = 10;
    const currentButtonX = 10;
    this.exitBtn = this.p5Instance.sketch?.createButton(Localizer.t('exit'));
    this.exitBtn?.position(currentButtonX, currentButtonY += buttonsHeight);
    this.exitBtn?.mouseClicked(this.unload);

    this.clearConfigBtn = this.p5Instance.sketch?.createButton(Localizer.t('clearAllControlMappings'));
    this.clearConfigBtn?.position(currentButtonX, currentButtonY += buttonsHeight);
    this.clearConfigBtn?.mouseClicked(() => {
      this.feedBackText?.html(Localizer.t('clearedAllControlMappings'));
      this.feedBackText?.style('color', Palette.blue);
      this.feedBackText?.style('background-color', Palette.white);

      this.inputManager.clearAllMappings();
    });

    this.feedBackText = this.p5Instance.sketch?.createDiv('-----------------------------------------------------------------');
    this.feedBackText?.position(currentButtonX, currentButtonY + buttonsHeight / 2);

    this.upBtn = this.p5Instance.sketch?.createButton(Localizer.t('up'));
    this.upBtn?.mouseClicked(() => {
      this.startMappingAction(GameInputType.Up);
    });
    this.upBtn?.position(currentButtonX, currentButtonY += buttonsHeight);

    this.downBtn = this.p5Instance.sketch?.createButton(Localizer.t('down'));
    this.downBtn?.mouseClicked(() => {
      this.startMappingAction(GameInputType.Down);
    });
    this.downBtn?.position(currentButtonX, currentButtonY += buttonsHeight);

    this.rightBtn = this.p5Instance.sketch?.createButton(Localizer.t('right'));
    this.rightBtn?.mouseClicked(() => {
      this.startMappingAction(GameInputType.Right);
    });
    this.rightBtn?.position(currentButtonX, currentButtonY += buttonsHeight);

    this.leftBtn = this.p5Instance.sketch?.createButton(Localizer.t('left'));
    this.leftBtn?.mouseClicked(() => {
      this.startMappingAction(GameInputType.Left);
    });
    this.leftBtn?.position(currentButtonX, currentButtonY += buttonsHeight);

    this.shootBtn = this.p5Instance.sketch?.createButton(Localizer.t('shoot'));
    this.shootBtn?.mouseClicked(() => {
      this.startMappingAction(GameInputType.Fire);
    });
    this.shootBtn?.position(currentButtonX, currentButtonY += buttonsHeight);

    this.startBtn = this.p5Instance.sketch?.createButton(Localizer.t('start'));
    this.startBtn?.mouseClicked(() => {
      this.startMappingAction(GameInputType.Start);
    });
    this.startBtn?.position(currentButtonX, currentButtonY += buttonsHeight);

    this.pauseBtn = this.p5Instance.sketch?.createButton(Localizer.t('pause'));
    this.pauseBtn?.mouseClicked(() => {
      this.startMappingAction(GameInputType.Pause);
    });
    this.pauseBtn?.position(currentButtonX, currentButtonY += buttonsHeight);
  };

  private readonly startMappingAction = (actionName: string): void => {
    this.feedBackText?.html(Localizer.t('pressAnyKeyOrButton'));
    this.feedBackText?.style('color', Palette.white);
    this.feedBackText?.style('background-color', Palette.black);

    this.inputManager.stopLearningMode();
    this.inputManager.recordAllRestingInputValues(); // TODO: only do it once or until clearAllValues is pressed?
    this.inputManager.startLearningMode(actionName, {
      onFirstInput: (type, indexOrKey) => {
        console.log('First Mapped Input', type, indexOrKey, this.inputManager.getMappingSummaryForAction(actionName));
        this.feedBackText?.html(type + ' ' + indexOrKey);
        this.feedBackText?.style('color', Palette.blue);
        this.feedBackText?.style('background-color', Palette.white);
      },
      onDone: (name) => {
        this.feedBackText?.html(Localizer.t('doneMapping') + ': ' + name);
        this.feedBackText?.style('color', Palette.powerUpBaseColor);
        this.feedBackText?.style('background-color', Palette.black);
      }
    });
  };

  public unload = (): void => {
    this.inputManager.stopLearningMode();
    this.inputManager.saveMappingsToLocalStorage();
    // TODO unsub event types:
    this.isActive = false;
    this.exitBtn?.remove();
    this.upBtn?.remove();
    this.downBtn?.remove();
    this.leftBtn?.remove();
    this.rightBtn?.remove();
    this.shootBtn?.remove();
    this.startBtn?.remove();
    this.pauseBtn?.remove();
    this.feedBackText?.remove();

    this.clearConfigBtn?.remove();
    this.goBackCb();
  };

  public update = (): void => {
    if (!this.isActive) {
      return;
    }
    console.log('update');
  };
};

export default ControlsConfigurator;
