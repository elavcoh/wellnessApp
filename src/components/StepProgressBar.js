/**
 * StepProgressBar.js
 *
 * Purpose: A simple horizontal fill bar showing progress toward a goal
 * (e.g. steps taken vs. step goal), as a value from 0 to 1.
 * Related to: used by MovementScreen.js.
 */

import { View } from 'react-native';
import { stepProgressBarStyles as styles } from '../styles/components.styles';

// Props:
//   progress - a number meant to be between 0 (empty) and 1 (full), e.g.
//              todaySteps / stepGoal
export default function StepProgressBar({ progress }) {
  // "Clamp" means force a number to stay inside a range. Without this, if
  // the user walked MORE steps than their goal, progress could be 1.3, and
  // `1.3 * 100 = 130%` would make the fill bar try to be wider than its
  // container - clamping keeps it visually capped at exactly 100%.
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}
