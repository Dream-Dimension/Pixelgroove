import type * as p5 from 'p5';
import { injectable, inject } from 'tsyringe';
import IP5Instance, { IP5InstanceName } from '../interfaces/IP5Instance';

export enum ColorTheme {
  Red = 'Red',
  Blue = 'Blue',
  Green = 'Green',
  Yellow = 'Yellow',
  Purple = 'Purple',
  Orange = 'Orange',
  White = 'White',
  // Add more themes here as needed
}

interface IParticle {
  position: p5.Vector
  velocity: p5.Vector
  acceleration: p5.Vector
  lifespan: number
  size: number
  color: p5.Color
}

interface IParticleSystem {
  setColorTheme: (theme: ColorTheme) => void
  addRandomParticle: (x: number, y: number) => void
  addExplosion: (x: number, y: number, count?: number, lifespan?: number) => void
  addFountain: (x: number, y: number, angle?: number, count?: number) => void
  update: () => void
  draw: () => void
}

@injectable()
class ParticleSystem implements IParticleSystem {
  private readonly particles: IParticle[];
  private themesInitialized: boolean = false;
  private colorTheme: p5.Color[] = [];
  private readonly themes: { [key in ColorTheme]: p5.Color[] } = {
    [ColorTheme.Red]: [],
    [ColorTheme.Blue]: [],
    [ColorTheme.Green]: [],
    [ColorTheme.Yellow]: [],
    [ColorTheme.Purple]: [],
    [ColorTheme.Orange]: [],
    [ColorTheme.White]: []
    // Initialize more themes here
  };

  constructor (@inject(IP5InstanceName) private readonly p5Instance: IP5Instance) {
    this.particles = [];
    this.initializeThemes();
  }

  private initializeThemes (): void {
    const sketch = this.p5Instance?.sketch;
    if (sketch == null) {
      console.log('sketch null');
      return;
    }

    // Initialize color themes with different shades
    this.themes[ColorTheme.Red] = [
      sketch.color(255, 0, 0), sketch.color(200, 0, 0), sketch.color(150, 0, 0),
      sketch.color(255, 100, 100), sketch.color(200, 50, 50)
    ];
    this.themes[ColorTheme.Blue] = [
      sketch.color(0, 0, 255), sketch.color(0, 0, 200), sketch.color(0, 0, 150),
      sketch.color(100, 100, 255), sketch.color(50, 50, 200)
    ];
    this.themes[ColorTheme.Green] = [
      sketch.color(0, 255, 0), sketch.color(0, 200, 0), sketch.color(0, 150, 0),
      sketch.color(100, 255, 100), sketch.color(50, 200, 50)
    ];
    this.themes[ColorTheme.Yellow] = [
      sketch.color(255, 255, 0), sketch.color(200, 200, 0), sketch.color(150, 150, 0),
      sketch.color(255, 255, 100), sketch.color(200, 200, 50)
    ];
    this.themes[ColorTheme.Purple] = [
      sketch.color(128, 0, 128), sketch.color(153, 50, 204), sketch.color(75, 0, 130),
      sketch.color(147, 112, 219), sketch.color(186, 85, 211)
    ];
    this.themes[ColorTheme.Orange] = [
      sketch.color(255, 165, 0), sketch.color(255, 140, 0), sketch.color(255, 69, 0),
      sketch.color(255, 99, 71), sketch.color(255, 127, 80)
    ];
    this.themes[ColorTheme.White] = [
      sketch.color(255), sketch.color(240), sketch.color(225),
      sketch.color(210), sketch.color(195), sketch.color(180)
    ];
    // Add more theme initializations here
    this.themesInitialized = true;
  }

  public setColorTheme (theme: ColorTheme): void {
    this.colorTheme = this.themes[theme];
  }

