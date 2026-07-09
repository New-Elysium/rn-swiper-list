import type { StyleProp, ViewStyle } from 'react-native';
import { type JSX } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/spring';
/**
 * Represents a cardinal swipe direction recognized by {@linkcode Swiper}.
 *
 * Used in {@linkcode SwiperRestoredSwipe} to replay a previously swiped card,
 * and passed to {@linkcode SwiperCardOptions.restoredSwipeDirection} so a card
 * can seed itself offscreen in the correct direction on mount.
 *
 * @see {@linkcode SwiperOptions.restoredSwipes}
 */
export type SwiperSwipeDirection = 'left' | 'right' | 'top' | 'bottom';
/**
 * Describes a single card to restore when the {@linkcode Swiper} mounts.
 *
 * Provide a continuous sequence of these via
 * {@linkcode SwiperOptions.restoredSwipes} to seed the swiper with previously
 * swiped cards. Restored cards are positioned offscreen in the given
 * {@linkcode SwiperRestoredSwipe.direction} without firing swipe callbacks,
 * so {@linkcode SwiperCardRefType.swipeBack} can rewind through them.
 *
 * @see {@linkcode SwiperOptions.restoredSwipes}
 * @see {@linkcode SwiperSwipeDirection}
 */
export type SwiperRestoredSwipe = {
    /** Original data-array index of the restored card. */
    index: number;
    /** Direction the card was originally swiped. */
    direction: SwiperSwipeDirection;
};
/**
 * Imperative handle exposed by {@linkcode Swiper} via a React ref.
 *
 * @example
 * ```tsx
 * const ref = useRef<SwiperCardRefType>(null);
 * ref.current?.swipeRight();
 * ref.current?.swipeBack();
 * ref.current?.flipCard();
 * ```
 */
export type SwiperCardRefType = {
    /** Animate the active card to the right and fire `onSwipeRight`. */
    swipeRight: () => void;
    /** Animate the active card to the left and fire `onSwipeLeft`. */
    swipeLeft: () => void;
    /** Animate the previous card back to center. */
    swipeBack: () => void;
    /** Animate the active card upward and fire `onSwipeTop`. */
    swipeTop: () => void;
    /** Animate the active card downward and fire `onSwipeBottom`. */
    swipeBottom: () => void;
    /** Flip the active card to reveal its back content. */
    flipCard: () => void;
} | undefined;
/**
 * Props accepted by the {@linkcode Swiper} component.
 *
 * @see {@linkcode Swiper}
 */
