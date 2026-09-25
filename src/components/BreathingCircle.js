/**
 * BreathingCircle.js
 *
 * Purpose: The animated circle that expands on inhale and contracts on
 * exhale, plus the current phase label ("Inhale", "Hold", "Exhale").
 * Related to: used by BreathingScreen.js, which controls the animation.
 */

import { Animated, StyleSheet, Text, View } from 'react-native';

// Props:
//   scale      - an Animated.Value (not a plain number!) that controls how
//                big the circle is. BreathingScreen.js animates this value
//                over time; this component just reads it every frame.
//   phaseLabel - plain text shown under the circle, e.g. "Inhale · 3"
export default function BreathingCircle({ scale, phaseLabel }) {
  return (
    <View style={styles.wrapper}>
      {/* Animated.View (not a plain View) is required here because its
          style is allowed to read a live Animated.Value directly - a plain
          View would need scale re-rendered as a new number every frame,
          which is slower and can look jumpy. */}
      <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
      <Text style={styles.phaseLabel}>{phaseLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    marginVertical: 20,
  },
  circle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2f8f5b22',
    borderWidth: 2,
    borderColor: '#2f8f5b',
  },
  phaseLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2f8f5b',
  },
});
