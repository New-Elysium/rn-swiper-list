"use strict";

import React, { useImperativeHandle, useState } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import { scheduleOnRN } from 'react-native-worklets';
import useSwipeControls from "./hooks/useSwipeControls.js";
import SwiperCard from "./SwiperCard/index.js";
import { jsx as _jsx } from "react/jsx-runtime";
const {
  width: windowWidth,
  height: windowHeight
} = Dimensions.get('screen');
const SWIPE_SPRING_CONFIG = {
  damping: 20,
  stiffness: 50,
  mass: 1,
  overshootClamping: true
};
const Swiper = ({
  data,
  renderCard,
  prerenderItems = Math.max(data.length - 1, 1),
  onSwipeRight,
  onSwipeLeft,
  onSwipedAll,
  onSwipeTop,
  onSwipeBottom,
  onIndexChange,
  cardStyle,
  flippedCardStyle,
  regularCardStyle,
  disableRightSwipe,
  disableLeftSwipe,
  disableTopSwipe,
  disableBottomSwipe,
  translateXRange = [-windowWidth / 3, 0, windowWidth / 3],
  translateYRange = [-windowHeight / 3, 0, windowHeight / 3],
  rotateInputRange = [-windowWidth / 3, 0, windowWidth / 3],
  rotateOutputRange = [-Math.PI / 20, 0, Math.PI / 20],
  inputOverlayLabelRightOpacityRange = [0, windowWidth / 3],
  outputOverlayLabelRightOpacityRange = [0, 1],
  inputOverlayLabelLeftOpacityRange = [0, -(windowWidth / 3)],
  outputOverlayLabelLeftOpacityRange = [0, 1],
  inputOverlayLabelTopOpacityRange = [0, -(windowHeight / 3)],
  outputOverlayLabelTopOpacityRange = [0, 1],
  inputOverlayLabelBottomOpacityRange = [0, windowHeight / 3],
  outputOverlayLabelBottomOpacityRange = [0, 1],
  OverlayLabelRight,
  OverlayLabelLeft,
  OverlayLabelTop,
  OverlayLabelBottom,
  onSwipeStart,
  onSwipeActive,
  onSwipeEnd,
  swipeBackXSpringConfig = SWIPE_SPRING_CONFIG,
  swipeBackYSpringConfig = SWIPE_SPRING_CONFIG,
  swipeRightSpringConfig = SWIPE_SPRING_CONFIG,
  swipeLeftSpringConfig = SWIPE_SPRING_CONFIG,
  swipeTopSpringConfig = SWIPE_SPRING_CONFIG,
  swipeBottomSpringConfig = SWIPE_SPRING_CONFIG,
  loop = false,
  keyExtractor,
  onPress,
  swipeVelocityThreshold,
  FlippedContent,
  direction = 'y',
  flipDuration = 500,
  overlayLabelContainerStyle,
  initialIndex = 0,
  virtualizeCards = false
}, ref) => {
  // Clamp initialIndex to valid range to prevent out-of-bounds access
  const clampedInitialIndex = Math.max(0, Math.min(initialIndex, data.length - 1));

  // Calculate prerenderItems based on data length from initialIndex
  const adjustedPrerenderItems = Math.min(prerenderItems, Math.max(data.length - clampedInitialIndex - 1, 1));

  // Buffer for swipeBack - keeps cards behind active for undo functionality
  const SWIPE_BACK_BUFFER = 3;

  // Track the range of cards to render when virtualizeCards is enabled
  const [renderRange, setRenderRange] = useState(() => ({
    start: clampedInitialIndex,
    end: Math.min(clampedInitialIndex + adjustedPrerenderItems + 1, data.length)
  }));
  const {
    activeIndex,
    refs,
    swipeRight,
    swipeLeft,
    swipeBack,
    swipeTop,
    swipeBottom,
    flipCard
  } = useSwipeControls(data, loop, clampedInitialIndex);
  useImperativeHandle(ref, () => {
    return {
      swipeLeft,
      swipeRight,
      swipeBack,
      swipeTop,
      swipeBottom,
      flipCard
    };
  }, [swipeLeft, swipeRight, swipeBack, swipeTop, swipeBottom, flipCard]);
  useAnimatedReaction(() => {
    return activeIndex.value >= data.length;
  }, isSwipingFinished => {
    if (isSwipingFinished && onSwipedAll) {
      scheduleOnRN(onSwipedAll);
    }
  }, [data]);

  //Listen to the activeIndex value
  useAnimatedReaction(() => {
    return activeIndex.value;
  }, (currentValue, previousValue) => {
    if (currentValue !== previousValue && onIndexChange) {
      scheduleOnRN(onIndexChange, currentValue);
    }
  }, []);

  // Update render range when activeIndex changes (only used when virtualizeCards is true)
  useAnimatedReaction(() => Math.floor(activeIndex.value), currentActive => {
    if (!virtualizeCards) return;

    // Calculate new render range with buffer for swipeBack
    const newStart = Math.max(currentActive - SWIPE_BACK_BUFFER, 0);
    const newEnd = Math.min(currentActive + adjustedPrerenderItems + 1, data.length);
    scheduleOnRN(() => {
      setRenderRange(prev => {
        // Only update if range actually changed
        if (prev.start !== newStart || prev.end !== newEnd) {
          return {
            start: newStart,
            end: newEnd
          };
        }
        return prev;
      });
    });
  }, [virtualizeCards, adjustedPrerenderItems, data.length, SWIPE_BACK_BUFFER]);
  const Card = SwiperCard;

  // Determine which cards to render based on virtualizeCards setting
  const cardsToRender = virtualizeCards ? data.slice(renderRange.start, renderRange.end) : data.slice(clampedInitialIndex);

  // Calculate the starting index for mapping
  const startIndex = virtualizeCards ? renderRange.start : clampedInitialIndex;
  return cardsToRender.map((item, index) => {
    // Calculate the actual index in the original data array
    const actualIndex = index + startIndex;
    return /*#__PURE__*/_jsx(Card, {
      cardStyle: cardStyle,
      flippedCardStyle: flippedCardStyle,
      regularCardStyle: regularCardStyle,
      index: actualIndex,
      prerenderItems: adjustedPrerenderItems,
      disableRightSwipe: disableRightSwipe,
      disableLeftSwipe: disableLeftSwipe,
      disableTopSwipe: disableTopSwipe,
      disableBottomSwipe: disableBottomSwipe,
      translateXRange: translateXRange,
      translateYRange: translateYRange,
      rotateOutputRange: rotateOutputRange,
      rotateInputRange: rotateInputRange,
      inputOverlayLabelRightOpacityRange: inputOverlayLabelRightOpacityRange,
      outputOverlayLabelRightOpacityRange: outputOverlayLabelRightOpacityRange,
      inputOverlayLabelLeftOpacityRange: inputOverlayLabelLeftOpacityRange,
      outputOverlayLabelLeftOpacityRange: outputOverlayLabelLeftOpacityRange,
      inputOverlayLabelTopOpacityRange: inputOverlayLabelTopOpacityRange,
      outputOverlayLabelTopOpacityRange: outputOverlayLabelTopOpacityRange,
      inputOverlayLabelBottomOpacityRange: inputOverlayLabelBottomOpacityRange,
      outputOverlayLabelBottomOpacityRange: outputOverlayLabelBottomOpacityRange,
      activeIndex: activeIndex,
      OverlayLabelRight: OverlayLabelRight,
      OverlayLabelLeft: OverlayLabelLeft,
      OverlayLabelTop: OverlayLabelTop,
      OverlayLabelBottom: OverlayLabelBottom,
      ref: refs[actualIndex],
      onSwipeRight: cardIndex => {
        onSwipeRight?.(cardIndex);
      },
      onSwipeLeft: cardIndex => {
        onSwipeLeft?.(cardIndex);
      },
      onSwipeTop: cardIndex => {
        onSwipeTop?.(cardIndex);
      },
      onSwipeBottom: cardIndex => {
        onSwipeBottom?.(cardIndex);
      },
      FlippedContent: FlippedContent,
      onSwipeStart: onSwipeStart,
      onSwipeActive: onSwipeActive,
      onSwipeEnd: onSwipeEnd,
      swipeBackXSpringConfig: swipeBackXSpringConfig,
      swipeBackYSpringConfig: swipeBackYSpringConfig,
      swipeRightSpringConfig: swipeRightSpringConfig,
      swipeLeftSpringConfig: swipeLeftSpringConfig,
      swipeTopSpringConfig: swipeTopSpringConfig,
      swipeBottomSpringConfig: swipeBottomSpringConfig,
      onPress: onPress,
      swipeVelocityThreshold: swipeVelocityThreshold,
      item: item,
      direction: direction,
      flipDuration: flipDuration,
      overlayLabelContainerStyle: overlayLabelContainerStyle,
      children: renderCard(item, actualIndex)
    }, keyExtractor ? keyExtractor(item, actualIndex) : actualIndex);
  }).reverse(); // to render cards in same hierarchy as their z-index
};
function fixedForwardRef(render) {
  //@ts-ignore
  return /*#__PURE__*/React.forwardRef(render);
}
export default fixedForwardRef(Swiper);
//# sourceMappingURL=Swiper.js.map