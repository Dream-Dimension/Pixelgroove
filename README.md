# Pixelgroove


Pixelgroove transforms your music videos into dynamic, interactive shooter experiences. The game analyzes the visual elements and rhythms of your videos, creating unique gameplay challenges for each track.



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

# Code Structure

Using electron (plus tsyringe and p5.js) and so *main.ts*, *renderer.ts*, *preload.js* and *core/Setup.ts* are the "entry points" for the codebase.
