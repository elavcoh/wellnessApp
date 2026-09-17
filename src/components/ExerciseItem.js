import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ExerciseItem({ exercise, onToggle }) {
  return (
    <Pressable style={styles.row} onPress={onToggle}>
      <View style={[styles.checkbox, exercise.completed && styles.checkboxChecked]}>
        {exercise.completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, exercise.completed && styles.nameCompleted]}>
          {exercise.name}
        </Text>
        <Text style={styles.detail}>
          {exercise.sets} sets × {exercise.reps}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2f8f5b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#2f8f5b',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  detail: {
    fontSize: 13,
    color: '#777',
    marginTop: 1,
  },
});
