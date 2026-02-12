import { type RefObject } from 'react';
import type { SwiperCardRefType } from 'rn-swiper-list';
declare const useSwipeControls: <T>(data: T[], loop?: boolean, initialIndex?: number) => {
    activeIndex: import("react-native-reanimated").SharedValue<number>;
    refs: RefObject<SwiperCardRefType | null>[];
    swipeRight: () => void;
    swipeLeft: () => void;
    swipeBack: () => void;
    swipeTop: () => void;
    swipeBottom: () => void;
    flipCard: () => void;
};
export default useSwipeControls;
//# sourceMappingURL=useSwipeControls.d.ts.map