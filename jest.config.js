module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    "**/src/**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  // Rest of your Jest configuration
};