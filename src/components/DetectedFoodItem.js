import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function DetectedFoodItem({ food, onRemove }) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{food.name}</Text>
        <Text style={styles.detail}>
          {food.portion_description} · {food.category}
        </Text>
        {typeof food.estimated_calories === 'number' && (
          <Text style={styles.calories}>
            ~{food.estimated_calories} kcal · P {food.estimated_protein_g}g · C{' '}
            {food.estimated_carbs_g}g · F {food.estimated_fat_g}g
          </Text>
        )}
      </View>
      <Pressable onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  detail: {
    fontSize: 13,
    color: '#777',
    marginTop: 1,
  },
  calories: {
    fontSize: 12,
    color: '#3a6ea5',
    marginTop: 2,
  },
  removeButton: {
    padding: 6,
  },
  removeText: {
    fontSize: 14,
    color: '#c0392b',
  },
});
