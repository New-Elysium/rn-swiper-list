import { fixupConfigRules } from '@eslint/compat';
import reactNativeConfig from '@react-native/eslint-config/flat';
import tsParser from '@typescript-eslint/parser';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * ESLint 10 flat config.
 *
 * `@react-native/eslint-config/flat` officially supports ESLint ^8 || ^9.
 * ESLint 10 support is pending upstream (react/react-native#59071); until it
 * ships we apply the same adjustments locally:
 * - `@babel/eslint-parser@7` crashes on ESLint 10, so JS/JSX files are parsed
 *   with `@typescript-eslint/parser` instead (this project contains no Flow).
 * - The Flow-only block (`eslint-plugin-ft-flow`) is dropped.
 * - Legacy plugins that still use removed rule-context APIs are wrapped with
 *   `fixupConfigRules` from `@eslint/compat`.
 */
const reactNative = reactNativeConfig
  .filter((config) => !config.plugins?.['ft-flow'])
  .map((config) =>
    config.languageOptions?.parser?.meta?.name === '@babel/eslint-parser'
      ? {
          ...config,
          languageOptions: { ...config.languageOptions, parser: tsParser },
        }
      : config
  );

export default defineConfig([
  globalIgnores(['**/node_modules/', 'lib/', 'example/dist/', '**/.expo/']),
  ...fixupConfigRules(reactNative),
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly' },
    },
  },
  // React Compiler-aware rules (rules-of-hooks, purity, refs, immutability, ...).
  // The plugin itself is already registered by the React Native config.
  { rules: reactHooks.configs.flat['recommended-latest'].rules },
  prettierRecommended,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },
]);
