/**
 * SessionCard.js
 *
 * Purpose: Shows one breathing session option (title, description,
 * duration) that the user can tap to start.
 * Related to: used by BreathingScreen.js.
 */

import { Pressable, StyleSheet, Text } from 'react-native';

// Props:
//   session - one entry from breathingPatterns.js (title, description,
//             durationSeconds, level, pattern)
//   onPress - called (no arguments) when the card is tapped, to start this session
export default function SessionCard({ session, onPress }) {
  // durationSeconds is stored in seconds (easier for the timer logic in
  // BreathingScreen.js) but shown to the user in whole minutes.
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
