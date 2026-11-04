import { createRef } from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  createGestureController,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { act, render, screen } from '@testing-library/react-native';

import { Swiper, type SwiperCardRefType, type SwiperProps } from '../index';

// @react-native/jest-preset mocks the window as 750 x 1334, so the default
// swipe thresholds are 250 (x) and ~444 (y).
const DATA = ['a', 'b', 'c', 'd', 'e'];

const renderCard = (item: string, index: number) => (
  <Text testID={`card-${index}`}>{item}</Text>
);

const renderSwiper = async (props: Partial<SwiperProps<string>> = {}) => {
  const ref = createRef<SwiperCardRefType>();
  await render(
    <GestureHandlerRootView>
      <Swiper ref={ref} data={DATA} renderCard={renderCard} {...props} />
    </GestureHandlerRootView>
  );
  return ref;
};

/** Flush pending reactions / scheduled callbacks. */
const settle = () => act(() => jest.runOnlyPendingTimersAsync());
/**
 * Let springs settle so `withSpring` completion callbacks (which fire the
 * onSwipe* props) run. The default spring takes roughly two seconds.
 */
const runAnimations = () => act(() => jest.advanceTimersByTimeAsync(5000));

/** Current animated style of a card's outer (gesture) view. */
const cardStyle = (index: number) => {
  let node = screen.getByTestId(`card-${index}`).parent;
  while (
    node &&
    !('pointerEvents' in (node.props.jestAnimatedStyle?.value ?? {}))
  ) {
    node = node.parent;
  }
  if (!node) throw new Error(`No animated card view for card ${index}`);
  return node.props.jestAnimatedStyle.value as {
    opacity: number;
    pointerEvents: string;
    transform: Record<string, number>[];
  };
};
const scaleOf = (index: number) =>
  cardStyle(index).transform.find((t) => 'scale' in t)?.scale;

const tap = (index: number) => {
  const controller = createGestureController(
    getByGestureTestId(`swiper-card-tap-${index}`)
  );
  controller.begin();
  controller.activate();
  controller.end();
};

