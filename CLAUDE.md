# CLAUDE.md

This file provides guidance for AI assistants working with the @psync/rn-swiper codebase.

## Project Overview

@psync/rn-swiper is a high-performance, Tinder-like swipe card component for React Native. It uses:
- **react-native-reanimated** (v4+) for smooth UI thread animations
- **react-native-gesture-handler** (v3+, hook API) for gesture detection
- **react-native-worklets** (v0.5+) for thread-safe callback execution between UI and JS threads
- **React 19+** (`ref` is a regular prop; no `forwardRef`)

## Architecture

### Core Components

```
src/
├── Swiper.tsx           # Main component - manages card stack, data slicing, refs
├── SwiperCard/
│   ├── index.tsx        # Individual card with gestures, animations, flip support
│   └── OverlayLabel.tsx # Animated overlay labels (like/dislike indicators)
├── hooks/
│   └── useSwipeControls.ts  # Shared value management, imperative methods
├── utils.ts             # Pure (worklet-safe) logic: index math, render range, swipe direction
├── types.ts             # Public type definitions (SwiperOptions, SwiperProps, SwiperCardOptions, etc.)
├── internalTypes.ts     # Internal ref types (not exported to consumers)
└── index.ts             # Barrel entry point - re-exports Swiper and public types only
```

### Key Patterns

**1. Thread Safety with Worklets**
All callbacks between UI and JS threads use `scheduleOnUI` and `scheduleOnRN` from react-native-worklets to prevent race conditions:
```typescript
// `swipeTo` is a worklet: gestures call it directly on the UI thread,
// imperative ref methods call scheduleOnUI(swipeTo, 'right', false)
translateX.set(
  withSpring(target, config, () => {
    // Fires when the swipe-out animation finishes
    if (onSwipeRight) scheduleOnRN(onSwipeRight, index);
  })
);
if (shouldUpdateActiveIndex) activeIndex.set(activeIndex.get() + 1);
```

**2. Shared Values for Animation State** (always use `.get()` / `.set()`, not `.value` — React Compiler compatible, enforced by `react-hooks` lint rules)
- `activeIndex` - SharedValue tracking current visible card
- `translateX/translateY` - SharedValue for card position during drag
- `isFlipped` - SharedValue for card flip state

**3. Ref as a Prop (React 19)**
Both `Swiper` and `SwiperCard` receive `ref` as a regular prop and expose imperative methods with `useImperativeHandle`:
```typescript
ref.current?.swipeRight()
ref.current?.swipeLeft()
ref.current?.swipeBack()
ref.current?.flipCard()
```

**4. Gesture Handler 3 hooks**
`SwiperCard` uses `usePanGesture` / `useTapGesture` composed with `useCompetingGestures`. Inline callbacks in these config objects are auto-workletized by the worklets Babel plugin; functions created with `useCallback` that run on the UI thread need an explicit `'worklet'` directive. Pan decisions happen in `onDeactivate` (it has `translationX`/`velocityX`; `onFinalize` does not) via `resolveSwipeDirection()` from `utils.ts`.

Do not pass dependency arrays to `useAnimatedReaction` — Reanimated 4 ignores them on native and warns; the Babel plugin captures closures.

### Important Implementation Details

**Index Handling**
- `initialIndex` prop allows starting from any card (clamped to valid range)
- `restoredSwipes` prop seeds previously swiped cards offscreen on mount (persisted session restore)
- Card indices passed to callbacks represent position in the **original data array**, not sliced data
- Data is sliced with `.slice(firstRenderedIndex)` for rendering, where `firstRenderedIndex` accounts for restored swipes; refs array covers all data

**Prerendering**
- `prerenderItems` controls how many cards are rendered ahead (default: `Math.max(data.length - 1, 1)`)
- Cards outside prerender range have `opacity: 0` via animated styles
- This prevents mounting all cards at once while keeping transitions smooth