export type SwiperOptions<T> = {
    /** Card data. Each item is passed to {@linkcode SwiperOptions.renderCard}. */
    data: T[];
    /** Renders the front of a card for the given item and original data index. */
    renderCard: (item: T, index: number) => JSX.Element;
    /** Renders the back of a card (shown after {@linkcode SwiperCardRefType.flipCard}). */
    FlippedContent?: (item: T, index: number) => JSX.Element;
    /**
     * Number of cards to prerender ahead of the active card.
     * @default `Math.max(data.length - 1, 1)`
     */
    prerenderItems?: number;
    /** Style applied to each card container. */
    cardStyle?: StyleProp<ViewStyle>;
    /** Style applied to the back of each card. */
    flippedCardStyle?: StyleProp<ViewStyle>;
    /** Style applied to the front of each card. */
    regularCardStyle?: StyleProp<ViewStyle>;
    /**
     * When `true`, loops back to the first card after the last card is swiped.
     * @default false
     */
    loop?: boolean;
    /** Returns a stable React key for a card from its item and index. */
    keyExtractor?: (item: T, index: number) => string | number;
    /**
     * Index of the card to display on mount. Clamped to `[0, data.length - 1]`.
     * Updates after mount are ignored — remount to change the starting card.
     * @default 0
     */
    initialIndex?: number;
    /**
     * Previously swiped cards to restore on mount (persisted session restore).
     * Each entry uses the original data index and a {@linkcode SwiperSwipeDirection}.
     * The continuous restored sequence before {@linkcode SwiperOptions.initialIndex}
     * is positioned offscreen without firing swipe callbacks, so
     * {@linkcode SwiperCardRefType.swipeBack} can rewind through it.
     *
     * Intended to seed the swiper on mount, like {@linkcode SwiperOptions.initialIndex}.
     * Live controlled updates after mount are not supported.
     *
     * @see {@linkcode SwiperRestoredSwipe}
     */
    restoredSwipes?: SwiperRestoredSwipe[];
    /**
     * When `true`, mounts only cards near the active index for large datasets.
     * @default false
     */
    virtualizeCards?: boolean;
    /** Fired with the original data index when a card is swiped left. */
    onSwipeLeft?: (cardIndex: number) => void;
    /** Fired with the original data index when a card is swiped right. */
    onSwipeRight?: (cardIndex: number) => void;
    /** Fired with the original data index when a card is swiped upward. */
    onSwipeTop?: (cardIndex: number) => void;
    /** Fired with the original data index when a card is swiped downward. */
    onSwipeBottom?: (cardIndex: number) => void;
    /** Fired once when every card has been swiped. */
    onSwipedAll?: () => void;
    /** Fired when a gesture begins. */
    onSwipeStart?: () => void;
    /** Fired when a gesture ends. */
    onSwipeEnd?: () => void;
    /** Fired continuously while a gesture is active. */
    onSwipeActive?: () => void;
    /** Fired when the active card is tapped. */
    onPress?: () => void;
    /** Fired with the new active index whenever it changes. */
    onIndexChange?: (index: number) => void;
    /** When `true`, disables swiping to the right. */
    disableRightSwipe?: boolean;
    /** When `true`, disables swiping to the left. */
    disableLeftSwipe?: boolean;
    /** When `true`, disables swiping upward. */
    disableTopSwipe?: boolean;
    /** When `true`, disables swiping downward. */
    disableBottomSwipe?: boolean;
    /** Horizontal translation input range used for rotation interpolation. */
    translateXRange?: number[];
    /** Vertical translation input range used for rotation interpolation. */
    translateYRange?: number[];
    /** Rotation input range derived from horizontal translation. */
    rotateInputRange?: number[];
    /** Rotation output range (in radians) mapped from {@linkcode SwiperOptions.rotateInputRange}. */
    rotateOutputRange?: number[];
    /** Right overlay opacity input range. */
    inputOverlayLabelRightOpacityRange?: number[];
    /** Right overlay opacity output range. */
    outputOverlayLabelRightOpacityRange?: number[];
    /** Left overlay opacity input range. */
    inputOverlayLabelLeftOpacityRange?: number[];
    /** Left overlay opacity output range. */
    outputOverlayLabelLeftOpacityRange?: number[];
    /** Top overlay opacity input range. */
    inputOverlayLabelTopOpacityRange?: number[];
    /** Top overlay opacity output range. */
    outputOverlayLabelTopOpacityRange?: number[];
    /** Bottom overlay opacity input range. */
    inputOverlayLabelBottomOpacityRange?: number[];
    /** Bottom overlay opacity output range. */
    outputOverlayLabelBottomOpacityRange?: number[];
    /** Component rendered as the right-swipe overlay label. */
    OverlayLabelRight?: () => JSX.Element;
    /** Component rendered as the left-swipe overlay label. */
    OverlayLabelLeft?: () => JSX.Element;
    /** Component rendered as the upward-swipe overlay label. */
    OverlayLabelTop?: () => JSX.Element;
    /** Component rendered as the downward-swipe overlay label. */
    OverlayLabelBottom?: () => JSX.Element;
    /** Spring config for the horizontal swipe-back animation. */
    swipeBackXSpringConfig?: SpringConfig;
    /** Spring config for the vertical swipe-back animation. */
    swipeBackYSpringConfig?: SpringConfig;
    /** Spring config for programmatic / gesture right swipe. */
    swipeRightSpringConfig?: SpringConfig;
    /** Spring config for programmatic / gesture left swipe. */
    swipeLeftSpringConfig?: SpringConfig;
    /** Spring config for programmatic / gesture upward swipe. */
    swipeTopSpringConfig?: SpringConfig;
    /** Spring config for programmatic / gesture downward swipe. */
    swipeBottomSpringConfig?: SpringConfig;
    /**
     * Minimum velocity (px/s) required to trigger a swipe regardless of position.
     * When `undefined`, velocity-based swiping is disabled.
     * @default undefined
     */
    swipeVelocityThreshold?: number;
    /** Axis of the flip animation. */
    direction?: 'x' | 'y';
    /** Duration of the flip animation in milliseconds. */
    flipDuration?: number;
    /** Style for the overlay label container. */
    overlayLabelContainerStyle?: StyleProp<ViewStyle>;
};
/**
 * Props accepted by an individual `SwiperCard`.
 *
 * This type is used internally by {@linkcode Swiper} and is exported so that
 * advanced consumers wrapping or extending the card have typed props.
 *
 * @see {@linkcode Swiper}
 */
