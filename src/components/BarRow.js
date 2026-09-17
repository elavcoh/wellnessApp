import { StyleSheet, Text, View } from 'react-native';

export default function BarRow({ label, value, maxValue, valueLabel, noData }) {
  const ratio = noData || !maxValue ? 0 : Math.min(value / maxValue, 1);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
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
