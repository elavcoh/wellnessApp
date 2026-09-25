/**
 * DetectedFoodItem.js
 *
 * Purpose: Shows one food detected by AI in a meal photo, with its
 * estimated calories/protein/carbs/fat, and a button to remove it if the
 * AI got it wrong.
 * Related to: used by NutritionScreen.js's "review before saving" step.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

// Props:
//   food     - one item from the AI's "foods" array (name, portion_description,
//              category, estimated_calories/protein_g/carbs_g/fat_g)
//   onRemove - called with no arguments when the ✕ is tapped; the parent
//              screen figures out which index this is and removes it
export default function DetectedFoodItem({ food, onRemove }) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{food.name}</Text>
        <Text style={styles.detail}>
          {food.portion_description} · {food.category}
        </Text>
        {/* This whole line is optional because it only appears for
            AI-detected foods, never for anything else - the typeof check
            is what makes that safe. */}
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
