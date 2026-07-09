// Minimal setup for react-native Jest environment
// This replaces react-native/jest/setup.js which uses ESM syntax (import)
// that is incompatible with the current Node.js version.
global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
