import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import StepProgressBar from '../components/StepProgressBar';
import ExerciseItem from '../components/ExerciseItem';
import { getTodayStepCount } from '../services/stepService';
import { getRecentSteps, saveTodaySteps } from '../database/repositories/stepsRepository';
import {
  completeWorkout,
  createWorkout,
  getWorkoutForDate,
  updateExercises,
} from '../database/repositories/workoutsRepository';
import { getProfile } from '../database/repositories/userProfileRepository';
import { selectWorkoutTemplate } from '../constants/workoutTemplates';
import { getTodayDateString } from '../utils/dateUtils';

export default function MovementScreen() {
  // loading | ok | unsupported | denied
  const [status, setStatus] = useState('loading');
  const [todaySteps, setTodaySteps] = useState(0);
  const [stepGoal, setStepGoal] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);

  const [profile, setProfile] = useState(null);
  const [workout, setWorkout] = useState(null);

  const refreshSteps = useCallback(async () => {
    const profileRow = await getProfile();
    setProfile(profileRow);
    const goal = profileRow?.step_goal ?? null;
    setStepGoal(goal);

    const result = await getTodayStepCount();

    if (!result.supported) {
      setStatus('unsupported');
      return;
    }
    if (!result.granted) {
      setStatus('denied');
      return;
    }

    await saveTodaySteps({
      date: getTodayDateString(),
      stepCount: result.steps,
      stepGoalSnapshot: goal,
      source: 'pedometer',
    });

    setTodaySteps(result.steps);
    setStatus('ok');

    const history = await getRecentSteps(7);
    setRecentHistory(history);
  }, []);

  const loadWorkout = useCallback(async () => {
    const todaysWorkout = await getWorkoutForDate(getTodayDateString());
    setWorkout(todaysWorkout);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSteps();
      loadWorkout();
    }, [refreshSteps, loadWorkout])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshSteps();
        loadWorkout();
      }
    });
    return () => subscription.remove();
  }, [refreshSteps, loadWorkout]);

  async function handleGenerateWorkout() {
    const template = selectWorkoutTemplate(profile);
    const exercises = template.exercises.map((exercise) => ({ ...exercise, completed: false }));
    const created = await createWorkout({
      date: getTodayDateString(),
      workoutName: template.name,
      location: profile?.training_location ?? 'Home',
      goal: profile?.goal ?? null,
      exercises,
    });
    setWorkout(created);
  }

  async function handleToggleExercise(index) {
    const updatedExercises = workout.exercises.map((exercise, i) =>
      i === index ? { ...exercise, completed: !exercise.completed } : exercise
    );
    await updateExercises(workout.id, updatedExercises);
    loadWorkout();
  }

  async function handleCompleteWorkout() {
    await completeWorkout(workout.id, workout.exercises);
    loadWorkout();
  }

  const progress = stepGoal ? todaySteps / stepGoal : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Movement</Text>

      {status === 'loading' && <ActivityIndicator size="large" style={styles.centerBlock} />}

      {status === 'unsupported' && (
        <Text style={styles.messageText}>
          Step tracking isn't available on this device. This feature needs a physical iPhone (it
          doesn't work in the Simulator).
        </Text>
      )}

      {status === 'denied' && (
        <Text style={styles.messageText}>
          Motion & Fitness permission is needed to show your steps. You can enable it in
          Settings → Privacy & Security → Motion & Fitness.
        </Text>
      )}

      {status === 'ok' && (
        <>
          <View style={styles.stepsCard}>
            <Text style={styles.stepsCount}>{todaySteps.toLocaleString()}</Text>
            <Text style={styles.stepsLabel}>Today's Steps</Text>

            {stepGoal ? (
              <>
                <StepProgressBar progress={progress} />
                <Text style={styles.goalText}>
                  Goal: {stepGoal.toLocaleString()} ({Math.round(progress * 100)}%)
                </Text>
              </>
            ) : (
              <Text style={styles.goalText}>
                No step goal set yet - add one in your profile.
              </Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Recent History</Text>
          {recentHistory.length === 0 && (
            <Text style={styles.messageText}>No step history yet.</Text>
          )}
          {recentHistory.map((day) => (
            <View key={day.date} style={styles.historyRow}>
              <Text style={styles.historyDate}>{day.date}</Text>
              <Text style={styles.historySteps}>{day.step_count.toLocaleString()} steps</Text>
            </View>
          ))}
        </>
      )}

      <Text style={[styles.sectionTitle, styles.workoutsSectionTitle]}>Workouts</Text>

      {!workout && (
        <View style={styles.workoutCard}>
          <Text style={styles.messageText}>No workout planned for today yet.</Text>
          <Pressable style={styles.generateButton} onPress={handleGenerateWorkout}>
            <Text style={styles.generateButtonText}>Generate Today's Workout</Text>
          </Pressable>
        </View>
      )}

      {workout && (
        <View style={styles.workoutCard}>
          <Text style={styles.workoutName}>{workout.workout_name}</Text>
          <Text style={styles.workoutMeta}>
            {workout.location}
            {workout.goal ? ` · ${workout.goal}` : ''}
          </Text>

          {workout.exercises.map((exercise, index) => (
            <ExerciseItem
              key={exercise.name}
              exercise={exercise}
              onToggle={() => handleToggleExercise(index)}
            />
          ))}

          {workout.status === 'completed' ? (
            <Text style={styles.workoutCompletedText}>Workout completed ✓</Text>
          ) : (
            <Pressable style={styles.generateButton} onPress={handleCompleteWorkout}>
              <Text style={styles.generateButtonText}>Mark Workout Complete</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  centerBlock: {
    marginTop: 40,
  },
  messageText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  stepsCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  stepsCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2f8f5b',
  },
  stepsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  goalText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyDate: {
    fontSize: 14,
    color: '#333',
  },
  historySteps: {
    fontSize: 14,
    color: '#666',
  },
  workoutsSectionTitle: {
    marginTop: 8,
  },
  workoutCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
  },
  workoutMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  generateButton: {
    backgroundColor: '#2f8f5b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  workoutCompletedText: {
    color: '#2f8f5b',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
});
