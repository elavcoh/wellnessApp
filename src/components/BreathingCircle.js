import { Animated, StyleSheet, Text, View } from 'react-native';

export default function BreathingCircle({ scale, phaseLabel }) {
  return (
    <View style={styles.wrapper}>
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
