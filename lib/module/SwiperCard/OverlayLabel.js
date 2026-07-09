"use strict";

import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { jsx as _jsx } from "react/jsx-runtime";
const OverlayLabel = ({
  inputRange,
  outputRange,
  Component,
  opacityValue,
  overlayLabelContainerStyle
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(opacityValue.value, inputRange ?? [], outputRange ?? [], 'clamp'),
      zIndex: 3
    };
  });
  return /*#__PURE__*/_jsx(Animated.View, {
    style: [StyleSheet.absoluteFillObject, animatedStyle, overlayLabelContainerStyle],
    pointerEvents: "none",
    children: /*#__PURE__*/_jsx(Component, {})
  });
};
export default OverlayLabel;
//# sourceMappingURL=OverlayLabel.js.map