import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

const EMPTY_RANGE: number[] = [];

type Props = {
  inputRange?: number[];
  outputRange?: number[];
  Component: () => ReactNode;
  opacityValue: SharedValue<number>;
  overlayLabelContainerStyle?: StyleProp<ViewStyle>;
};

const OverlayLabel = ({
  inputRange = EMPTY_RANGE,
  outputRange = EMPTY_RANGE,
  Component,
  opacityValue,
  overlayLabelContainerStyle,
}: Props) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacityValue.get(), inputRange, outputRange, 'clamp'),
    zIndex: 3,
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        animatedStyle,
        overlayLabelContainerStyle,
      ]}
      pointerEvents="none"
    >
      <Component />
    </Animated.View>
  );
};

export default OverlayLabel;
