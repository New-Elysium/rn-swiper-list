const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://metrobundler.dev/docs/configuration
 *
 * Resolves `@psync/rn-swiper` to the library source (`exports["."].source`)
 * and dedupes its peer dependencies (react, react-native, gesture handler,
 * reanimated, worklets) to the app's copies.
 *
 * @type {import('metro-config').MetroConfig}
 */
module.exports = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
});
