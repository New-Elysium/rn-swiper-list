import { interpolate } from 'react-native-reanimated';

import type { SwiperRestoredSwipe, SwiperSwipeDirection } from './types';

/** Number of already-swiped cards kept mounted for `swipeBack` when virtualizing. */
export const SWIPE_BACK_BUFFER = 3;

/** Clamp `initialIndex` into `[0, dataLength - 1]` (0 for empty data). */
export const clampInitialIndex = (initialIndex: number, dataLength: number) =>
  Math.max(0, Math.min(initialIndex, dataLength - 1));

/**
 * Number of cards to prerender behind the active one, limited by how many
 * cards remain after `initialIndex`. Always at least 1.
 */
export const getAdjustedPrerenderItems = (
  prerenderItems: number,
  dataLength: number,
  initialIndex: number
) => Math.min(prerenderItems, Math.max(dataLength - initialIndex - 1, 1));

/**
 * Build a lookup of restored swipe directions keyed by original data index.
 * Only entries strictly before `initialIndex` (and inside `data`) are kept.
 */
export const buildRestoredSwipeDirections = (
  restoredSwipes: readonly SwiperRestoredSwipe[] | undefined,
  initialIndex: number,
  dataLength: number
) => {
  const directions = new Map<number, SwiperSwipeDirection>();

  restoredSwipes?.forEach(({ index, direction }) => {
    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index < initialIndex &&
      index < dataLength
    ) {
      directions.set(index, direction);
    }
  });

  return directions;
};

/**
 * Earliest card index that must be rendered: walk backwards from
 * `initialIndex` through the continuous restored sequence.
 */
export const getFirstRenderedIndex = (
  restoredSwipeDirections: ReadonlyMap<number, SwiperSwipeDirection>,
  initialIndex: number
) => {
  let restoredIndex = initialIndex - 1;

  while (restoredIndex >= 0 && restoredSwipeDirections.has(restoredIndex)) {
    restoredIndex--;
  }

  return restoredIndex + 1;
};

/**
 * Range of card indices to mount when `virtualizeCards` is enabled.
 * `start` never goes below `firstRenderedIndex`: cards before it were never
 * swiped in this session, so mounting them would show them on top of the
 * stack at the center position.
 */
export const getVirtualizedRenderRange = (
  activeIndex: number,
  prerenderItems: number,
  dataLength: number,
  firstRenderedIndex: number
) => {
  'worklet';
  return {
    start: Math.max(activeIndex - SWIPE_BACK_BUFFER, firstRenderedIndex, 0),
    end: Math.min(activeIndex + prerenderItems + 1, dataLength),
  };
};

/** Offscreen translation for a card that was swiped in `direction`. */
export const getSwipeTranslation = (
  direction: SwiperSwipeDirection | undefined,
  maxTranslationX: number,
  maxTranslationY: number
) => {
  'worklet';
  switch (direction) {
    case 'right':
      return { x: maxTranslationX, y: 0 };
    case 'left':
      return { x: -maxTranslationX, y: 0 };
    case 'bottom':
      return { x: 0, y: maxTranslationY };
    case 'top':
      return { x: 0, y: -maxTranslationY };
    default:
      return { x: 0, y: 0 };
  }
};

export type SwipeDisabledFlags = {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
};

export type ResolveSwipeDirectionInput = {
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
  /** Three-point range, e.g. `[-w / 3, 0, w / 3]`; the outer points are the swipe thresholds. */
  translateXRange: readonly number[];
  translateYRange: readonly number[];
  velocityThreshold: number | undefined;
  disabled: SwipeDisabledFlags;
};

/** `1` once `value` reaches either outer point of a three-point range. */
const thresholdProgress = (value: number, range: readonly number[]) => {
  'worklet';
  return interpolate(value, range as number[], [1, 0, 1], 'clamp');
};

/**
 * Decide which direction (if any) a released pan gesture should swipe the
 * card. Returns `null` when the card should spring back to the center.
 *
 * Order of precedence:
 * 1. Velocity (only when `velocityThreshold` is set): horizontal, then vertical.
 * 2. Vertical distance past the `translateYRange` threshold.
 * 3. Horizontal distance past the `translateXRange` threshold.
 */
export const resolveSwipeDirection = ({
  translationX,
  translationY,
  velocityX,
  velocityY,
  translateXRange,
  translateYRange,
  velocityThreshold,
  disabled,
}: ResolveSwipeDirectionInput): SwiperSwipeDirection | null => {
  'worklet';
  if (velocityThreshold !== undefined) {
    if (Math.abs(velocityX) > velocityThreshold) {
      if (velocityX < 0 && !disabled.left) return 'left';
      if (velocityX > 0 && !disabled.right) return 'right';
    }
    if (Math.abs(velocityY) > velocityThreshold) {
      if (velocityY < 0 && !disabled.top) return 'top';
      if (velocityY > 0 && !disabled.bottom) return 'bottom';
    }
  }

  if (
    translationY !== 0 &&
    thresholdProgress(translationY, translateYRange) >= 1
  ) {
    if (translationY < 0) return disabled.top ? null : 'top';
    return disabled.bottom ? null : 'bottom';
  }

  if (
    translationX !== 0 &&
    thresholdProgress(translationX, translateXRange) >= 1
  ) {
    if (translationX < 0) return disabled.left ? null : 'left';
    return disabled.right ? null : 'right';
  }

  return null;
};
