/**
 * PressableScale.js
 *
 * Purpose: A drop-in replacement for Pressable that gently shrinks while pressed and
 * springs back - the small "alive" feedback on every button and card.
 * Related to: used by all screens and tappable components. Takes the same props as
 * Pressable.
 */

import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

// Animated version of Pressable, so its own style can be animated - no
// extra wrapper View, so flex/width layout styles keep working as before.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PressableScale({ style, children, onPressIn, onPressOut, ...props }) {
  // 1 = normal size. Kept in a ref so it survives re-renders.
  const scale = useRef(new Animated.Value(1)).current;

  // Animates the size to `value` with a small bounce.
  function springTo(value) {
    Animated.spring(scale, { toValue: value, speed: 40, bounciness: 6, useNativeDriver: true }).start();
  }

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        springTo(0.96);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        springTo(1);
        onPressOut?.(event);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
