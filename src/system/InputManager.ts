import { injectable } from 'tsyringe';
import assert from '../libs/asssert';
import { type UnsubscribeCb } from './EventPublisher';

export enum GameInputType {
  Fire = 'fire',
  Up = 'moveUp',
  Down = 'moveDown',
  Left = 'moveLeft',
  Right = 'moveRight',
  Pause = 'pause',
  Start = 'start'
};

type GamePadType = 'button' | 'axis';
type KeyboardType = 'key';
type ActionName = string; // This can be somethign like 'moveUp', 'moveDown', 'jump', 'shoot', etc.
type InputType = GamePadType | KeyboardType;
type InputIndexOrKey = string; // used to distinguish inputs within the same InputType: like the index of a button or axis. or the letter/key-name.
type InputGuid = string; // What is used to look up the input.  It is the union of the InputType and the identifier: Together: (e.g button:0, axis:1, key:a)

interface InputConfiguration {
  type: 'button' | 'axis' | 'key'
  actionName: ActionName
  inputIndexOrKey: InputIndexOrKey
  rangeIsFlipped?: boolean // If true, the range is flipped. This is used for things like axes that have a negative and positive range.
  activationRange: ActivationRange // the range this action is triggered at.
}

/**
 * The ActivationRange is used to define the range of values that will trigger an action.
 *
 *  Min and Max can be the same for things like buttons or discrete inputs like key presses.
 */
interface ActivationRange {
  start: number
  end: number
}

type ActionCallback = (intensity: number) => void;

/**
 * Options for learning mode.
 *
 * Allows to configure:
 * - whether to stop learning mode after the first input is received.
 * - how long to wait before stopping learning mode if autoStopAfterFirstInput is set to 'delayed'
 * - a callback to call when the first input is received so the client could indicate to the user that the input was received.
 */
interface LearningOptions {
  // If set to immediate, learning mode will stop after the first input is received.
  // If set to delayed, it will stop after autoStopTime ms.
  // If set to never, it will never stop, unless stopLearningMode is called.
  autoStopMode?: 'immediate' | 'delayed' | 'never'
  autoStopTime?: number // Only used if autoStopAfterFirstInput is set to 'delayed', otherwise ignored.
  onFirstInput?: (inputType: InputType, inputIndexOrKey: InputIndexOrKey) => void // TODO: change to a string for first input and last two optional
  // Called when learning mode is stopped.
  onDone?: (actionName: ActionName) => void
}

export const KEY_DOWN_VALUE = 1;
export const KEY_NOT_DOWN_VALUE = 0;
export const DEFAULT_RESTING_INPUT_VALUE = 0;
export const MINIMUM_INTENSITY = 0.1; // we use this / intensity to normalize all renages across same values for the public api
export const MAXIMUM_INTENSITY = 1.0;
export const DEFAULT_LEARNING_MODE_TIMEOUT = 2000; // in miliseconds;
/**
 Overview:

  The InputObserver class is a key component in a system designed to handle and interpret user inputs from various
  sources like keyboards, gamepads, and other input devices. Its primary purpose is to manage the mapping of these
  inputs to specific actions within an application.

Key Components:
- Input Mapping: Manages the association between user inputs (like buttons, axes, keys) and their corresponding actions
  within the application. This mapping is essential for translating physical inputs into meaningful actions in the software context.
- Learning Mode: A unique feature that allows the InputObserver to learn and adapt to user input patterns. In this mode, the class
  records the range and nature of inputs, refining the input-action mapping to enhance user experience.
- Set Resting Input Values: Allows the class to record the resting state of inputs, which is critical for the learning mode to function properly
  with certain controllers.
- Event Handling: Listens to and handles various input-related events, such as key presses or gamepad connections.
  This functionality ensures that the class remains responsive to real-time user interactions.
- Action Invocation: When an input matches a predefined mapping, the corresponding action is triggered.
  This mechanism is vital for the real-time responsiveness of the application to user inputs.

Limitations:
- Concurrency: The class does not inherently support concurrent input handling, which might be a limitation in
  multi-user or multi-threaded scenarios.
- Input Complexity: While capable of handling basic input types, the class might need extension or
  modification to support more complex input devices or patterns.
*/

