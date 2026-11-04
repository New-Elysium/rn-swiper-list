import {
  memo,
  useCallback,
  useImperativeHandle,
  type PropsWithChildren,
  type Ref,
} from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import type { SwiperCardInternalRefType } from '../internalTypes';
import type { SwiperCardOptions, SwiperSwipeDirection } from '../types';
import { getSwipeTranslation, resolveSwipeDirection } from '../utils';
import OverlayLabel from './OverlayLabel';

const EMPTY_RANGE: number[] = [];

type SwiperCardProps<T> = PropsWithChildren<SwiperCardOptions<T>> & {
  ref?: Ref<SwiperCardInternalRefType>;
};

function SwiperCard<T>({
  ref,
  index,
  item,
  activeIndex,
  prerenderItems = 5,
  onSwipeLeft,
  onSwipeRight,
  onSwipeTop,
  onSwipeBottom,
  cardStyle,
  flippedCardStyle,
  regularCardStyle,
  children,
  disableRightSwipe,
  disableLeftSwipe,
  disableTopSwipe,
  disableBottomSwipe,
  translateXRange = EMPTY_RANGE,
  translateYRange = EMPTY_RANGE,
  rotateInputRange = EMPTY_RANGE,
  rotateOutputRange = EMPTY_RANGE,
  inputOverlayLabelRightOpacityRange,
  outputOverlayLabelRightOpacityRange,
  inputOverlayLabelLeftOpacityRange,
  outputOverlayLabelLeftOpacityRange,
  inputOverlayLabelTopOpacityRange,
  outputOverlayLabelTopOpacityRange,
  inputOverlayLabelBottomOpacityRange,
  outputOverlayLabelBottomOpacityRange,
  OverlayLabelRight,
  OverlayLabelLeft,
  OverlayLabelTop,
  OverlayLabelBottom,
  onSwipeStart,
  onSwipeActive,
  onSwipeEnd,
  swipeBackXSpringConfig,
  swipeBackYSpringConfig,
  swipeRightSpringConfig,
  swipeLeftSpringConfig,
  swipeTopSpringConfig,
  swipeBottomSpringConfig,
  onPress,
  FlippedContent,
  direction = 'y',
  flipDuration = 500,
  overlayLabelContainerStyle,
  swipeVelocityThreshold,
  restoredSwipeDirection,
}: SwiperCardProps<T>) {
  const { width, height } = useWindowDimensions();
  const maxCardTranslation = width * 1.5;
  const maxCardTranslationY = height * 1.5;

  const restoredTranslation = getSwipeTranslation(
    restoredSwipeDirection,
    maxCardTranslation,
    maxCardTranslationY
  );
  const translateX = useSharedValue(restoredTranslation.x);
  const translateY = useSharedValue(restoredTranslation.y);
  const isFlipped = useSharedValue(false);
  // Whether the current pan started while this card was the active one.
  const isDragging = useSharedValue(false);
  const hasFlippedContent = FlippedContent != null;

  /**
   * Animate this card offscreen in `swipeDirection`. Runs on the UI thread so
   * gesture-driven swipes start in the same frame the finger is released.
   */
  const swipeTo = useCallback(
    (
      swipeDirection: SwiperSwipeDirection,
      shouldUpdateActiveIndex: boolean
    ) => {
      'worklet';
      const target = getSwipeTranslation(
        swipeDirection,
        maxCardTranslation,
        maxCardTranslationY
      );
      const isHorizontal =
        swipeDirection === 'left' || swipeDirection === 'right';
      const springConfig =
        swipeDirection === 'right'
          ? swipeRightSpringConfig
          : swipeDirection === 'left'
            ? swipeLeftSpringConfig
            : swipeDirection === 'top'
              ? swipeTopSpringConfig
              : swipeBottomSpringConfig;
      const callback =
        swipeDirection === 'right'
          ? onSwipeRight
          : swipeDirection === 'left'
            ? onSwipeLeft
            : swipeDirection === 'top'
              ? onSwipeTop
              : onSwipeBottom;

      const animation = withSpring(
        isHorizontal ? target.x : target.y,
        { ...springConfig, reduceMotion: ReduceMotion.Never },
        () => {
          if (callback) scheduleOnRN(callback, index);
        }
      );
      if (isHorizontal) {
        translateX.set(animation);
      } else {
        translateY.set(animation);
      }

      if (shouldUpdateActiveIndex) {
        activeIndex.set(activeIndex.get() + 1);
      }
    },
    [
      index,
      activeIndex,
      maxCardTranslation,
      maxCardTranslationY,
      translateX,
      translateY,
      onSwipeRight,
      onSwipeLeft,
      onSwipeTop,
      onSwipeBottom,
      swipeRightSpringConfig,
      swipeLeftSpringConfig,
      swipeTopSpringConfig,
      swipeBottomSpringConfig,
    ]
  );

  /** Spring the card to `(x, y)`, cancelling any running animation. */
  const springTo = useCallback(
    (x: number, y: number) => {
      'worklet';
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      translateX.set(
        withSpring(x, {
          ...swipeBackXSpringConfig,
          reduceMotion: ReduceMotion.Never,
        })
      );
      translateY.set(
        withSpring(y, {
          ...swipeBackYSpringConfig,
          reduceMotion: ReduceMotion.Never,
        })
      );
    },
    [translateX, translateY, swipeBackXSpringConfig, swipeBackYSpringConfig]
  );

  useImperativeHandle(
    ref,
    () => ({
      swipeRight: (shouldUpdateActiveIndex = true) =>
        scheduleOnUI(swipeTo, 'right', shouldUpdateActiveIndex),
      swipeLeft: (shouldUpdateActiveIndex = true) =>
        scheduleOnUI(swipeTo, 'left', shouldUpdateActiveIndex),
      swipeTop: (shouldUpdateActiveIndex = true) =>
        scheduleOnUI(swipeTo, 'top', shouldUpdateActiveIndex),
      swipeBottom: (shouldUpdateActiveIndex = true) =>
        scheduleOnUI(swipeTo, 'bottom', shouldUpdateActiveIndex),
      swipeBack: () => scheduleOnUI(springTo, 0, 0),
      resetAfterLoop: () =>
        scheduleOnUI(springTo, restoredTranslation.x, restoredTranslation.y),
      flipCard: () => {
        if (hasFlippedContent) {
          isFlipped.set(!isFlipped.get());
        }
      },
    }),
    [
      swipeTo,
      springTo,
      restoredTranslation.x,
      restoredTranslation.y,
      hasFlippedContent,
      isFlipped,
    ]
  );

  const rotateX = useDerivedValue(() =>
    interpolate(translateX.get(), rotateInputRange, rotateOutputRange, 'clamp')
  );

  const tap = useTapGesture({
    testID: `swiper-card-tap-${index}`,
    onDeactivate: (event) => {
      if (!event.canceled && onPress) {
        scheduleOnRN(onPress);
      }
    },
  });

  const pan = usePanGesture({
    testID: `swiper-card-pan-${index}`,
    onBegin: () => {
      const isActive = Math.floor(activeIndex.get()) === index;
      isDragging.set(isActive);
      if (isActive && onSwipeStart) scheduleOnRN(onSwipeStart);
    },
    onUpdate: (event) => {
      if (!isDragging.get()) return;
      if (onSwipeActive) scheduleOnRN(onSwipeActive);

      translateX.set(event.translationX);
      translateY.set(event.translationY);
    },
    onDeactivate: (event) => {
      if (!isDragging.get()) return;

      const swipeDirection = event.canceled
        ? null
        : resolveSwipeDirection({
            translationX: event.translationX,
            translationY: event.translationY,
            velocityX: event.velocityX,
            velocityY: event.velocityY,
            translateXRange,
            translateYRange,
            velocityThreshold: swipeVelocityThreshold,
            disabled: {
              left: disableLeftSwipe,
              right: disableRightSwipe,
              top: disableTopSwipe,
              bottom: disableBottomSwipe,
            },
          });

      if (swipeDirection) {
        swipeTo(swipeDirection, true);
      } else {
        springTo(0, 0);
      }
    },
    onFinalize: () => {
      if (!isDragging.get()) return;
      isDragging.set(false);
      if (onSwipeEnd) scheduleOnRN(onSwipeEnd);
    },
  });

  const gesture = useCompetingGestures(tap, pan);

  const rCardStyle = useAnimatedStyle(() => {
    const currentActive = Math.floor(activeIndex.get());
    const indexDiff = index - currentActive;
    const shouldRender = indexDiff >= -1 && indexDiff < prerenderItems;

    // Clamp indexDiff to minimum 0 to prevent scale > 1 for swiped cards
    const scale = 1 - 0.07 * Math.max(0, indexDiff);

    return {
      opacity: shouldRender ? 1 : 0,
      position: 'absolute',
      zIndex: -index,
      transform: [
        { rotate: `${rotateX.get()}rad` },
        { scale },
        { translateX: translateX.get() },
        { translateY: translateY.get() },
      ],
    };
  });

  const isDirectionX = direction === 'x';
  const regularCardAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.get()), [0, 1], [0, 180]);
    const rotateValue = withTiming(`${spinValue}deg`, {
      duration: flipDuration,
      reduceMotion: ReduceMotion.Never,
    });

    return {
      transform: [
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
      ],
      position: 'absolute',
      backfaceVisibility: 'hidden',
      zIndex: isFlipped.get() ? 1 : 2,
    };
  });

  const flippedCardAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(Number(isFlipped.get()), [0, 1], [180, 360]);
    const rotateValue = withTiming(`${spinValue}deg`, {
      duration: flipDuration,
      reduceMotion: ReduceMotion.Never,
    });

    return {
      transform: [
        isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
      ],
      backfaceVisibility: 'hidden',
      zIndex: isFlipped.get() ? 2 : 1,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[rCardStyle, cardStyle]}>
        {OverlayLabelLeft && (
          <OverlayLabel
            overlayLabelContainerStyle={overlayLabelContainerStyle}
            inputRange={inputOverlayLabelLeftOpacityRange}
            outputRange={outputOverlayLabelLeftOpacityRange}
            Component={OverlayLabelLeft}
            opacityValue={translateX}
          />
        )}
        {OverlayLabelRight && (
          <OverlayLabel
            overlayLabelContainerStyle={overlayLabelContainerStyle}
            inputRange={inputOverlayLabelRightOpacityRange}
            outputRange={outputOverlayLabelRightOpacityRange}
            Component={OverlayLabelRight}
            opacityValue={translateX}
          />
        )}
        {OverlayLabelTop && (
          <OverlayLabel
            overlayLabelContainerStyle={overlayLabelContainerStyle}
            inputRange={inputOverlayLabelTopOpacityRange}
            outputRange={outputOverlayLabelTopOpacityRange}
            Component={OverlayLabelTop}
            opacityValue={translateY}
          />
        )}
        {OverlayLabelBottom && (
          <OverlayLabel
            overlayLabelContainerStyle={overlayLabelContainerStyle}
            inputRange={inputOverlayLabelBottomOpacityRange}
            outputRange={outputOverlayLabelBottomOpacityRange}
            Component={OverlayLabelBottom}
            opacityValue={translateY}
          />
        )}
        <Animated.View
          style={[
            StyleSheet.flatten([regularCardStyle, cardStyle]),
            regularCardAnimatedStyle,
          ]}
        >
          {children}
        </Animated.View>
        {hasFlippedContent && (
          <Animated.View
            style={[
              StyleSheet.flatten([flippedCardStyle, cardStyle]),
              flippedCardAnimatedStyle,
            ]}
          >
            {FlippedContent(item, index)}
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export default memo(SwiperCard) as typeof SwiperCard;
