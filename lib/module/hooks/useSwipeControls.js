"use strict";

import { createRef, useCallback, useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';
const useSwipeControls = (data, loop = false, initialIndex = 0, swipeBackStartIndex = initialIndex) => {
  // Validate and clamp initialIndex to valid range
  const clampedInitialIndex = Math.max(0, Math.min(initialIndex, data.length - 1));
  const clampedSwipeBackStartIndex = Math.max(0, Math.min(swipeBackStartIndex, clampedInitialIndex));
  const activeIndex = useSharedValue(clampedInitialIndex);
  const dataLength = data.length;
  const refs = useMemo(() => {
    let cardRefs = [];
    for (let i = 0; i < data.length; i++) {
      cardRefs.push(/*#__PURE__*/createRef());
    }
    return cardRefs;
  }, [data]);
  const updateActiveIndex = useCallback(() => {
    if (loop && activeIndex.value >= dataLength - 1) {
      // Reset all cards to initial position for loop
      activeIndex.value = clampedInitialIndex;
      refs.forEach(ref => {
        ref?.current?.resetAfterLoop();
      });
    } else {
      activeIndex.value++;
    }
  }, [activeIndex, loop, refs, clampedInitialIndex, dataLength]);
  const swipeRight = useCallback(() => {
    const currentIndex = Math.floor(activeIndex.value);
    // Check ref.current exists (card is mounted, relevant when virtualizeCards is enabled)
    if (!refs[currentIndex]?.current) {
      return;
    }
    // Pass false to prevent the card from double-incrementing activeIndex;
    // the controller owns the index update below.
    refs[currentIndex]?.current?.swipeRight(false);
    updateActiveIndex();
  }, [refs, updateActiveIndex, activeIndex]);
  const swipeTop = useCallback(() => {
    const currentIndex = Math.floor(activeIndex.value);
    if (!refs[currentIndex]?.current) {
      return;
    }
    refs[currentIndex]?.current?.swipeTop(false);
    updateActiveIndex();
  }, [refs, updateActiveIndex, activeIndex]);
  const swipeLeft = useCallback(() => {
    const currentIndex = Math.floor(activeIndex.value);
    if (!refs[currentIndex]?.current) {
      return;
    }
    refs[currentIndex]?.current?.swipeLeft(false);
    updateActiveIndex();
  }, [refs, updateActiveIndex, activeIndex]);
  const swipeBottom = useCallback(() => {
    const currentIndex = Math.floor(activeIndex.value);
    if (!refs[currentIndex]?.current) {
      return;
    }
    refs[currentIndex]?.current?.swipeBottom(false);
    updateActiveIndex();
  }, [refs, updateActiveIndex, activeIndex]);
  const flipCard = useCallback(() => {
    const currentIndex = Math.floor(activeIndex.value);
    if (!refs[currentIndex]?.current) {
      return;
    }
    refs[currentIndex]?.current?.flipCard();
  }, [activeIndex, refs]);
  const swipeBack = useCallback(() => {
    const previousIndex = activeIndex.value - 1;
    if (!loop && (previousIndex < clampedSwipeBackStartIndex || !refs[previousIndex])) {
      return;
    }

    // Handle looping for swipe back
    const targetIndex = previousIndex < clampedSwipeBackStartIndex ? dataLength - 1 : previousIndex;

    // Check both ref exists and ref.current is available (card is mounted)
    // When virtualizeCards is enabled, ref.current may be null if card is outside render range
    if (refs[targetIndex]?.current) {
      refs[targetIndex]?.current?.swipeBack();
      activeIndex.value = targetIndex;
    }
  }, [activeIndex, refs, loop, clampedSwipeBackStartIndex, dataLength]);
  return {
    activeIndex,
    refs,
    swipeRight,
    swipeLeft,
    swipeBack,
    swipeTop,
    swipeBottom,
    flipCard
  };
};
export default useSwipeControls;
//# sourceMappingURL=useSwipeControls.js.map