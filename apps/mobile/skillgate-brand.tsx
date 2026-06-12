import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

type BrandSize = 'hero' | 'section' | 'compact';

type SkillGateBrandProps = {
  size?: BrandSize;
  tagline?: string;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
};

const sizeMap = {
  hero: {
    mark: 82,
    title: 34,
    tagline: 11,
    gap: 16,
  },
  section: {
    mark: 62,
    title: 26,
    tagline: 10,
    gap: 14,
  },
  compact: {
    mark: 42,
    title: 18,
    tagline: 9,
    gap: 10,
  },
};

export default function SkillGateBrand({
  size = 'section',
  tagline = 'AI-powered hiring intelligence',
  align = 'left',
  style,
}: SkillGateBrandProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const config = sizeMap[size];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  const wrapperAlignment: ViewStyle =
    align === 'center'
      ? { alignItems: 'center', justifyContent: 'center' }
      : { alignItems: 'center' };

  const titleStyle: TextStyle = {
    fontSize: config.title,
    textAlign: align,
  };

  const taglineStyle: TextStyle = {
    fontSize: config.tagline,
    textAlign: align,
  };

  return (
    <View style={[styles.wrapper, wrapperAlignment, style]}>
      <View style={[styles.row, { gap: config.gap }]}>
        <View
          style={[
            styles.markFrame,
            {
              width: config.mark,
              height: config.mark,
              borderRadius: config.mark * 0.34,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.glow,
              {
                transform: [{ scale: glowScale }],
              },
            ]}
          />
          <View style={styles.markInner}>
            <View style={styles.leftBar} />
            <View style={styles.rightBar} />
            <View style={styles.bridge} />
          </View>
        </View>

        <View>
          <Text style={[styles.title, titleStyle]}>
            <Text style={styles.titleMain}>Skill</Text>
            <Text style={styles.titleAccent}>Gate</Text>
          </Text>
          <Text style={[styles.tagline, taglineStyle]}>{tagline}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markFrame: {
    backgroundColor: '#0a162b',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#020617',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 15,
  },
  glow: {
    position: 'absolute',
    width: '74%',
    height: '74%',
    borderRadius: 999,
    backgroundColor: 'rgba(251,146,60,0.26)',
  },
  markInner: {
    width: '58%',
    height: '46%',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(203,213,225,0.26)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftBar: {
    position: 'absolute',
    left: '18%',
    width: '12%',
    height: '68%',
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
  rightBar: {
    position: 'absolute',
    right: '18%',
    width: '12%',
    height: '68%',
    borderRadius: 999,
    backgroundColor: '#fb923c',
  },
  bridge: {
    width: '34%',
    height: '12%',
    borderRadius: 999,
    backgroundColor: '#93c5fd',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -1.1,
    color: '#f8fafc',
  },
  titleMain: {
    color: '#f8fafc',
  },
  titleAccent: {
    color: '#fdba74',
  },
  tagline: {
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: 'rgba(226,232,240,0.65)',
    fontWeight: '700',
  },
});