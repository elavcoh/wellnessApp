import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * MovementScreen.js
 *
 * Purpose: Shows today's step count and history from the Pedometer, and
 * lets the user generate a workout template and check off exercises.
 * Related to: one of the 6 main tabs. Uses stepService.js for the sensor
 * and workoutTemplates.js for the fixed workout plans.
 */

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
  // status covers the Pedometer part of the screen only (the workout part
  // below always renders regardless of step status):
  //   loading     - checking Pedometer availability/permission right now
  //   ok          - steps are working, show the steps card + history
  //   unsupported - this device has no step-counting hardware (e.g. Simulator)
  //   denied      - user has not granted Motion & Fitness permission
  const [status, setStatus] = useState('loading');
  const [todaySteps, setTodaySteps] = useState(0);
  const [stepGoal, setStepGoal] = useState(null); // from the profile, or null if not set
  const [recentHistory, setRecentHistory] = useState([]); // last 7 days of saved step counts

  const [profile, setProfile] = useState(null); // needed for step goal + workout template choice
  const [workout, setWorkout] = useState(null); // today's workout, or null if none generated yet

  // Reads today's steps from the Pedometer and saves them to SQLite. Runs
  // whenever the screen is opened or the app comes back to the foreground -
  // iOS does not let us reliably wake up in the background to do this.
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

  // Reads today's workout from SQLite (or null if none exists yet).
  const loadWorkout = useCallback(async () => {
    const todaysWorkout = await getWorkoutForDate(getTodayDateString());
    setWorkout(todaysWorkout);
  }, []);

  // Refresh both steps and the workout every time this tab is opened.
  useFocusEffect(
    useCallback(() => {
      refreshSteps();
      loadWorkout();
    }, [refreshSteps, loadWorkout])
  );

  // Also refresh whenever the whole app comes back to the foreground (e.g.
  // user was on the lock screen or another app) - this is the "best we can
  // do" replacement for background step polling, which iOS doesn't allow.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshSteps();
        loadWorkout();
      }
    });
    return () => subscription.remove(); // stop listening when the screen unmounts
  }, [refreshSteps, loadWorkout]);

  // Picks a fixed workout template (no AI) based on the user's profile.
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

  // Flips one exercise's completed flag on/off, saves the whole updated
  // list (SQLite stores it as one JSON blob, not individual rows), then
  // re-reads the workout so its derived status (see workoutsRepository.js)
  // is up to date.
  async function handleToggleExercise(index) {
    const updatedExercises = workout.exercises.map((exercise, i) =>
      i === index ? { ...exercise, completed: !exercise.completed } : exercise
    );
    await updateExercises(workout.id, updatedExercises);
    loadWorkout();
  }

  // The "Mark Workout Complete" button - marks every exercise done at once,
  // even ones the user never individually checked.
  async function handleCompleteWorkout() {
    await completeWorkout(workout.id, workout.exercises);
    loadWorkout();
  }

  // 0 to 1 (or more, if the user exceeded their goal) for the progress bar.
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

      {/* Two mutually-exclusive states: no workout yet (offer to generate
          one) or an existing workout (show it and let it be checked off).
          A workout is never regenerated once it exists for today. */}
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