  private getRandomColorFromTheme (): p5.Color {
    if (this.p5Instance?.sketch == null) {
      throw new Error('p5 sketch undefined in get color from theme');
    }

    // Initialize themes if not done already
    if (!this.themesInitialized) {
      this.initializeThemes();
    }

    const themeToUse = this.colorTheme.length > 0 ? this.colorTheme : this.themes[ColorTheme.White];

    if (themeToUse.length === 0) {
      return this.p5Instance.sketch.color(255); // Fallback to plain white
    }

    const index = Math.floor(this.p5Instance.sketch.random(themeToUse.length));

    const selectedColor = themeToUse[index];
    return selectedColor;
  }

  private createParticle (x: number, y: number, velocity: p5.Vector, size: number, color: p5.Color, lifespan = 255): IParticle {
    if (this.p5Instance.sketch == null) {
      throw new Error('Sketch instance is null.');
    }

    const position = this.p5Instance.sketch.createVector(x, y);
    const acceleration = this.p5Instance.sketch.createVector(0, 0.05); // Default gravity
    return { position, velocity, acceleration, lifespan, size, color };
  }

  public addRandomParticle (x: number, y: number): void {
    if (this.p5Instance.sketch == null) {
      return;
    }

    const velocity = this.p5Instance.sketch.createVector(this.p5Instance.sketch.random(-1, 1), this.p5Instance.sketch.random(-1, -5));
    const size = this.p5Instance.sketch.random(10, 20);
    const color = this.getRandomColorFromTheme();

    this.particles.push(this.createParticle(x, y, velocity, size, color));
  }

  public addExplosion (x: number, y: number, count: number = 10, lifespan = 255): void {
    if (this.p5Instance.sketch == null) {
      return;
    }

    for (let i = 0; i < count; i++) {
      const angle = this.p5Instance.sketch.random(this.p5Instance.sketch.TWO_PI);
      const speed = this.p5Instance.sketch.random(1, 6);
      const velocity = this.p5Instance.sketch.createVector(Math.cos(angle) * speed, Math.sin(angle) * speed);
      const size = this.p5Instance.sketch.random(5, 10);
      const color = this.getRandomColorFromTheme();

      this.particles.push(this.createParticle(x, y, velocity, size, color, lifespan));
    }
  }

  public addFountain (x: number, y: number, angle: number = 90, count: number = 5): void {
    if (this.p5Instance.sketch == null) {
      return;
    }

    for (let i = 0; i < count; i++) {
      // Convert angle to radians and calculate velocity components
      const angleRadians = this.p5Instance.sketch.radians(angle);
      const speed = this.p5Instance.sketch.random(2, 5); // Adjust speed as needed
      const velocity = this.p5Instance.sketch.createVector(
        Math.cos(angleRadians) * speed,
        Math.sin(angleRadians) * speed
      );

      const size = this.p5Instance.sketch.random(5, 15);
      const color = this.getRandomColorFromTheme();

      this.particles.push(this.createParticle(x, y, velocity, size, color));
    }
  }

  public update (): void {
    if (this.p5Instance.sketch == null) {
      return;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.velocity.add(p.acceleration);
      p.position.add(p.velocity);
      p.lifespan -= 2;

      // Check if particle is off the screen (you can adjust the condition if needed)
      if (p.position.x < 0 || p.position.x > this.p5Instance.sketch.width ||
          p.position.y < 0 || p.position.y > this.p5Instance.sketch.height ||
          p.lifespan < 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public draw (): void {
    if (this.p5Instance.sketch == null) {
      return;
    }

    this.p5Instance.sketch.noStroke();
    for (const p of this.particles) {
      const color = p.color as any;
      this.p5Instance.sketch.fill(
        color.levels[0],
        color.levels[1],
        color.levels[2],
        p.lifespan
      );
      this.p5Instance.sketch.ellipse(p.position.x, p.position.y, p.size, p.size);
    }
  }
}

export default ParticleSystem;
export type { IParticleSystem };
export const ParticleSystemName = Symbol.for('ParticleSystem');
