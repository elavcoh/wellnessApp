/**
 * RecommendationCard.js
 *
 * Purpose: Shows one AI Coach recommendation - a short title plus the
 * reason behind it.
 * Related to: used by AICoachScreen.js.
 */

import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { recommendationCardStyles as styles } from '../styles/components.styles';

// Props:
//   recommendation - one item from the AI Coach's "recommendations" array:
//                     { title, reason } (see openaiClient.js's schema)
export default function RecommendationCard({ recommendation }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Ionicons name="sparkles" size={14} color={colors.calm} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{recommendation.title}</Text>
        <Text style={styles.reason}>{recommendation.reason}</Text>
      </View>
    </View>
  );
}
