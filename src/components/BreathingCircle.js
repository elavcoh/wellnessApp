/**
 * BreathingCircle.js
 *
 * Purpose: The animated circle that expands on inhale and contracts on
 * exhale, plus the current phase label ("Inhale", "Hold", "Exhale").
 * Three soft rings move with it at different strengths, so the whole shape
 * "breathes", and its color follows the phase.
 * Related to: used by BreathingScreen.js, which controls the animation.
 */

import { Animated, Text, View } from 'react-native';
import { phaseColors } from '../styles/theme';
import { breathingCircleStyles as styles } from '../styles/components.styles';

// Props:
//   scale      - the Animated.Value BreathingScreen animates (1 to 1.4)
//   phaseLabel - text in the middle, e.g. "Inhale · 3"
//   phase      - 'inhale' | 'hold' | 'exhale', picks the color
export default function BreathingCircle({ scale, phaseLabel, phase = 'inhale' }) {
  const color = phaseColors[phase] ?? phaseColors.inhale;

  // The outer rings grow more than the core and fade in as the breath
  // fills up - all driven by the same `scale` value, no extra timers.
  const outerScale = scale.interpolate({ inputRange: [1, 1.4], outputRange: [0.9, 1.55] });
  const middleScale = scale.interpolate({ inputRange: [1, 1.4], outputRange: [0.95, 1.4] });
  const outerOpacity = scale.interpolate({ inputRange: [1, 1.4], outputRange: [0.08, 0.22] });
  const middleOpacity = scale.interpolate({ inputRange: [1, 1.4], outputRange: [0.16, 0.32] });

  return (
    <View style={styles.wrapper}>
      {/* Animated.View (not a plain View) is required here because its
          style is allowed to read a live Animated.Value directly - a plain
          View would need scale re-rendered as a new number every frame,
          which is slower and can look jumpy. */}
      <Animated.View
        style={[styles.ring, styles.ringOuter, { backgroundColor: color, opacity: outerOpacity, transform: [{ scale: outerScale }] }]}
      />
      <Animated.View
        style={[styles.ring, styles.ringMiddle, { backgroundColor: color, opacity: middleOpacity, transform: [{ scale: middleScale }] }]}
      />
      <Animated.View style={[styles.circle, { backgroundColor: color, transform: [{ scale }] }]} />
      <Text style={styles.phaseLabel}>{phaseLabel}</Text>
    </View>
  );
}
