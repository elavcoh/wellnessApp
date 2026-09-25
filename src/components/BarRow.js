/**
 * BarRow.js
 *
 * Purpose: One row in a simple bar chart - a label, a fill bar sized
 * relative to the highest value in the chart, and a value. Used instead
 * of a charting library.
 * Related to: used by ProgressScreen.js (steps, meals, breathing charts).
 */

import { StyleSheet, Text, View } from 'react-native';

// Props:
//   label     - short text on the left, e.g. a weekday like "Mon"
//   value     - the raw number this bar represents, e.g. 6200 steps
//   maxValue  - the biggest value across all bars in this chart, used only
//               to work out how full THIS bar should be (see "ratio" below)
//   valueLabel - the text shown on the right, already formatted (e.g. "6,200")
//   noData    - true when this day has no real value to show (e.g. steps
//               were never recorded that day) - draws an empty bar and a
//               dash instead of pretending the value is 0
export default function BarRow({ label, value, maxValue, valueLabel, noData }) {
  // "ratio" is how full the bar should be, from 0 to 1. Example: if this
  // day's value is 3000 and the chart's biggest day is 6000, ratio is 0.5,
  // so the fill below becomes 50% wide - that's what makes bars visually
  // comparable to each other without a real charting library.
  const ratio = noData || !maxValue ? 0 : Math.min(value / maxValue, 1);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        {/* No fill drawn at all for a no-data day - an empty track reads as
            "we don't know", while a 0%-wide fill could look identical to a
            real zero, which is exactly the confusion we want to avoid. */}
        {!noData && <View style={[styles.fill, { width: `${ratio * 100}%` }]} />}
      </View>
      <Text style={styles.value}>{noData ? '—' : valueLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    width: 36,
    fontSize: 12,
    color: '#666',
  },
  track: {
    flex: 1,
    height: 14,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  fill: {
    height: '100%',
    backgroundColor: '#2f8f5b',
  },
  value: {
    width: 60,
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
  },
});
