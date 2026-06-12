import { useEffect, useMemo, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';

type AnimatedRevealProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle | ViewStyle[];
};

export default function AnimatedReveal({
  children,
  delay = 0,
  duration = 360,
  distance = 16,
  style,
}: AnimatedRevealProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [delay, duration, progress]);

  const animatedStyle = useMemo(
    () => ({
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [distance, 0],
          }),
        },
      ],
    }),
    [distance, progress]
  );

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
