import type { SwiperCardRefType } from './types';

type SwipeMethod = (shouldUpdateActiveIndex?: boolean) => void;

export type SwiperCardInternalRefType =
  | (Omit<
      NonNullable<SwiperCardRefType>,
      'swipeRight' | 'swipeLeft' | 'swipeTop' | 'swipeBottom'
    > & {
      swipeRight: SwipeMethod;
      swipeLeft: SwipeMethod;
      swipeTop: SwipeMethod;
      swipeBottom: SwipeMethod;
      resetAfterLoop: () => void;
    })
  | undefined;