@injectable()
export default class InputManager {
  // TODO: consider state machine.
  private inputConfigurations: InputConfiguration[] = [];
  private readonly keyboardKeysDown = new Set<string>();
  private restingInputValues = new Map<InputGuid, number>(); // Maps from a hardware input, to the resting input value.
  private readonly actionListeners = new Map<ActionName, ActionCallback[]>();
  private hasRecordedRestingInputValues = false;
  private hasReceivedFirstInput = false;
  private actionBeingLearned: ActionName | null = null; // The action that is currently being learned
  private onLearningModeFinished: (actionName: ActionName) => void = () => {};
  private onFirstInputPressedCallback?: (type: InputType, inputIndexOrKey: InputIndexOrKey) => void;
  private learningModeTimer?: number;

  constructor (
    // TODO: inject logger
  ) {
    this.startPolling();
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
  }

  // Consider a gamepads detected method.
  // returns buttons and axis.

  /**
   * Clears all resting input values previously recorded.
   */
  public clearRestingInputValues (): void { // TODO: consider if this needs to be public since we call it from recordAllRestingInputValues.
    this.restingInputValues.clear();
  }

  public clearAllMappings = (): void => {
    this.inputConfigurations = [];
  };

  /**
   * Adds a a key mapping for a specific action: e.g "a" maps to "moveUp".
   * So when key "a" is pressed, the "moveUp" event gets triggered and any listener
   * regestered to that event gets called.
   */
  public addKeyMapping = (key: InputIndexOrKey, actionName: ActionName): void => {
    this.inputConfigurations.push(this.generateKeyConfig(actionName, key));
  };

  // TODO: move these out of here into ControlsConfigurator or centralControl
  public initializeWASD = (): void => {
    this.addKeyMapping('w', GameInputType.Up);
    this.addKeyMapping('s', GameInputType.Down);
    this.addKeyMapping('a', GameInputType.Left);
    this.addKeyMapping('d', GameInputType.Right);
    this.addKeyMapping('p', GameInputType.Fire);
    this.addKeyMapping(' ', GameInputType.Fire);
  };

  public saveMappingsToLocalStorage = (): void => {
    // TODO: warn if input configs exist already in local storage
    const inputConfigurations = JSON.stringify(this.inputConfigurations);
    localStorage.setItem('inputConfigurations', inputConfigurations);

    const restingInputValues = JSON.stringify(Array.from(this.restingInputValues.entries()));
    localStorage.setItem('restingInputValues', restingInputValues);
  };

  public loadMappingsFromLocalStorage = (): void => {
    // TODO: warn if configs not empty/null
    const inputConfigurations = localStorage.getItem('inputConfigurations');
    const restingInputValues = localStorage.getItem('restingInputValues');
    if (restingInputValues != null) {
      this.restingInputValues.clear();
      this.restingInputValues = new Map<InputGuid, number>(JSON.parse(restingInputValues));
    }
    if (inputConfigurations != null) {
      this.inputConfigurations = JSON.parse(inputConfigurations);
    } else {
      console.log('No input configurations found in local storage.');
      this.initializeWASD();
    }
  };

  /**
   * Returns a pertty text version of the input configuration.
   */
  public getMappingSummaryForAction = (actionName: ActionName): string[] => {
    const configs = this.inputConfigurations.filter(
      (config) => config.actionName !== actionName
    );
    return configs.map((config) => {
      const { type, inputIndexOrKey, activationRange } = config;
      return `${type}:${inputIndexOrKey}, ${activationRange.start} - ${activationRange.end}`;
    });
  };

