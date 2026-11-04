/**
 * Used by bob (`configFile: true` in the module target) and by Jest.
 *
 * - The library is compiled with the React Compiler, as recommended for
 *   libraries: https://react.dev/reference/react-compiler/compiling-libraries
 *   `panicThreshold: 'all_errors'` fails the build instead of silently
 *   skipping a component the compiler cannot handle.
 *   Set `RN_SWIPER_REACT_COMPILER=0` to build or test without it.
 * - The published library ships un-workletized source; the consuming app's
 *   Babel setup (babel-preset-expo or react-native-worklets/plugin) handles
 *   it. Tests need the plugin to mirror that. It runs after the compiler,
 *   like it does in an app consuming the compiled output.
 */
module.exports = (api) => {
  const useReactCompiler = process.env.RN_SWIPER_REACT_COMPILER !== '0';
  const isTest = api.env('test');
  api.cache.using(() => `${useReactCompiler}-${isTest}`);

  return {
    overrides: [
      {
        exclude: /\/node_modules\//,
        presets: ['module:react-native-builder-bob/babel-preset'],
        plugins: [
          useReactCompiler && [
            'babel-plugin-react-compiler',
            {
              target: '19',
              panicThreshold: 'all_errors',
              // Test files are not part of the library
              sources: (filename) => !filename.includes('__tests__'),
            },
          ],
          isTest && 'react-native-worklets/plugin',
        ].filter(Boolean),
      },
      {
        include: /\/node_modules\//,
        presets: ['module:@react-native/babel-preset'],
      },
    ],
  };
};
