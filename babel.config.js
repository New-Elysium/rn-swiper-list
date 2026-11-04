module.exports = {
  overrides: [
    {
      exclude: /\/node_modules\//,
      presets: ['module:react-native-builder-bob/babel-preset'],
    },
    {
      include: /\/node_modules\//,
      presets: ['module:@react-native/babel-preset'],
    },
  ],
  env: {
    // The published library ships un-workletized source; the consuming app's
    // Babel setup (babel-preset-expo or react-native-worklets/plugin) handles
    // it. Tests need the plugin to mirror that.
    test: {
      plugins: ['react-native-worklets/plugin'],
    },
  },
};
