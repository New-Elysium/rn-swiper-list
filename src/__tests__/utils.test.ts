import {
  buildRestoredSwipeDirections,
  clampInitialIndex,
  getAdjustedPrerenderItems,
  getFirstRenderedIndex,
  getSwipeTranslation,
  getVirtualizedRenderRange,
  resolveSwipeDirection,
  SWIPE_BACK_BUFFER,
  type ResolveSwipeDirectionInput,
} from '../utils';

describe('clampInitialIndex', () => {
  it.each([
    [0, 5, 0],
    [3, 5, 3],
    [4, 5, 4],
    [5, 5, 4],
    [10, 5, 4],
    [-1, 5, 0],
    [0, 0, 0],
  ])('clamps %p with %p cards to %p', (index, length, expected) => {
    expect(clampInitialIndex(index, length)).toBe(expected);
  });
});

describe('getAdjustedPrerenderItems', () => {
  it('limits prerendering to the cards left after initialIndex', () => {
    expect(getAdjustedPrerenderItems(3, 5, 2)).toBe(2);
    expect(getAdjustedPrerenderItems(1, 5, 0)).toBe(1);
    expect(getAdjustedPrerenderItems(10, 5, 0)).toBe(4);
  });

  it('is always at least 1', () => {
    expect(getAdjustedPrerenderItems(4, 1, 0)).toBe(1);
    expect(getAdjustedPrerenderItems(4, 5, 4)).toBe(1);
    expect(getAdjustedPrerenderItems(4, 0, 0)).toBe(1);
  });
});

describe('buildRestoredSwipeDirections', () => {
  it('keeps valid entries before initialIndex keyed by data index', () => {
    const directions = buildRestoredSwipeDirections(
      [
        { index: 0, direction: 'right' },
        { index: 1, direction: 'left' },
        { index: 2, direction: 'top' },
      ],
      3,
      6
    );
    expect([...directions]).toEqual([
      [0, 'right'],
      [1, 'left'],
      [2, 'top'],
    ]);
  });

  it('ignores the active card, future cards, out-of-range and non-integer indexes', () => {
    const directions = buildRestoredSwipeDirections(
      [
        { index: -1, direction: 'left' },
        { index: 1.5, direction: 'left' },
        { index: 2, direction: 'bottom' },
        { index: 3, direction: 'right' },
        { index: 4, direction: 'right' },
      ],
      3,
      6
    );
    expect([...directions]).toEqual([[2, 'bottom']]);
  });

  it('returns an empty map without restored swipes', () => {
    expect(buildRestoredSwipeDirections(undefined, 3, 6).size).toBe(0);
  });
});

describe('getFirstRenderedIndex', () => {
  it('renders from the earliest card of the continuous restored sequence', () => {
    const directions = buildRestoredSwipeDirections(
      [
        { index: 0, direction: 'right' },
        { index: 1, direction: 'left' },
        { index: 2, direction: 'top' },
      ],
      3,
      6
    );
    expect(getFirstRenderedIndex(directions, 3)).toBe(0);
  });

  it('stops at gaps in the restored sequence', () => {
    const directions = buildRestoredSwipeDirections(
      [
        { index: 0, direction: 'right' },
        { index: 2, direction: 'left' },
      ],
      3,
      6
    );
    expect(getFirstRenderedIndex(directions, 3)).toBe(2);
  });

  it('equals initialIndex without restored swipes', () => {
    expect(getFirstRenderedIndex(new Map(), 3)).toBe(3);
  });
});

describe('getVirtualizedRenderRange', () => {
  it('keeps a swipe-back buffer behind the active card', () => {
    expect(getVirtualizedRenderRange(10, 2, 100, 0)).toEqual({
      start: 10 - SWIPE_BACK_BUFFER,
      end: 13,
    });
  });

  it('never mounts cards before firstRenderedIndex', () => {
    // initialIndex 5 without restored swipes: cards 0-4 must stay unmounted,
    // otherwise they would render centered on top of the stack.
    expect(getVirtualizedRenderRange(5, 2, 100, 5)).toEqual({
      start: 5,
      end: 8,
    });
    expect(getVirtualizedRenderRange(6, 2, 100, 5).start).toBe(5);
  });

  it('clamps the end to the data length', () => {
    expect(getVirtualizedRenderRange(9, 4, 10, 0).end).toBe(10);
  });
});