  /**
   * Returns true if the action is currently active + it's current intensity from: MINIMUM_INTENSITY to MAXINUM_INTENSITY
   * e.g from 0.1 to 1.0
   *
   * Intensity: how much an axis is being pushed (or for buttons, how hard). Normalized to be consistent
   * across all buttons/axis with such properties: e.g 0.1-1.0
   *
   * If no such range exist (start === end), it will default to the MAXIMUM_INTENSITY * scaleFactorForNoRange.
   * Might be useful for keyboard based inputs to allow for more finer control.
   *
   * To reduce it by 20% pass in scaleFactorForNoRange = 0.8. Or to double it pass in scaleFactorForNoRange = 2.0
   * scaleFactorForNoRange is optinal and defaults to 1.0 and so there's no effect on MAXIMUM_INTENSITY by default.
   */
  public getActionStatus = (actionName: ActionName, scaleFactorForNoRange: number = 1.0): { isActive: boolean, value: number } => {
    // Iterate through input configurations
    for (const config of this.inputConfigurations) {
      if (config.actionName === actionName) {
        const { type, inputIndexOrKey, activationRange } = config;
        const value = this.getCurrentInputValue(type, inputIndexOrKey);
        // Check if the value is within the activation range
        if (this.isWithinRange(value, activationRange) &&
            value !== this.getRestingInputValue(type, inputIndexOrKey)) {
          let normalizedValue = this.mapValue(value, activationRange.start, activationRange.end);
          if (activationRange.start === activationRange.end) {
            // the range is non-existent so we can apply a scaling in case the client
            // wants to provide the user with finer control:
            normalizedValue *= scaleFactorForNoRange;
          }
          return { isActive: true, value: normalizedValue };
        }
      }
    }
    // TODO: May neeed to return the real resting value.
    // OR maybe we want another method to get the resting value.
    // But we go with this since it is the best for the typical use case.
    return { isActive: false, value: DEFAULT_RESTING_INPUT_VALUE };
  };

  /**
   * Call to remove all input mappings for a specific action.
   *
   * This is useful to allow  the user to correct a mistake and allows them to remap an action.
   */
  public clearActionMapping = (actionName: ActionName): void => {
    this.inputConfigurations = this.inputConfigurations.filter(
      (config) => config.actionName !== actionName
    );
  };