const pan = (
  index: number,
  { translationX = 0, translationY = 0, velocityX = 0, velocityY = 0 } = {}
) => {
  const controller = createGestureController(
    getByGestureTestId(`swiper-card-pan-${index}`)
  );
  controller.begin();
  controller.activate();
  controller.update({ translationX, translationY, velocityX, velocityY });
  controller.end({ translationX, translationY, velocityX, velocityY });
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('<Swiper /> rendering', () => {
  it('renders every card in reverse order so the first card is on top', async () => {
    await renderSwiper();
    const cards = screen.getAllByTestId(/^card-/);
    expect(cards.map((c) => c.props.testID)).toEqual([
      'card-4',
      'card-3',
      'card-2',
      'card-1',
      'card-0',
    ]);
  });

  it('starts at initialIndex and keeps restored cards mounted', async () => {
    await renderSwiper({
      initialIndex: 3,
      restoredSwipes: [
        { index: 1, direction: 'left' },
        { index: 2, direction: 'top' },
      ],
    });
    expect(screen.queryByTestId('card-0')).toBeNull();
    expect(screen.getByTestId('card-1')).toBeTruthy();
    expect(screen.getByTestId('card-3')).toBeTruthy();
  });

  it('only mounts cards in the render range when virtualizing', async () => {
    await renderSwiper({
      virtualizeCards: true,
      initialIndex: 2,
      prerenderItems: 1,
    });
    await settle();
    // Cards before initialIndex were never swiped and must not be mounted
    expect(screen.queryByTestId('card-0')).toBeNull();
    expect(screen.queryByTestId('card-1')).toBeNull();
    expect(screen.getByTestId('card-2')).toBeTruthy();
    expect(screen.getByTestId('card-3')).toBeTruthy();
    expect(screen.queryByTestId('card-4')).toBeNull();
  });
});

describe('<Swiper /> gestures', () => {
  it('swipes right on a horizontal drag past the threshold', async () => {
    const onSwipeRight = jest.fn();
    const onIndexChange = jest.fn();
    const onSwipeStart = jest.fn();
    const onSwipeEnd = jest.fn();
    await renderSwiper({
      onSwipeRight,
      onIndexChange,
      onSwipeStart,
      onSwipeEnd,
    });

    pan(0, { translationX: 300 });
    await runAnimations();

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).toHaveBeenCalledWith(0);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(onSwipeStart).toHaveBeenCalledTimes(1);
    expect(onSwipeEnd).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['left', { translationX: -300 }, 'onSwipeLeft'],
    ['top', { translationY: -500 }, 'onSwipeTop'],
    ['bottom', { translationY: 500 }, 'onSwipeBottom'],
  ] as const)('swipes %s', async (_name, translation, callbackName) => {
    const callback = jest.fn();
    await renderSwiper({ [callbackName]: callback });

    pan(0, translation);
    await runAnimations();

    expect(callback).toHaveBeenCalledWith(0);
  });

  it('springs back below the threshold', async () => {
    const onSwipeRight = jest.fn();
    const onIndexChange = jest.fn();
    await renderSwiper({ onSwipeRight, onIndexChange });

    pan(0, { translationX: 100 });
    await runAnimations();

    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onIndexChange).not.toHaveBeenCalledWith(1);
  });

  it('does not swipe in a disabled direction', async () => {
    const onSwipeRight = jest.fn();
    await renderSwiper({ onSwipeRight, disableRightSwipe: true });

    pan(0, { translationX: 300 });
    await runAnimations();

    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('swipes on velocity when swipeVelocityThreshold is set', async () => {
    const onSwipeLeft = jest.fn();
    await renderSwiper({ onSwipeLeft, swipeVelocityThreshold: 800 });

    pan(0, { translationX: -20, velocityX: -1200 });
    await runAnimations();

    expect(onSwipeLeft).toHaveBeenCalledWith(0);
  });

  it('ignores gestures on cards that are not active', async () => {
    const onSwipeRight = jest.fn();
    await renderSwiper({ onSwipeRight });

    pan(1, { translationX: 300 });
    await runAnimations();

    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('passes original data indexes with initialIndex', async () => {
    const onSwipeRight = jest.fn();
    await renderSwiper({ onSwipeRight, initialIndex: 2 });

    pan(2, { translationX: 300 });
    await runAnimations();

    expect(onSwipeRight).toHaveBeenCalledWith(2);
  });

  it('calls onPress on tap', async () => {
    const onPress = jest.fn();
    await renderSwiper({ onPress });

    tap(0);
    await settle();

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores taps on cards behind the active one and on swiped cards', async () => {
    const onPress = jest.fn();
    await renderSwiper({ onPress });

    tap(1);
    await settle();
    pan(0, { translationX: 300 });
    // Card 0 is still flying off when it is tapped
    tap(0);
    await runAnimations();

    expect(onPress).not.toHaveBeenCalled();
  });

  it('stops following the finger when the card is swiped by ref mid-drag', async () => {
    const onSwipeRight = jest.fn();
    const onSwipeLeft = jest.fn();
    const onIndexChange = jest.fn();
    const ref = await renderSwiper({
      onSwipeRight,
      onSwipeLeft,
      onIndexChange,
    });

    const controller = createGestureController(
      getByGestureTestId('swiper-card-pan-0')
    );
    controller.begin();
    controller.activate();
    controller.update({ translationX: -50, translationY: 0 });
    await act(async () => ref.current?.swipeRight());
    // Let the scheduled UI-thread swipe start before the finger moves again
    await settle();
    // The finger keeps moving and is released past the left threshold
    controller.update({ translationX: -300, translationY: 0 });
    controller.end({ translationX: -300, translationY: 0 });
    await runAnimations();

    expect(onSwipeRight.mock.calls).toEqual([[0]]);
    expect(onSwipeLeft).not.toHaveBeenCalled();
    // The card finished offscreen to the right, not where the finger was
    const translateX = cardStyle(0).transform.find(
      (t) => 'translateX' in t
    )?.translateX;
    expect(translateX).toBeGreaterThan(750);
    expect(onIndexChange.mock.calls.map(([i]) => i)).toEqual([1]);
  });
});

describe('<Swiper /> imperative API', () => {
  it('swipes the active card once per call', async () => {
    const onSwipeRight = jest.fn();
    const onSwipeLeft = jest.fn();
    const onIndexChange = jest.fn();
    const ref = await renderSwiper({
      onSwipeRight,
      onSwipeLeft,
      onIndexChange,
    });

    await act(async () => ref.current?.swipeRight());
    await runAnimations();
    await act(async () => ref.current?.swipeLeft());
    await runAnimations();

    expect(onSwipeRight).toHaveBeenCalledWith(0);
    expect(onSwipeLeft).toHaveBeenCalledWith(1);
    // Controller-owned index update: exactly one increment per swipe
    expect(onIndexChange.mock.calls.map(([i]) => i)).toEqual([1, 2]);
  });

  it('targets consecutive cards when called rapidly', async () => {
    const onSwipeRight = jest.fn();
    const ref = await renderSwiper({ onSwipeRight });

    await act(async () => {
      ref.current?.swipeRight();
      ref.current?.swipeRight();
    });
    await runAnimations();

    expect(onSwipeRight.mock.calls.map(([i]) => i).sort()).toEqual([0, 1]);
  });

  it('swipeBack rewinds to the previous card and stops at the first', async () => {
    const onIndexChange = jest.fn();
    const ref = await renderSwiper({ onIndexChange });

    await act(async () => ref.current?.swipeTop());
    await runAnimations();
    await act(async () => ref.current?.swipeBack());
    await runAnimations();
    await act(async () => ref.current?.swipeBack());
    await runAnimations();

    expect(onIndexChange.mock.calls.map(([i]) => i)).toEqual([1, 0]);
  });

  it('swipeBack rewinds through restored swipes', async () => {
    const onIndexChange = jest.fn();
    const ref = await renderSwiper({
      onIndexChange,
      initialIndex: 2,
      restoredSwipes: [
        { index: 0, direction: 'right' },
        { index: 1, direction: 'left' },
      ],
    });

    for (let i = 0; i < 3; i++) {
      await act(async () => ref.current?.swipeBack());
      await runAnimations();
    }

    expect(onIndexChange.mock.calls.map(([i]) => i)).toEqual([1, 0]);
  });

  it('calls onSwipedAll once after the last card', async () => {
    const onSwipedAll = jest.fn();
    const ref = await renderSwiper({ onSwipedAll });

    for (let i = 0; i < DATA.length; i++) {
      await act(async () => ref.current?.swipeRight());
      await runAnimations();
    }
    // Further calls are no-ops
    await act(async () => ref.current?.swipeRight());
    await runAnimations();

    expect(onSwipedAll).toHaveBeenCalledTimes(1);
  });
});

describe('<Swiper /> stack', () => {
  it('only the active card receives touches', async () => {
    await renderSwiper();
    expect(cardStyle(0).pointerEvents).toBe('auto');
    expect(cardStyle(1).pointerEvents).toBe('none');

    pan(0, { translationX: 300 });
    await runAnimations();

    expect(cardStyle(0).pointerEvents).toBe('none');
    expect(cardStyle(1).pointerEvents).toBe('auto');
  });

  it('animates the next card up to full size', async () => {
    await renderSwiper();
    expect(scaleOf(0)).toBe(1);
    expect(scaleOf(1)).toBeCloseTo(0.93);

    pan(0, { translationX: 300 });
    await settle();
    await act(() => jest.advanceTimersByTimeAsync(100));
    const midway = scaleOf(1)!;
    expect(midway).toBeGreaterThan(0.93);
    expect(midway).toBeLessThan(1);

    await runAnimations();
    expect(scaleOf(1)).toBe(1);
    expect(scaleOf(2)).toBeCloseTo(0.93);
  });

  it('fades in cards as they enter the prerender range', async () => {
    await renderSwiper({ prerenderItems: 2 });
    expect(cardStyle(2).opacity).toBe(0);

    pan(0, { translationX: 300 });
    await settle();
    await act(() => jest.advanceTimersByTimeAsync(100));
    expect(cardStyle(2).opacity).toBeGreaterThan(0);
    expect(cardStyle(2).opacity).toBeLessThan(1);

    await runAnimations();
    expect(cardStyle(2).opacity).toBe(1);
  });
});

describe('<Swiper /> loop', () => {
  it('returns to initialIndex after the last card for gesture swipes', async () => {
    const onSwipedAll = jest.fn();
    const onIndexChange = jest.fn();
    const onSwipeRight = jest.fn();
    await renderSwiper({
      loop: true,
      onSwipedAll,
      onIndexChange,
      onSwipeRight,
    });

    for (let i = 0; i < DATA.length; i++) {
      pan(i, { translationX: 300 });
      await runAnimations();
    }

    expect(onSwipeRight).toHaveBeenCalledTimes(DATA.length);
    expect(onSwipedAll).not.toHaveBeenCalled();
    expect(onIndexChange).toHaveBeenLastCalledWith(0);

    // The deck is usable again from the first card
    pan(0, { translationX: 300 });
    await runAnimations();
    expect(onSwipeRight).toHaveBeenLastCalledWith(0);
  });

  it('returns to initialIndex after the last card for imperative swipes', async () => {
    const onIndexChange = jest.fn();
    const ref = await renderSwiper({ loop: true, onIndexChange });

    for (let i = 0; i < DATA.length; i++) {
      await act(async () => ref.current?.swipeLeft());
      await runAnimations();
    }

    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });
});
