import { I18n } from 'i18n-js';

// Create a class to manage the I18n instance
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class Localizer {
  private static instance: I18n;

  static getInstance (): I18n {
    if (Localizer.instance == null) {
      // TODO: move to json file:
      Localizer.instance = new I18n({
        en: {
          done: 'Done',
          play: 'Play',
          preAnalyzeRecommended: 'Pre-Analyze (Recommended for most videos)',
          preAnalyze: 'Pre-Analyze',
          exit: 'Exit',
          save: 'Save',
          quit: 'Quit',
          goBack: 'Go Back',
          selectVideoPlease: 'Select your video (.mp4). Use WASD to move and SpaceBar to Shoot',
          chooseVideo: 'Choose Video.',
          processingPercentage: 'Processing: %{percentage}%',
          configureControls: 'Configure Controls',
          pressAnyKeyOrButton: 'Press any key, button, etc.',
          clearedAllControlMappings: 'Cleared all previous mappings.',
          up: 'Up',
          down: 'Down',
          left: 'Left',
          right: 'Right',
          shoot: 'Shoot',
          start: 'Start',
          pause: 'Pause',
          paused: 'Paused',
          fps: 'FPS: %{fps}',
          level: 'Level: %{level}',
          score: '🏆Score: %{score}',
          recommendAnalyze: 'To get a better experience, please Pre-Analyze the video or the game might not work!',
          notFullyAnalyzed: 'This video has only been partially analyzed (%{percentage}%)',
          savedPercentage: 'Saved: %{percentage}%',
          saving: 'Saving..',
          gameOver: 'Game Over',
          videoIsFullyAnalyzed: 'This video is fully analyzed and ready to play',
          restarting: 'Restarting..',
          pressStartToContinue: 'Press Start To Continue',
          toggleFullScreen: 'Toggle Full Screen (Experimental)',
          lives: 'Live(s)', // TODO: pluralize
          loading: 'Loading...',
          clearAllControlMappings: 'Clear All Control Mappings',
          doneMapping: 'Done Mapping'
        }
        // ... other languages ...
      });

      Localizer.instance.defaultLocale = 'en';
      Localizer.instance.locale = 'en';
      Localizer.instance.enableFallback = true;
    }

    return Localizer.instance;
  }
}

// Export the getInstance method to access the I18n instance
const instance = Localizer.getInstance();
export default instance;