  /**
   * Records the resting state of all inputs. This is useful for learning mode to work properly.
   * It goes through the gamepads and records the resting state of all buttons and axes.
   *
   * Important to do since many controller inputs have a resting state not equal to zero.
   *
   * In theory it is called when a gamepad is connected but small chance it could be wrong if the user
   * if they connect a gamepad before the game starts OR if they are pressing buttons when the gamepad connects.
   */
  // TODO: consider approaches for auto calling this:
  // right when starting to learning mode. and maybe doing a best guess
  // see what the most likely resting value is.
  // The ui could also do this.. when user presses config for the first time.
  // call this method. Then say "please wait".. "ready".
  public recordAllRestingInputValues = (): void => {
    console.log('Recording resting values');
    this.clearRestingInputValues();
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad != null) {
        this.recordRestingInputValue(gamepad);
      }
    }
    this.hasRecordedRestingInputValues = true;
  };

  /**
   * Let the user interact with buttons/axes on their controller or press a key on their keyboard so
   * we can map that input to specific action.
   *
   * This works best when  recordAllRestingInputValues  has been called first. Since many controller inputs have a resting state not equal to zero
   */
  public startLearningMode = (actionToLearn: ActionName, options?: LearningOptions): void => {
    assert(this.hasRecordedRestingInputValues, 'You should call recordAllRestingInputValues before calling startLearningMode.');
    assert(this.actionBeingLearned == null, 'Learning mode was already active.');
    assert(options?.autoStopMode !== 'delayed' && options?.autoStopTime != null, 'You should not set autoStopTime unless autoStopMode is set to delayed.');
    if (this.actionBeingLearned != null) this.stopLearningMode(); // Stop learning mode if it was alraedy active

    this.hasReceivedFirstInput = false;
    this.actionBeingLearned = actionToLearn;
    const autoStopAfterFirstInput = options?.autoStopMode ?? 'delayed';
    const autoStopDelay = options?.autoStopTime ?? DEFAULT_LEARNING_MODE_TIMEOUT;
    this.onLearningModeFinished = options?.onDone ?? (() => {});
    this.onFirstInputPressedCallback = (inputType, inputIndexOrKey) => {
      options?.onFirstInput?.(inputType, inputIndexOrKey);
      if (autoStopAfterFirstInput === 'immediate') {
        this.stopLearningMode();
      } else if (autoStopAfterFirstInput === 'delayed') {
        // We stop learning mode automatically in a delayed manner to allow full range
        // recording of values for things like axes/joypad movement:
        this.learningModeTimer = window.setTimeout(this.stopLearningMode, autoStopDelay);
      }
    };
  };

  /**
   * This should be called when the user is done recording an input for an action.
   */
  public stopLearningMode = (): void => {
    console.log('Stopping learning mode.');
    if (this.learningModeTimer != null) {
      clearTimeout(this.learningModeTimer);
      this.learningModeTimer = undefined;
    }
    this.onLearningModeFinished?.(this.actionBeingLearned ?? '');

    this.actionBeingLearned = null;
  };

  /**
   * Adds a listener for when a specific action is triggered.
   */
  public addEventListener = (action: ActionName, callback: ActionCallback): UnsubscribeCb => {
    // TODO: add warning if action has no config
    // return way to unsub
    const listeners = this.actionListeners.get(action) ?? [];
    listeners.push(callback);
    this.actionListeners.set(action, listeners);
    return () => {
      this.unsubscribe(action, callback);
    };
  };

  private readonly unsubscribe = (actionName: ActionName, callback: ActionCallback): void => {
    const callbacks = this.actionListeners.get(actionName);
    if (callbacks != null) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  };

  private readonly generateKeyConfig = (actionName: ActionName, key: InputIndexOrKey, min: number = 1, max: number = 1): InputConfiguration => {
    return {
      type: 'key',
      inputIndexOrKey: key,
      actionName,
      activationRange: {
        start: Math.min(min, max),
        end: Math.max(min, max)
      }
    };
  };

  private readonly recordRestingInputValue = (gamepad: Gamepad): void => {
    gamepad.buttons.forEach((button, index) => {
      this.setRestingInputValue('button', index.toString(), button.value);
    });
    gamepad.axes.forEach((axis, index) => {
      this.setRestingInputValue('axis', index.toString(), axis);
    });
  };

  private readonly handleGamepadConnected = (event: GamepadEvent): void => {
    console.log('Gamepads connected');
  };

  private readonly inputLookUpId = (type: InputType, inputIndexOrKey: InputIndexOrKey): InputGuid => {
    return `${type}:${inputIndexOrKey}`;
  };

  private readonly setRestingInputValue = (type: GamePadType, identifier: InputIndexOrKey, value: number): void => {
    const inputLookUpId = this.inputLookUpId(type, identifier);
    this.restingInputValues.set(inputLookUpId, value);
  };

  private readonly startPolling = (): void => {
    const pollGamePadsAndKeyboard = (): void => {
      const gamepads = navigator.getGamepads();
      for (const gamepad of gamepads) {
        if (gamepad != null) {
          this.processGamepadInput(gamepad);
        }
      }
      // Don't need to pull, we know what is down for keyboard:
      this.keyboardKeysDown.forEach(key => {
        this.processInput('key', KEY_DOWN_VALUE, key);
      });

      requestAnimationFrame(pollGamePadsAndKeyboard);
    };
    requestAnimationFrame(pollGamePadsAndKeyboard);
  };

  private readonly processGamepadInput = (gamepad: Gamepad): void => {
    gamepad.buttons.forEach((button, index) => {
      const identifier = index.toString();
      if (button.value !== this.getRestingInputValue('button', identifier)) {
        this.processInput('button', button.value, identifier);
      }
    });

    gamepad.axes.forEach((value, index) => {
      const identifier = index.toString();
      if (value !== this.getRestingInputValue('axis', identifier)) {
        this.processInput('axis', value, identifier);
      }
    });
  };

  private readonly getRestingInputValue = (type: InputType, inputIndexOrKey: InputIndexOrKey): number => {
    const inputLookUpId = this.inputLookUpId(type, inputIndexOrKey);
    return this.restingInputValues.get(inputLookUpId) ?? DEFAULT_RESTING_INPUT_VALUE;
  };

  private readonly processInput = (type: InputType, value: number, inputIndexOrKey: InputIndexOrKey): void => {
    if (this.actionBeingLearned != null) { // Means we are in learning mode
      this.recordInputRange(this.actionBeingLearned, value, type, inputIndexOrKey);
    } else {
      this.triggerAllSatisfiedActions(type, value, inputIndexOrKey);
    }
  };

  private readonly getInputsConfigurations = (type: InputType, inputIndexOrKey: InputIndexOrKey, actionName: ActionName): InputConfiguration[] => {
    return this.inputConfigurations.filter((configuration) => {
      return configuration.type === type &&
      configuration.inputIndexOrKey === inputIndexOrKey &&
      configuration.actionName === actionName;
    });
  };

  /**
   * Records the range of values for a specific input.
   * This is used in learning mode to learn the range of values for a specific input.
   * It create a full range and modifies existing range if it already exists (to expand it if necessary).
   */
  private readonly recordInputRange = (actionName: ActionName, value: number, type: InputType, inputIndexOrKey: InputIndexOrKey): void => {
    console.log('Recording input range', actionName, value, type, inputIndexOrKey);
    if (!this.hasReceivedFirstInput) {
      this.onFirstInputPressedCallback?.(type, inputIndexOrKey);
      this.hasReceivedFirstInput = true;
    }

    // Note: if we have more than one... maybe best to make it into a map instead..
    const configs = this.getInputsConfigurations(type, inputIndexOrKey, actionName);
    assert(configs.length <= 1, 'We should only have one config for each input.');

    let inputConfiguration = configs[0];
    if (inputConfiguration == null) {
      inputConfiguration = { type, inputIndexOrKey, actionName, activationRange: { start: value, end: value } };
      this.inputConfigurations.push(inputConfiguration);
    } else {
      // Note: if both start and end are negative, there is a good chance they should be flipped, the smaller number (more negative value) will be the end value:
      // this can happen if an axis is divided in half and the mid point/ resting position is zero and one range is negative and the other is positive.
      // We have a best guess approach to this see bellow:
      if (inputConfiguration.rangeIsFlipped === true) {
        // We know the range is flipped already from previous rercodings,
        // so we keep them flipped:
        inputConfiguration.activationRange.start = Math.max(inputConfiguration.activationRange.start, value);
        inputConfiguration.activationRange.end = Math.min(inputConfiguration.activationRange.end, value);
      } else if (value < 0 &&
         inputConfiguration.activationRange.start < 0 &&
          inputConfiguration.activationRange.start === inputConfiguration.activationRange.end &&
          value < inputConfiguration.activationRange.start) {
        // This is the tricky path:
        // Check if both start and end are the same, meaning that value is our second recording.
        // if value is less than start&&end, that means value is moving in a more negative direction.
        // So we set the "less negative value" number as the start and the "more negative value" as the end.
        // We also set the rangeIsFlipped to true since we know the range is flipped from now on this check
        // will fail but we still want to keep the start and end flipped for future recordings:
        // aka the start will be less negative than the end value.

        // This assumping is made because an axis/joystick will be at rest, user starts moving that joystick, first value
        // is recorded and it's, as the user keeps moving the joystick, the second value comes in and if it is more negative,
        // we have met our condition for flipping the range.
        inputConfiguration.activationRange.start = Math.max(inputConfiguration.activationRange.start, value);
        inputConfiguration.activationRange.end = Math.min(inputConfiguration.activationRange.end, value);
        inputConfiguration.rangeIsFlipped = true;
      } else {
        // This is the standard path, assuming we are moving from a smaller value to a bigger value.
        // We just gotta make sure the start and end are updated when we see new values.
        inputConfiguration.activationRange.start = Math.min(inputConfiguration.activationRange.start, value);
        inputConfiguration.activationRange.end = Math.max(inputConfiguration.activationRange.end, value);
        inputConfiguration.rangeIsFlipped = false;
      }
    }
  };

  private readonly triggerAllSatisfiedActions = (inputType: InputType, value: number, inputIndexOrKey: InputIndexOrKey): void => {
    for (const configuration of this.inputConfigurations) {
      if (inputType === configuration.type &&
          inputIndexOrKey === configuration.inputIndexOrKey &&
          this.isWithinRange(value, configuration.activationRange) &&
          value !== this.getRestingInputValue(inputType, inputIndexOrKey)) {
        this.triggerAction(configuration.actionName, this.mapValue(value, configuration.activationRange.start, configuration.activationRange.end));
      }
    }
  };

  /**
   * Returns the current value of the input (how much it's bein pressed if at all).
   */
  private readonly getCurrentInputValue = (type: InputType, inputIndexOrKey: InputIndexOrKey): number => {
    if (type === 'key') {
      return this.keyboardKeysDown.has(inputIndexOrKey) ? KEY_DOWN_VALUE : KEY_NOT_DOWN_VALUE;
    } else if (type === 'axis') {
      const axisIndex = parseInt(inputIndexOrKey, 10);
      const gamepads = navigator.getGamepads();
      for (const gamepad of gamepads) {
        if (gamepad != null) {
          const value = gamepad.axes[axisIndex];
          if (value !== undefined) {
            return value;
          }
        }
      }
    } else if (type === 'button') {
      const buttonIndex = parseInt(inputIndexOrKey, 10);
      const gamepads = navigator.getGamepads();
      for (const gamepad of gamepads) {
        if (gamepad != null) {
          const value = gamepad.buttons[buttonIndex]?.value ?? 0;
          return value;
        }
      }
    }
    return 0;
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    this.keyboardKeysDown.add(event.key);
    this.processInput('key', KEY_DOWN_VALUE, event.key);
  };

  private readonly handleKeyup = (event: KeyboardEvent): void => {
    this.keyboardKeysDown.delete(event.key);
  };

  private readonly triggerAction = (action: ActionName, intensity: number): void => {
    const listeners = this.actionListeners.get(action) ?? [];
    for (const listener of listeners) {
      listener(intensity);
    }
  };

  private readonly isWithinRange = (value: number, range: ActivationRange): boolean => {
    // If we have two negative values, they likely were saved.
    // This is a precaution.
    // We are making sure value is actually between min and max regardless of sign.
    const min = Math.min(range.start, range.end);
    const max = Math.max(range.start, range.end);
    return value >= min && value <= max;
  };

  // TODO: consider moving this to a util class
  private readonly mapValue = (value: number, min: number, max: number, targetMin: number = MINIMUM_INTENSITY, targetMax: number = MAXIMUM_INTENSITY): number => {
    if (min === max) return MAXIMUM_INTENSITY; // Default to max possible value if min and max are the same.
    return ((value - min) / (max - min)) * (targetMax - targetMin) + targetMin;
  };
}

export const InputManagerName = Symbol('InputManager');
