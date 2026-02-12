# CLAUDE.md

This file provides guidance for AI assistants working with the rn-swiper-list codebase.

## Project Overview

rn-swiper-list is a high-performance, Tinder-like swipe card component for React Native. It uses:
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
└── index.ts             # Type exports and main entry point
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
- Card indices passed to callbacks represent position in the **original data array**, not sliced data
- Data is sliced with `.slice(clampedInitialIndex)` for rendering, but refs array covers all data

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

## Commands

```bash
# Install dependencies (uses Yarn workspaces)
yarn

# Run example app
yarn example start
yarn example android
yarn example ios

# Quality checks
yarn typecheck    # TypeScript type checking
yarn lint         # ESLint
yarn test         # Jest unit tests

# Build library
yarn prepare      # Builds via react-native-builder-bob

# Release
yarn release      # Uses release-it for versioning
```

## Testing

Unit tests are in `src/__tests__/`. Due to the complexity of mocking react-native-reanimated and gesture-handler, tests focus on calculation logic rather than component rendering:
- `prerenderItems` calculation
- `initialIndex` data slicing
- Index mapping for callbacks

## Common Modifications

### Adding a New Swipe Direction
1. Add callback prop type in `src/index.ts` (`SwiperOptions` and `SwiperCardOptions`)
2. Add spring config prop and disable prop
3. Implement swipe method in `SwiperCard/index.tsx` (follow pattern of `swipeRight`)
4. Add overlay label support if needed
5. Expose via `useImperativeHandle` in both Swiper and SwiperCard
6. Add to `useSwipeControls.ts` hook

### Modifying Animation Behavior
- Spring configs are passed as props (e.g., `swipeRightSpringConfig`)
- Default spring config: `{ damping: 20, stiffness: 50, mass: 1, overshootClamping: true }`
- Rotation uses `interpolate()` with configurable input/output ranges

### Adding New Props
1. Add to `SwiperOptions<T>` type in `src/index.ts`
2. If passed to cards, also add to `SwiperCardOptions<T>`
3. Destructure in component and pass down as needed
4. Update README.md documentation

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

3. **Loop mode**: When `loop=true` and reaching the end, all cards reset via `swipeBack()` on each ref

4. **Flip requires content**: `flipCard()` only works if `FlippedContent` prop is provided

5. **GestureHandlerRootView**: Must wrap the app/screen - the swiper won't work without it

6. **virtualizeCards limitations**: When enabled, `swipeBack()` only works for the last 3 swiped cards (cards beyond that are unmounted)

7. **Scale clamping**: The `indexDiff` used for scale calculation is clamped to minimum 0 to prevent swiped cards from becoming larger than the active card
