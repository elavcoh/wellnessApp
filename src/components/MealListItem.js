/**
 * MealListItem.js
 *
 * Purpose: Shows one saved meal in the "Today's Meals" list (photo, type,
 * description, calories, time, and a delete button).
 * Related to: used by NutritionScreen.js.
 */

import { Image, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { resolveMealPhotoUri } from '../services/photoStorage';
import PressableScale from './PressableScale';
import { colors } from '../styles/theme';
import { mealListItemStyles as styles } from '../styles/components.styles';

// Props:
//   meal     - one row straight from the meals SQLite table (see mealsRepository.js)
//   onDelete - called with meal.id when the ✕ button is tapped
export default function MealListItem({ meal, onDelete }) {
  return (
    <View style={styles.row}>
      {/* Only show a thumbnail if this meal actually has a saved photo.
          photo_uri is stored relative to the app's folder - see photoStorage.js. */}
      {meal.photo_uri ? (
        <Image source={{ uri: resolveMealPhotoUri(meal.photo_uri) }} style={styles.thumbnail} />
      ) : null}
      <View style={styles.info}>
        <Text style={styles.mealType}>
          {meal.meal_type}
          {/* "· AI" only appears if this meal was saved with a confirmed AI
              analysis (photo or typed description) - detected_foods_json is
              null for meals whose values were typed in by hand. */}
          {meal.detected_foods_json ? ' · AI' : ''}
        </Text>
        <Text style={styles.description}>{meal.description}</Text>
        {/* typeof check (not just "if meal.estimated_calories") because a
            meal saved before this feature existed has this field as null,
            and "~null kcal" would look broken - we just hide the line instead. */}
        {typeof meal.estimated_calories === 'number' && (
          <Text style={styles.calories}>~{meal.estimated_calories} kcal</Text>
        )}
      </View>
      <Text style={styles.time}>{meal.time}</Text>
      <PressableScale onPress={() => onDelete(meal.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={18} color={colors.textSoft} />
      </PressableScale>
    </View>
  );
}
