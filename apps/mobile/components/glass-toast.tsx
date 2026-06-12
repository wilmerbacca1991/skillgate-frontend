import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ToastNotice = {
  type: 'success' | 'error' | '';
  message: string;
};

type GlassToastProps = {
  notice: ToastNotice;
  onClose: () => void;
  durationMs?: number;
};

export default function GlassToast({ notice, onClose, durationMs = 3600 }: GlassToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (!notice.message) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timerId = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -6,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => onClose());
    }, durationMs);

    return () => {
      clearTimeout(timerId);
    };
  }, [notice.message, onClose, durationMs, opacity, translateY]);

  if (!notice.message) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={styles.wrap}
    >
      <Animated.View
        style={[
          styles.toast,
          notice.type === 'error' ? styles.toastError : null,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Text style={[styles.text, notice.type === 'error' ? styles.textError : null]}>
          {notice.message}
        </Text>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => {
            Animated.parallel([
              Animated.timing(opacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                toValue: -6,
                duration: 150,
                useNativeDriver: true,
              }),
            ]).start(() => onClose());
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>x</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 14,
    left: 12,
    right: 12,
    zIndex: 1000,
  },
  toast: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.46)',
    backgroundColor: 'rgba(9,28,26,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#020617',
    shadowOpacity: 0.42,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  toastError: {
    borderColor: 'rgba(248,113,113,0.52)',
    backgroundColor: 'rgba(56,19,28,0.92)',
  },
  text: {
    flex: 1,
    color: '#dcfce7',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginRight: 10,
  },
  textError: {
    color: '#fee2e2',
  },
  closeButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  closeText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
});
