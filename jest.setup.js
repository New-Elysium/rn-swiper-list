// Reanimated test helpers: fake-timer driven animations and
// `toHaveAnimatedStyle` matchers. Worklets run on the web implementation via
// the `react-native-reanimated/jest/resolver` configured in package.json.
require('react-native-reanimated').setUpTests();

// react-native-gesture-handler 3.x calls `getUIRuntimeHolder()` while
// installing its UI-runtime bindings. The worklets web implementation used in
// Jest throws for it, so provide a stub and keep everything else real.
jest.mock('react-native-worklets', () => ({
  ...jest.requireActual('react-native-worklets'),
  getUIRuntimeHolder: () => ({}),
}));
