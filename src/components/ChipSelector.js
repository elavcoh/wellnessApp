/**
 * ChipSelector.js
 *
 * Purpose: A row of tappable "chip" buttons for choosing one option from a
 * short list (e.g. Goal, Activity Level, Sex).
 * Related to: used by ProfileSetupScreen.js and NutritionScreen.js.
 */

import { Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { chipSelectorStyles as styles } from '../styles/components.styles';

// Props:
//   label    - text shown above the chips, e.g. "Goal"
//   options  - array of strings to choose from, e.g. ["Male", "Female"]
//   selected - which option is currently chosen (or null if none yet)
//   onSelect - called with the option text when the user taps a chip
export default function ChipSelector({ label, options, selected, onSelect }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {/* One chip per option. The parent decides what "selected" means -
            this component just compares each option to it and highlights
            the match. It has no state of its own. */}
        {options.map((option) => {
          const isSelected = option === selected;
          return (
            <PressableScale
              key={option}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
