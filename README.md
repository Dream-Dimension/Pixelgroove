# Pixelgroove
[![Video Demo](assets/images/06.jpg)](https://youtu.be/_yfUnCqTTuc?si=khm1DMwF08Fv0SMM)

Pixelgroove transforms your music videos into dynamic, interactive shooter experiences. The game analyzes the visual elements and rhythms of your videos, creating unique gameplay challenges for each track.

Available On: [Steam](https://store.steampowered.com/app/2871570/Pixelgroove)

## [YouTube Video Demo](https://youtu.be/_yfUnCqTTuc?si=khm1DMwF08Fv0SMM)

## Overview
It uses p5.js with out-of-the-box ML models to do object detection, face recognition and pose estimation (via blaze-face, coco, and posenet). 

## (Setup) Configure npm:
Without this you will keep getting erros related to posenet:

npm config set legacy-peer-deps true

## Run: 
npm install --legacy-peer-deps
npm start

# Coding Guidelines 
For coding standards and practices, see the [Coding Guidelines](./CODING_GUIDELINES.md).
Try to follow them to the best of your ability.

# Build the documentation:
npm run make-docs

## To build installer (placed in out/Augmented Media):

npm run make

## Node version:

Node: 18.16.1

### Code Structure

Using electron (plus tsyringe and p5.js) and so *main.ts*, *renderer.ts*, *preload.js* and *core/Setup.ts* are the "entry points" for the codebase.

### Issues:

There are a few known bugs, namely going full screen can cause issues when analyzing (pre-procssing) a video file. Certain video files also seem to cause problems.
Ideally can restrict to mp4 filetype. 

The ML models, like blaze-face, don't often work as well as one would expect. Combining results from posenet and blaze-face to detect faces would be ideal but not implemented.


# Screenshots:

![screenshot](assets/images/01.jpg)
![screenshot](assets/images/02.jpg)
![screenshot](assets/images/03.jpg)
![screenshot](assets/images/04.jpg)
![screenshot](assets/images/05.jpg)