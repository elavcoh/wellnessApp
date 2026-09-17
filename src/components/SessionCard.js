import { Pressable, StyleSheet, Text } from 'react-native';

export default function SessionCard({ session, onPress }) {
  const minutes = Math.round(session.durationSeconds / 60);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{session.title}</Text>
      <Text style={styles.description}>{session.description}</Text>
      <Text style={styles.duration}>{minutes} min</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  duration: {
    fontSize: 12,
    color: '#2f8f5b',
    fontWeight: '600',
    marginTop: 6,
  },
});
