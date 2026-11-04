import { createRef, useCallback, useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import type { SwiperCardInternalRefType } from '../internalTypes';
import { clampInitialIndex } from '../utils';

type SwipeMethodName = 'swipeRight' | 'swipeLeft' | 'swipeTop' | 'swipeBottom';

const useSwipeControls = <T>(
  data: readonly T[],
  loop: boolean = false,
  initialIndex: number = 0,
  swipeBackStartIndex: number = initialIndex
) => {
  const dataLength = data.length;
  const clampedInitialIndex = clampInitialIndex(initialIndex, dataLength);
  const clampedSwipeBackStartIndex = Math.max(
    0,
    Math.min(swipeBackStartIndex, clampedInitialIndex)
  );
  const activeIndex = useSharedValue(clampedInitialIndex);

  const refs = useMemo(
    () =>
      Array.from({ length: dataLength }, () =>
        createRef<SwiperCardInternalRefType>()
      ),
    [dataLength]
  );

  /** Move every card back to its initial (or restored) position. */
  const resetAfterLoop = useCallback(() => {
    activeIndex.set(clampedInitialIndex);
    refs.forEach((ref) => ref.current?.resetAfterLoop());
  }, [activeIndex, clampedInitialIndex, refs]);

  const swipe = useCallback(
    (method: SwipeMethodName) => {
      const card = refs[Math.floor(activeIndex.get())]?.current;
      // The card may be unmounted when `virtualizeCards` is enabled.
      if (!card) return;
      // Pass `false` so the card does not increment activeIndex as well;
      // the controller owns the index update for imperative swipes.
      card[method](false);
      activeIndex.set(activeIndex.get() + 1);
    },
    [activeIndex, refs]
  );

  const swipeRight = useCallback(() => swipe('swipeRight'), [swipe]);
  const swipeLeft = useCallback(() => swipe('swipeLeft'), [swipe]);
  const swipeTop = useCallback(() => swipe('swipeTop'), [swipe]);
  const swipeBottom = useCallback(() => swipe('swipeBottom'), [swipe]);

  const flipCard = useCallback(() => {
    refs[Math.floor(activeIndex.get())]?.current?.flipCard();
  }, [activeIndex, refs]);

  const swipeBack = useCallback(() => {
    const previousIndex = Math.floor(activeIndex.get()) - 1;

    if (!loop && previousIndex < clampedSwipeBackStartIndex) {
      return;
    }

    // Wrap around to the last card when looping
    const targetIndex =
      previousIndex < clampedSwipeBackStartIndex
        ? dataLength - 1
        : previousIndex;

    // ref.current is null when the card is unmounted (virtualizeCards)
    const card = refs[targetIndex]?.current;
    if (card) {
      card.swipeBack();
      activeIndex.set(targetIndex);
    }
  }, [activeIndex, refs, loop, clampedSwipeBackStartIndex, dataLength]);

  return {
    activeIndex,
    refs,
    resetAfterLoop,
    swipeRight,
    swipeLeft,
    swipeBack,
    swipeTop,
    swipeBottom,
    flipCard,
  };
};

export default useSwipeControls;
