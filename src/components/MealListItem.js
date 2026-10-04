/**
 * MealListItem.js
 *
 * Purpose: Shows one saved meal in the "Today's Meals" list (photo, type,
 * description, calories, time, and a delete button).
 * Related to: used by NutritionScreen.js.
 */

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveMealPhotoUri } from '../services/photoStorage';

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
      <Pressable onPress={() => onDelete(meal.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  mealType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2f8f5b',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    marginTop: 2,
  },
  calories: {
    fontSize: 12,
    color: '#3a6ea5',
    marginTop: 1,
  },
  time: {
    fontSize: 14,
    color: '#888',
    marginRight: 12,
  },
  deleteButton: {
    padding: 6,
  },
  deleteText: {
    fontSize: 16,
    color: '#c0392b',
  },
});
