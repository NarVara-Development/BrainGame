import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { COLORS, hardShadow, TYPE } from '@/theme/theme';

export function LoadingOverlay({ visible, label = 'LOADING' }: { visible: boolean; label?: string }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [visible, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.box, hardShadow(8)]}>
          <Animated.View style={[styles.square, { transform: [{ rotate }] }]} />
          <Text style={[TYPE.label, { marginTop: 16 }]}>{label}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: COLORS.paper,
    borderWidth: 4,
    borderColor: COLORS.ink,
    padding: 36,
    alignItems: 'center',
  },
  square: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.pink,
    borderWidth: 3,
    borderColor: COLORS.ink,
  },
});
