/**
 * DetectedFoodItem.js
 *
 * Purpose: Shows one food detected by AI in a meal photo, with its
 * estimated calories/protein/carbs/fat, and a button to remove it if the
 * AI got it wrong.
 * Related to: used by NutritionScreen.js's "review before saving" step.
 */

import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { colors } from '../styles/theme';
import { detectedFoodItemStyles as styles } from '../styles/components.styles';

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
      <PressableScale onPress={onRemove} style={styles.removeButton}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </PressableScale>
    </View>
  );
}
