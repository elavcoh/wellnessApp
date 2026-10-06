/**
 * SessionCard.js
 *
 * Purpose: Shows one breathing session option (title, description,
 * duration) that the user can tap to start.
 * Related to: used by BreathingScreen.js.
 */

import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { colors } from '../styles/theme';
import { sessionCardStyles as styles } from '../styles/components.styles';

// Props:
//   session - one entry from breathingPatterns.js (title, description,
//             durationSeconds, level, pattern)
//   onPress - called (no arguments) when the card is tapped, to start this session
export default function SessionCard({ session, onPress }) {
  // durationSeconds is stored in seconds (easier for the timer logic in
  // BreathingScreen.js) but shown to the user in whole minutes.
  const minutes = Math.round(session.durationSeconds / 60);
  return (
    <PressableScale style={styles.card} onPress={onPress}>
      <View style={[styles.playBadge, session.level === 'Advanced' && styles.playBadgeAdvanced]}>
        <Ionicons
          name="play"
          size={16}
          color={session.level === 'Advanced' ? colors.calm : colors.primary}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{session.title}</Text>
        <Text style={styles.description}>{session.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.duration}>{minutes} min</Text>
          <Text style={styles.pattern}>
            {session.pattern.inhale}-{session.pattern.hold}-{session.pattern.exhale}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
