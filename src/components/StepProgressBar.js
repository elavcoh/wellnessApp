/**
 * StepProgressBar.js
 *
 * Purpose: A simple horizontal fill bar showing progress toward a goal
 * (e.g. steps taken vs. step goal), as a value from 0 to 1.
 * Related to: used by MovementScreen.js.
 */

import { StyleSheet, View } from 'react-native';

export default function StepProgressBar({ progress }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#2f8f5b',
  },
});
