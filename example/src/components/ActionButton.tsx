import { memo } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type ActionButtonProps = Omit<PressableProps, 'style' | 'onPress'> & {
  onTap?: () => void;
  style?: StyleProp<ViewStyle>;
};

const ActionButton = ({
  onTap,
  style,
  children,
  ...rest
}: ActionButtonProps) => (
  <Pressable
    accessibilityRole="button"
    onPress={onTap}
    style={({ pressed }) => [style, pressed && { opacity: 0.6 }]}
    {...rest}
  >
    {children}
  </Pressable>
);

export default memo(ActionButton);
