# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Features

- The library is compiled with the React Compiler (`babel-plugin-react-compiler` 1.0) before publishing. Apps get the memoization without enabling the compiler.
- When the active card changes, the cards behind it scale up and fade in over 250 ms instead of jumping. Respects the system reduce-motion setting.

### Bug Fixes

- A card that is flying off no longer swallows touches meant for the next card: you can grab the next card immediately. Only the active card receives touches (`pointerEvents`).
- Taps on a card that is flying off, or on cards behind the active one, no longer call `onPress`.
- Swiping the active card with a ref method while it is being dragged no longer snaps it back to the finger or swipes a second card on release.

### Performance

- Gestures of inactive cards are disabled natively through Gesture Handler 3's shared-value `enabled` option, without a re-render.
- The window size is read once in `Swiper` instead of in every card.

## [2.0.0](https://github.com/New-Elysium/rn-swiper-list/compare/v1.1.0...v2.0.0) (2026-11-04)

### ⚠ BREAKING CHANGES

- Requires `react-native-gesture-handler` >= 3.4. Card gestures use the Gesture Handler 3 hook API (`usePanGesture`, `useTapGesture`, `useCompetingGestures`).
- Requires `react` >= 19.3 and `react-native` >= 0.88. `Swiper` takes `ref` as a regular prop; `forwardRef` is no longer used.
- Requires `react-native-reanimated` >= 4.5 and `react-native-worklets` >= 0.13. Peer dependency ranges are now enforced instead of `*`.
- Spring props are typed as `SwiperSpringConfig` (Reanimated's public `WithSpringConfig`) instead of a type deep-imported from Reanimated internals.
- Default translate, rotate and overlay ranges follow the window size (`useWindowDimensions`) instead of the screen size captured at import time.

### Features

- New exported types: `SwiperProps<T>` (props plus `ref`) and `SwiperSpringConfig`.
- Render props (`renderCard`, `FlippedContent`, `OverlayLabel*`) may return any `ReactNode`.
- Card gestures have Gesture Handler test IDs (`swiper-card-pan-<index>`, `swiper-card-tap-<index>`) for use with `react-native-gesture-handler/jest-utils`.
- Gesture-driven swipes start their animation on the UI thread directly, removing a JS-thread round trip.
- Shared values use `get()`/`set()`, which the React Compiler supports.

### Bug Fixes

- Perfectly horizontal drags (no vertical movement, e.g. mouse or trackpad) now swipe left/right instead of snapping back.
- Loop mode now resets for gesture swipes, not only for ref methods.
- `virtualizeCards` with `initialIndex` no longer mounts unswiped cards centered on top of the stack.
- `onIndexChange` and `onSwipedAll` always call the latest callback instead of the one from the first render.
- `onSwipeStart` and `onSwipeEnd` always fire in pairs, and only for the active card.
- Removed a duplicated `onFinalize` handler; the first one was dead code.

### Chores

- Upgraded to React Native 0.88.1, React 19.3.1, Gesture Handler 3.4.0, Reanimated 4.7.1, Worklets 0.13.1, Expo SDK 58, ESLint 10, Jest 30, TypeScript 7 and Node 26 LTS.
- Type checking uses `bun check`. TypeScript 7 provides `tsc`, and `typescript` is aliased to `@typescript/typescript6` for tools that still need the TS 6 JS API (typescript-eslint).
- Component tests render `Swiper` with React Native Testing Library 14 and drive it with Gesture Handler's gesture controller.
- CI uses Bun instead of Yarn, which had no lockfile.
- Example app: restored the `workspaces` setup it needs to bundle, added the missing `@expo/vector-icons` dependency, and fixed the 0 px card width.

## [1.0.0](https://github.com/Skipperlla/rn-swiper-list) (2025-07-09)

### Features

- Initial release
- Tinder-like swipe card component for React Native
- Built with react-native-reanimated and react-native-gesture-handler
- Support for card flipping, overlay labels, and swipe callbacks
- Loop mode and restored swipe session support
- Virtualized rendering for large datasets