**Virtualization (virtualizeCards prop)**
- When `virtualizeCards={true}`, only cards within a dynamic render range are actually mounted
- Render range (`getVirtualizedRenderRange` in `utils.ts`): `[max(activeIndex - SWIPE_BACK_BUFFER, firstRenderedIndex), activeIndex + prerenderItems + 1]`
- `SWIPE_BACK_BUFFER = 3` (exported from `utils.ts`) allows swipeBack for the last 3 swiped cards
- Range updates via `useAnimatedReaction` + `scheduleOnRN(updateRenderRange, start, end)`
- Recommended for large datasets (100+ cards) to reduce memory usage

**Z-Index Management**
- Cards are rendered in reverse order (`.reverse()`) so first data items appear on top
- Each card has `zIndex: -index` to maintain proper stacking

**Restored Swipe Session (restoredSwipes prop)**
- `restoredSwipes` is a mount-only prop (like `initialIndex`); live updates after mount are not supported
- `restoredSwipeDirections` is a `Map<number, SwiperSwipeDirection>` built via `useMemo` from the prop, keyed by original data index
- `firstRenderedIndex` walks backwards from `clampedInitialIndex - 1` through the continuous restored sequence to find the earliest card that must be rendered
- Restored cards are seeded offscreen via `getRestoredTranslateX/Y` initial values in their `useSharedValue` calls — no swipe method is called on them, so callbacks never fire
- `swipeBack()` can rewind through the restored sequence down to `firstRenderedIndex`
- On loop reset, each card's `resetAfterLoop()` restores it to its offscreen restored position (not center), so loop mode is consistent with restored state

## Commands

```bash
# Install dependencies (uses Bun workspaces)
bun install

# Run example app
bun --cwd example start
bun --cwd example android
bun --cwd example ios

# Quality checks
bun check            # Type checking (alias: bun run typecheck) — prefer over tsc
bun run lint         # ESLint 10 (eslint .)
bun run test         # Jest 30 (unit + component tests)

# Build library
bun run prepare      # Builds via react-native-builder-bob (alias: bun x bob build)

# Release
bun run release      # Uses release-it for versioning
```

## Testing

Tests are in `src/__tests__/`:
- `utils.test.ts` — pure logic imported from `src/utils.ts` (index clamping, prerender count, restored swipes, virtualized render range, `resolveSwipeDirection`). Test the real functions; never re-implement logic inline in tests.
- `Swiper.test.tsx` — renders `<Swiper>` with React Native Testing Library 14 (`await render(...)`, async `act`) and drives gestures with `createGestureController(getByGestureTestId('swiper-card-pan-<index>'))` from `react-native-gesture-handler/jest-utils`. Use fake timers and `jest.advanceTimersByTimeAsync(5000)` so springs finish and `onSwipe*` callbacks fire.

Jest setup: `@react-native/jest-preset`, `react-native-reanimated/jest/resolver` (worklets run on the web implementation), RNGH `jestSetup.js`, and `jest.setup.js` (Reanimated `setUpTests()` + a stub for `getUIRuntimeHolder`, which RNGH 3 calls but the worklets web implementation does not support). `babel.config.js` enables `react-native-worklets/plugin` in the `test` env only.

## Tooling Notes

- **TypeScript 7** has no JS API yet. `typescript` is aliased to `@typescript/typescript6` (for typescript-eslint), and `@typescript/native` provides the TS 7 `tsc`, which bob uses (`tsc` option in the bob config).
- **ESLint 10**: `@react-native/eslint-config` only declares ESLint ^8 || ^9. `eslint.config.mjs` reuses its flat config, swaps `@babel/eslint-parser` for `@typescript-eslint/parser`, drops the Flow block, and wraps legacy plugins with `fixupConfigRules`. It also enables `eslint-plugin-react-hooks` `recommended-latest` (React Compiler rules).
- **Bun workspaces**: the root `workspaces: ["example"]` is required by `react-native-monorepo-config` in `example/metro.config.js`.
- **`bunfig.toml` `minimumReleaseAge`** (3 days) blocks very recent releases; pick the newest version older than that.

