import { type JSX, type PropsWithChildren } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';
type Props = PropsWithChildren<{
    inputRange?: number[];
    outputRange?: number[];
    Component: () => JSX.Element;
    opacityValue: SharedValue<number>;
    overlayLabelContainerStyle?: StyleProp<ViewStyle>;
}>;
declare const OverlayLabel: ({ inputRange, outputRange, Component, opacityValue, overlayLabelContainerStyle, }: Props) => import("react/jsx-runtime").JSX.Element;
export default OverlayLabel;
//# sourceMappingURL=OverlayLabel.d.ts.map