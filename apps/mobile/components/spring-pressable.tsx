import { useRef } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type SpringPressableProps = PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressScale?: number;
};

export default function SpringPressable({
  children,
  style,
  pressScale = 0.97,
  onPressIn,
  onPressOut,
  ...props
}: SpringPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...props}
        onPressIn={(event) => {
          animateTo(pressScale);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animateTo(1);
          onPressOut?.(event);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
