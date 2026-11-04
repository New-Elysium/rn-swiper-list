import { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import useSwipeControls from './hooks/useSwipeControls';
import SwiperCard from './SwiperCard';
import type { SwiperProps, SwiperSpringConfig } from './types';
import {
  buildRestoredSwipeDirections,
  clampInitialIndex,
  getAdjustedPrerenderItems,
  getFirstRenderedIndex,
  getVirtualizedRenderRange,
} from './utils';

const SWIPE_SPRING_CONFIG: SwiperSpringConfig = {
  damping: 20,
  stiffness: 50,
  mass: 1,
  overshootClamping: true,
};

const OVERLAY_OPACITY_OUTPUT_RANGE = [0, 1];

function Swiper<T>(props: SwiperProps<T>) {
  const {
    ref,
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
    translateXRange: translateXRangeProp,
    translateYRange: translateYRangeProp,
    rotateInputRange: rotateInputRangeProp,
    rotateOutputRange: rotateOutputRangeProp,
    inputOverlayLabelRightOpacityRange: inputRightRangeProp,
    outputOverlayLabelRightOpacityRange = OVERLAY_OPACITY_OUTPUT_RANGE,
    inputOverlayLabelLeftOpacityRange: inputLeftRangeProp,
    outputOverlayLabelLeftOpacityRange = OVERLAY_OPACITY_OUTPUT_RANGE,
    inputOverlayLabelTopOpacityRange: inputTopRangeProp,
    outputOverlayLabelTopOpacityRange = OVERLAY_OPACITY_OUTPUT_RANGE,
    inputOverlayLabelBottomOpacityRange: inputBottomRangeProp,
    outputOverlayLabelBottomOpacityRange = OVERLAY_OPACITY_OUTPUT_RANGE,
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
    restoredSwipes,
    virtualizeCards = false,
  } = props;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Default ranges follow the window size; memoized so cards don't re-render.
  const defaultRanges = useMemo(() => {
    const thirdWidth = windowWidth / 3;
    const thirdHeight = windowHeight / 3;
    return {
      translateX: [-thirdWidth, 0, thirdWidth],
      translateY: [-thirdHeight, 0, thirdHeight],
      rotateInput: [-thirdWidth, 0, thirdWidth],
      rotateOutput: [-Math.PI / 20, 0, Math.PI / 20],
      overlayRight: [0, thirdWidth],
      overlayLeft: [0, -thirdWidth],
      overlayTop: [0, -thirdHeight],
      overlayBottom: [0, thirdHeight],
    };
  }, [windowWidth, windowHeight]);

  const translateXRange = translateXRangeProp ?? defaultRanges.translateX;
  const translateYRange = translateYRangeProp ?? defaultRanges.translateY;
  const rotateInputRange = rotateInputRangeProp ?? defaultRanges.rotateInput;
  const rotateOutputRange = rotateOutputRangeProp ?? defaultRanges.rotateOutput;
  const inputOverlayLabelRightOpacityRange =
    inputRightRangeProp ?? defaultRanges.overlayRight;
  const inputOverlayLabelLeftOpacityRange =
    inputLeftRangeProp ?? defaultRanges.overlayLeft;
  const inputOverlayLabelTopOpacityRange =
    inputTopRangeProp ?? defaultRanges.overlayTop;
  const inputOverlayLabelBottomOpacityRange =
    inputBottomRangeProp ?? defaultRanges.overlayBottom;

  const dataLength = data.length;
  const clampedInitialIndex = clampInitialIndex(initialIndex, dataLength);

  const restoredSwipeDirections = useMemo(
    () =>
      buildRestoredSwipeDirections(
        restoredSwipes,
        clampedInitialIndex,
        dataLength
      ),
    [restoredSwipes, clampedInitialIndex, dataLength]
  );

  const firstRenderedIndex = useMemo(
    () => getFirstRenderedIndex(restoredSwipeDirections, clampedInitialIndex),
    [restoredSwipeDirections, clampedInitialIndex]
  );

  const adjustedPrerenderItems = getAdjustedPrerenderItems(
    prerenderItems,
    dataLength,
    clampedInitialIndex
  );

  // Range of cards to mount when virtualizeCards is enabled
  const [renderRange, setRenderRange] = useState(() =>
    getVirtualizedRenderRange(
      clampedInitialIndex,
      adjustedPrerenderItems,
      dataLength,
      firstRenderedIndex
    )
  );

  const updateRenderRange = useCallback((start: number, end: number) => {
    setRenderRange((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end }
    );
  }, []);

  const {
    activeIndex,
    refs,
    resetAfterLoop,
    swipeRight,
    swipeLeft,
    swipeBack,
    swipeTop,
    swipeBottom,
    flipCard,
  } = useSwipeControls(data, loop, clampedInitialIndex, firstRenderedIndex);

  useImperativeHandle(
    ref,
    () => ({
      swipeLeft,
      swipeRight,
      swipeBack,
      swipeTop,
      swipeBottom,
      flipCard,
    }),
    [swipeLeft, swipeRight, swipeBack, swipeTop, swipeBottom, flipCard]
  );

  // Every card swiped: loop back to the start, or notify onSwipedAll.
  // Handles gesture-driven and imperative swipes alike.
  useAnimatedReaction(
    () => activeIndex.get() >= dataLength,
    (isSwipingFinished, wasSwipingFinished) => {
      if (!isSwipingFinished || wasSwipingFinished) return;
      if (loop) {
        scheduleOnRN(resetAfterLoop);
      } else if (onSwipedAll) {
        scheduleOnRN(onSwipedAll);
      }
    }
  );

  useAnimatedReaction(
    () => activeIndex.get(),
    (currentValue, previousValue) => {
      if (currentValue !== previousValue && onIndexChange) {
        scheduleOnRN(onIndexChange, currentValue);
      }
    }
  );

  useAnimatedReaction(
    () => Math.floor(activeIndex.get()),
    (currentActive) => {
      if (!virtualizeCards) return;
      const { start, end } = getVirtualizedRenderRange(
        currentActive,
        adjustedPrerenderItems,
        dataLength,
        firstRenderedIndex
      );
      scheduleOnRN(updateRenderRange, start, end);
    }
  );

  const startIndex = virtualizeCards ? renderRange.start : firstRenderedIndex;
  const cardsToRender = virtualizeCards
    ? data.slice(renderRange.start, renderRange.end)
    : data.slice(firstRenderedIndex);

  return cardsToRender
    .map((item, index) => {
      // Index in the original data array (never add initialIndex again)
      const actualIndex = index + startIndex;
      return (
        <SwiperCard
          key={keyExtractor ? keyExtractor(item, actualIndex) : actualIndex}
          ref={refs[actualIndex]}
          item={item}
          index={actualIndex}
          activeIndex={activeIndex}
          prerenderItems={adjustedPrerenderItems}
          cardStyle={cardStyle}
          flippedCardStyle={flippedCardStyle}
          regularCardStyle={regularCardStyle}
          disableRightSwipe={disableRightSwipe}
          disableLeftSwipe={disableLeftSwipe}
          disableTopSwipe={disableTopSwipe}
          disableBottomSwipe={disableBottomSwipe}
          translateXRange={translateXRange}
          translateYRange={translateYRange}
          rotateOutputRange={rotateOutputRange}
          rotateInputRange={rotateInputRange}
          inputOverlayLabelRightOpacityRange={
            inputOverlayLabelRightOpacityRange
          }
          outputOverlayLabelRightOpacityRange={
            outputOverlayLabelRightOpacityRange
          }
          inputOverlayLabelLeftOpacityRange={inputOverlayLabelLeftOpacityRange}
          outputOverlayLabelLeftOpacityRange={
            outputOverlayLabelLeftOpacityRange
          }
          inputOverlayLabelTopOpacityRange={inputOverlayLabelTopOpacityRange}
          outputOverlayLabelTopOpacityRange={outputOverlayLabelTopOpacityRange}
          inputOverlayLabelBottomOpacityRange={
            inputOverlayLabelBottomOpacityRange
          }
          outputOverlayLabelBottomOpacityRange={
            outputOverlayLabelBottomOpacityRange
          }
          OverlayLabelRight={OverlayLabelRight}
          OverlayLabelLeft={OverlayLabelLeft}
          OverlayLabelTop={OverlayLabelTop}
          OverlayLabelBottom={OverlayLabelBottom}
          onSwipeRight={onSwipeRight}
          onSwipeLeft={onSwipeLeft}
          onSwipeTop={onSwipeTop}
          onSwipeBottom={onSwipeBottom}
          onSwipeStart={onSwipeStart}
          onSwipeActive={onSwipeActive}
          onSwipeEnd={onSwipeEnd}
          onPress={onPress}
          FlippedContent={FlippedContent}
          swipeBackXSpringConfig={swipeBackXSpringConfig}
          swipeBackYSpringConfig={swipeBackYSpringConfig}
          swipeRightSpringConfig={swipeRightSpringConfig}
          swipeLeftSpringConfig={swipeLeftSpringConfig}
          swipeTopSpringConfig={swipeTopSpringConfig}
          swipeBottomSpringConfig={swipeBottomSpringConfig}
          swipeVelocityThreshold={swipeVelocityThreshold}
          direction={direction}
          flipDuration={flipDuration}
          overlayLabelContainerStyle={overlayLabelContainerStyle}
          restoredSwipeDirection={restoredSwipeDirections.get(actualIndex)}
        >
          {renderCard(item, actualIndex)}
        </SwiperCard>
      );
    })
    .reverse(); // render in the same hierarchy as the z-index
}

export default Swiper;
