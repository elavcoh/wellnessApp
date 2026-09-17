import { StyleSheet, Text, View } from 'react-native';

export default function RecommendationCard({ recommendation }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{recommendation.title}</Text>
      <Text style={styles.reason}>{recommendation.reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  reason: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});
