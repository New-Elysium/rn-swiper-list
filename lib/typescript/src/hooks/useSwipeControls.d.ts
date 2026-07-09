import { type RefObject } from 'react';
import type { SwiperCardInternalRefType } from '../internalTypes.js';
declare const useSwipeControls: <T>(data: T[], loop?: boolean, initialIndex?: number, swipeBackStartIndex?: number) => {
    activeIndex: import("react-native-reanimated").SharedValue<number>;
    refs: RefObject<SwiperCardInternalRefType | null>[];
    swipeRight: () => void;
    swipeLeft: () => void;
    swipeBack: () => void;
    swipeTop: () => void;
    swipeBottom: () => void;
    flipCard: () => void;
};
export default useSwipeControls;
//# sourceMappingURL=useSwipeControls.d.ts.map