## Common Modifications

### Adding a New Swipe Direction
1. Add callback prop type in `src/types.ts` (`SwiperOptions` and `SwiperCardOptions`)
2. Add spring config prop and disable prop
3. Add the direction to `SwiperSwipeDirection`, `getSwipeTranslation()` and `resolveSwipeDirection()` in `utils.ts`, and to the `swipeTo` worklet in `SwiperCard/index.tsx` (ref methods keep the `shouldUpdateActiveIndex` parameter)
4. Add overlay label support if needed
5. Expose via `useImperativeHandle` in both Swiper and SwiperCard (the card's imperative handle uses the internal type from `internalTypes.ts`)
6. Add to `useSwipeControls.ts` hook via `swipe('<method>')` (calls the card method with `false`; the controller owns the index update)

### Modifying Animation Behavior
- Spring configs are passed as props (e.g., `swipeRightSpringConfig`)
- Default spring config: `{ damping: 20, stiffness: 50, mass: 1, overshootClamping: true }`
- Rotation uses `interpolate()` with configurable input/output ranges

### Adding New Props
0. Pure logic goes in `src/utils.ts` (add a `'worklet'` directive if it runs on the UI thread) with tests in `utils.test.ts`
1. Add to `SwiperOptions<T>` type in `src/types.ts`
2. If passed to cards, also add to `SwiperCardOptions<T>` in `src/types.ts`
3. Destructure in component and pass down as needed
4. Update README.md documentation
5. `src/index.ts` is a barrel only — never define types or implementation there; add them to focused files and re-export

## Performance Considerations

- **Avoid reading shared values during render** (`.get()` included) - use `useDerivedValue` or `useAnimatedStyle`
- **Use `scheduleOnRN`/`scheduleOnUI`** for cross-thread communication, never `runOnJS` directly
- **Limit `prerenderItems`** for large datasets to reduce initial render cost
- **Use `virtualizeCards={true}`** for large datasets (100+ cards) to reduce memory usage
- **Memoize render functions** passed as props (`renderCard`, `FlippedContent`)
- Card styles use `withTiming` for smooth opacity/scale transitions

## Gotchas

1. **Double index offset bug**: When using `initialIndex`, don't add it again in callbacks - the `actualIndex` passed to SwiperCard already accounts for it

2. **Animation callback timing**: `onSwipe*` direction callbacks fire from the `withSpring` completion callback, i.e. when the swipe-out animation finishes (~2s with the default spring). `onIndexChange` fires immediately

3. **Loop mode**: When `loop=true` and `activeIndex` reaches `data.length` (by gesture or ref method), a `useAnimatedReaction` in `Swiper` calls the controller's `resetAfterLoop()`, which sets `activeIndex` back to `initialIndex` and calls `resetAfterLoop()` on every card ref (restored cards return to their offscreen restored position, not center). `onSwipedAll` is not called in loop mode

4. **Flip requires content**: `flipCard()` only works if `FlippedContent` prop is provided

5. **GestureHandlerRootView**: Must wrap the app/screen - the swiper won't work without it

6. **virtualizeCards limitations**: When enabled, `swipeBack()` only works for the last 3 swiped cards (cards beyond that are unmounted). The render range never starts before `firstRenderedIndex`

7. **Scale clamping**: The `indexDiff` used for scale calculation is clamped to minimum 0 to prevent swiped cards from becoming larger than the active card

8. **Double-increment prevention**: Imperative swipes from the controller call card methods with `shouldUpdateActiveIndex = false`, then the controller increments `activeIndex` itself (synchronously on the JS thread, so rapid taps target consecutive cards). Gesture-driven swipes call the `swipeTo` worklet with `true`. Never have both the card and the controller increment `activeIndex` for the same swipe.
