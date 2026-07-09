# CLAUDE.md

This file provides guidance for AI assistants working with the @psync/rn-swiper codebase.

## Project Overview

@psync/rn-swiper is a high-performance, Tinder-like swipe card component for React Native. It uses:
- **react-native-reanimated** (v3+) for smooth UI thread animations
- **react-native-gesture-handler** for gesture detection
- **react-native-worklets** for thread-safe callback execution between UI and JS threads

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
├── types.ts             # Public type definitions (SwiperOptions, SwiperCardOptions, etc.)
├── internalTypes.ts     # Internal ref types (not exported to consumers)
└── index.ts             # Barrel entry point - re-exports Swiper and public types only
```

### Key Patterns

**1. Thread Safety with Worklets**
All callbacks between UI and JS threads use `scheduleOnUI` and `scheduleOnRN` from react-native-worklets to prevent race conditions:
```typescript
// UI thread animation setup
scheduleOnUI(() => {
  translateX.value = withSpring(maxCardTranslation, config, () => {
    // Callback executes AFTER animation is set up
    if (onSwipeRight) scheduleOnRN(onSwipeRight, index);
  });
  activeIndex.value++;
});
```

**2. Shared Values for Animation State**
- `activeIndex` - SharedValue tracking current visible card
- `translateX/translateY` - SharedValue for card position during drag
- `isFlipped` - SharedValue for card flip state

**3. Forward Ref Pattern**
Both `Swiper` and `SwiperCard` use `forwardRef` to expose imperative methods:
```typescript
ref.current?.swipeRight()
ref.current?.swipeLeft()
ref.current?.swipeBack()
ref.current?.flipCard()
```

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
- Render range: `[activeIndex - SWIPE_BACK_BUFFER, activeIndex + prerenderItems + 1]`
- `SWIPE_BACK_BUFFER = 3` allows swipeBack for the last 3 swiped cards
- Range updates via `useAnimatedReaction` + `scheduleOnRN(setRenderRange)`
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
- On loop reset, `resetAfterLoop()` restores cards to their offscreen restored position (not center), so loop mode is consistent with restored state

## Commands

```bash
# Install dependencies (uses Bun workspaces)
bun install

# Run example app
bun --cwd example start
bun --cwd example android
bun --cwd example ios

# Quality checks
bun run typecheck    # TypeScript type checking
bun run lint         # ESLint
bun run test         # Jest unit tests

# Build library
bun run prepare      # Builds via react-native-builder-bob (alias: bun x bob build)

# Release
bun run release      # Uses release-it for versioning
```

## Testing

Unit tests are in `src/__tests__/`. Due to the complexity of mocking react-native-reanimated and gesture-handler, tests focus on calculation logic rather than component rendering:
- `prerenderItems` calculation
- `initialIndex` data slicing
- Index mapping for callbacks
- Restored swipe session calculations (`firstRenderedIndex`, `restoredSwipeDirections`)
- Imperative swipe index-update flow (controller owns the increment, card receives `false`)
- Loop reset behavior via `resetAfterLoop()`

## Common Modifications

### Adding a New Swipe Direction
1. Add callback prop type in `src/types.ts` (`SwiperOptions` and `SwiperCardOptions`)
2. Add spring config prop and disable prop
3. Implement swipe method in `SwiperCard/index.tsx` (follow pattern of `swipeRight`, including the `shouldUpdateActiveIndex` parameter)
4. Add overlay label support if needed
5. Expose via `useImperativeHandle` in both Swiper and SwiperCard (the card's imperative handle uses the internal type from `internalTypes.ts`)
6. Add to `useSwipeControls.ts` hook (call the card method with `false` and let `updateActiveIndex()` own the index update)

### Modifying Animation Behavior
- Spring configs are passed as props (e.g., `swipeRightSpringConfig`)
- Default spring config: `{ damping: 20, stiffness: 50, mass: 1, overshootClamping: true }`
- Rotation uses `interpolate()` with configurable input/output ranges

### Adding New Props
1. Add to `SwiperOptions<T>` type in `src/types.ts`
2. If passed to cards, also add to `SwiperCardOptions<T>` in `src/types.ts`
3. Destructure in component and pass down as needed
4. Update README.md documentation
5. `src/index.ts` is a barrel only — never define types or implementation there; add them to focused files and re-export

## Performance Considerations

- **Avoid accessing `.value` during render** - use `useDerivedValue` or `useAnimatedStyle`
- **Use `scheduleOnRN`/`scheduleOnUI`** for cross-thread communication, never `runOnJS` directly
- **Limit `prerenderItems`** for large datasets to reduce initial render cost
- **Use `virtualizeCards={true}`** for large datasets (100+ cards) to reduce memory usage
- **Memoize render functions** passed as props (`renderCard`, `FlippedContent`)
- Card styles use `withTiming` for smooth opacity/scale transitions

## Gotchas

1. **Double index offset bug**: When using `initialIndex`, don't add it again in callbacks - the `actualIndex` passed to SwiperCard already accounts for it

2. **Animation callback timing**: Callbacks fire after animation setup, not after animation completes (by design for race condition prevention)

3. **Loop mode**: When `loop=true` and reaching the end, all cards reset via `resetAfterLoop()` on each ref (restored cards return to their offscreen restored position, not center)

4. **Flip requires content**: `flipCard()` only works if `FlippedContent` prop is provided

5. **GestureHandlerRootView**: Must wrap the app/screen - the swiper won't work without it

6. **virtualizeCards limitations**: When enabled, `swipeBack()` only works for the last 3 swiped cards (cards beyond that are unmounted)

7. **Scale clamping**: The `indexDiff` used for scale calculation is clamped to minimum 0 to prevent swiped cards from becoming larger than the active card

8. **Double-increment prevention**: Imperative swipes from the controller call card methods with `shouldUpdateActiveIndex = false`, then the controller calls `updateActiveIndex()` itself. Gesture-driven swipes use the default `true`. Never have both the card and the controller increment `activeIndex` for the same swipe.
