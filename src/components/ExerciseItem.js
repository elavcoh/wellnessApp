/**
 * ExerciseItem.js
 *
 * Purpose: Shows one exercise in a workout, with a checkbox the user taps
 * to mark it done.
 * Related to: used by MovementScreen.js.
 */

import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { colors } from '../styles/theme';
import { exerciseItemStyles as styles } from '../styles/components.styles';

// Props:
//   exercise - one item from a workout's exercises array: { name, sets,
//              reps, completed } (see workoutTemplates.js for where these
//              come from, and workoutsRepository.js for how they're saved)
//   onToggle - called (no arguments) when the whole row is tapped, to flip
//              this exercise's completed flag
export default function ExerciseItem({ exercise, onToggle }) {
  return (
    // The whole row is tappable, not just a small checkbox square - easier
    // to tap accurately on a phone screen.
    <PressableScale style={styles.row} onPress={onToggle}>
      <View style={[styles.checkbox, exercise.completed && styles.checkboxChecked]}>
        {/* Only draw the checkmark glyph when completed - otherwise the box is just empty. */}
        {exercise.completed && <Ionicons name="checkmark" size={16} color={colors.textOnColor} />}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, exercise.completed && styles.nameCompleted]}>
          {exercise.name}
        </Text>
        <Text style={styles.detail}>
          {exercise.sets} sets × {exercise.reps}
        </Text>
      </View>
    </PressableScale>
  );
}
