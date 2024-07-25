import type * as p5 from 'p5';
import { Palette } from '../utils/Theme';

export const styleButton = (
  button: p5.Element | undefined,
  fontSize = 16,
  padding = 5,
  border = 'none',
  normalBackgroundColor = Palette.black,
  hoverBackgroundColor = Palette.gray,
  normalTextColor = Palette.white,
  hoverTextColor = Palette.black
): void => {
  if (button == null) return;

  // Style for normal state
  button.style('background-color', normalBackgroundColor);
  button.style('color', normalTextColor);
  button.style('border', border);
  button.style('padding', `${padding}px`);
  button.style('font-size', `${fontSize}px`);

  // Style for mouseover (hover) state
  button.mouseOver(() => {
    button.style('background-color', hoverBackgroundColor);
    button.style('color', hoverTextColor);
  });

  // Style for mouseout (non-hover) state
  button.mouseOut(() => {
    button.style('background-color', normalBackgroundColor);
    button.style('color', normalTextColor);
  });
};

const UI = {
  styleButton
};

export default UI;