describe('getSwipeTranslation', () => {
  it.each([
    ['right', { x: 300, y: 0 }],
    ['left', { x: -300, y: 0 }],
    ['bottom', { x: 0, y: 600 }],
    ['top', { x: 0, y: -600 }],
    [undefined, { x: 0, y: 0 }],
  ] as const)('maps %p offscreen', (direction, expected) => {
    expect(getSwipeTranslation(direction, 300, 600)).toEqual(expected);
  });
});

describe('resolveSwipeDirection', () => {
  const base: ResolveSwipeDirectionInput = {
    translationX: 0,
    translationY: 0,
    velocityX: 0,
    velocityY: 0,
    translateXRange: [-100, 0, 100],
    translateYRange: [-200, 0, 200],
    velocityThreshold: undefined,
    disabled: {},
  };

  it('swipes horizontally past the threshold with zero vertical movement', () => {
    // Regression: v1 treated translationY === 0 as a vertical swipe and
    // snapped the card back for perfectly horizontal drags (mouse/trackpad).
    expect(resolveSwipeDirection({ ...base, translationX: 150 })).toBe('right');
    expect(resolveSwipeDirection({ ...base, translationX: -150 })).toBe('left');
  });

  it('swipes horizontally with some vertical movement under its threshold', () => {
    expect(
      resolveSwipeDirection({ ...base, translationX: 150, translationY: 40 })
    ).toBe('right');
  });

  it('swipes vertically past the vertical threshold', () => {
    expect(resolveSwipeDirection({ ...base, translationY: -250 })).toBe('top');
    expect(resolveSwipeDirection({ ...base, translationY: 250 })).toBe(
      'bottom'
    );
  });

  it('prefers the vertical swipe when both thresholds are passed', () => {
    expect(
      resolveSwipeDirection({ ...base, translationX: 150, translationY: 250 })
    ).toBe('bottom');
  });

  it('springs back below the thresholds', () => {
    expect(resolveSwipeDirection({ ...base, translationX: 99 })).toBeNull();
    expect(resolveSwipeDirection({ ...base, translationY: -199 })).toBeNull();
    expect(resolveSwipeDirection(base)).toBeNull();
  });

  it('respects disabled directions', () => {
    const disabled = { right: true, top: true };
    expect(
      resolveSwipeDirection({ ...base, disabled, translationX: 150 })
    ).toBeNull();
    expect(
      resolveSwipeDirection({ ...base, disabled, translationX: -150 })
    ).toBe('left');
    // A disabled vertical swipe does not fall back to a horizontal one
    expect(
      resolveSwipeDirection({
        ...base,
        disabled,
        translationX: -150,
        translationY: -250,
      })
    ).toBeNull();
  });

  it('ignores velocity unless a threshold is set', () => {
    expect(resolveSwipeDirection({ ...base, velocityX: 5000 })).toBeNull();
  });

  it('swipes on velocity above the threshold, horizontal first', () => {
    const fast = { ...base, velocityThreshold: 800 };
    expect(resolveSwipeDirection({ ...fast, velocityX: 1000 })).toBe('right');
    expect(resolveSwipeDirection({ ...fast, velocityX: -1000 })).toBe('left');
    expect(resolveSwipeDirection({ ...fast, velocityY: -1000 })).toBe('top');
    expect(
      resolveSwipeDirection({ ...fast, velocityX: 1000, velocityY: 1000 })
    ).toBe('right');
    expect(
      resolveSwipeDirection({
        ...fast,
        velocityX: 1000,
        velocityY: 1000,
        disabled: { right: true },
      })
    ).toBe('bottom');
    expect(resolveSwipeDirection({ ...fast, velocityX: 700 })).toBeNull();
  });
});