export type SwiperCardOptions<T> = {
    /** Card data item. */
    item: T;
    /** Original data-array index of this card. */
    index: number;
    /** Shared active-card index driven by the {@linkcode Swiper}. */
    activeIndex: SharedValue<number>;
    /** Number of cards prerendered ahead of the active card. */
    prerenderItems?: number;
    onSwipeRight?: (index: number) => void;
    onSwipeLeft?: (index: number) => void;
    onSwipeTop?: (index: number) => void;
    onSwipeBottom?: (index: number) => void;
    onSwipeStart?: () => void;
    onSwipeActive?: () => void;
    onSwipeEnd?: () => void;
    onPress?: () => void;
    cardStyle?: StyleProp<ViewStyle>;
    flippedCardStyle?: StyleProp<ViewStyle>;
    regularCardStyle?: StyleProp<ViewStyle>;
    loop?: boolean;
    disableRightSwipe?: boolean;
    disableLeftSwipe?: boolean;
    disableTopSwipe?: boolean;
    disableBottomSwipe?: boolean;
    translateXRange?: number[];
    rotateOutputRange?: number[];
    rotateInputRange?: number[];
    translateYRange?: number[];
    inputOverlayLabelRightOpacityRange?: number[];
    outputOverlayLabelRightOpacityRange?: number[];
    inputOverlayLabelLeftOpacityRange?: number[];
    outputOverlayLabelLeftOpacityRange?: number[];
    inputOverlayLabelTopOpacityRange?: number[];
    outputOverlayLabelTopOpacityRange?: number[];
    inputOverlayLabelBottomOpacityRange?: number[];
    outputOverlayLabelBottomOpacityRange?: number[];
    OverlayLabelRight?: () => JSX.Element;
    OverlayLabelLeft?: () => JSX.Element;
    OverlayLabelTop?: () => JSX.Element;
    OverlayLabelBottom?: () => JSX.Element;
    FlippedContent?: (item: T, index: number) => JSX.Element;
    swipeBackXSpringConfig?: SpringConfig;
    swipeBackYSpringConfig?: SpringConfig;
    swipeRightSpringConfig?: SpringConfig;
    swipeLeftSpringConfig?: SpringConfig;
    swipeTopSpringConfig?: SpringConfig;
    swipeBottomSpringConfig?: SpringConfig;
    swipeVelocityThreshold?: number;
    direction?: 'x' | 'y';
    flipDuration?: number;
    overlayLabelContainerStyle?: StyleProp<ViewStyle>;
    /**
     * When provided, the card seeds itself offscreen in this direction on mount
     * (used by {@linkcode SwiperOptions.restoredSwipes}).
     *
     * @see {@linkcode SwiperSwipeDirection}
     */
    restoredSwipeDirection?: SwiperSwipeDirection;
};
//# sourceMappingURL=types.d.ts.map