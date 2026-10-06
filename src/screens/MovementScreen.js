/**
 * MovementScreen.js
 *
 * Purpose: Shows today's steps and the last 7 days, and lets the user create
 * today's workout and check off its exercises.
 * Related to: AppTabs.js. Uses stepService.js, workoutsRepository.js,
 * workoutTemplates.js. Styles in styles/MovementScreen.styles.js.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import StepProgressBar from '../components/StepProgressBar';
import ExerciseItem from '../components/ExerciseItem';
import { syncRecentSteps } from '../services/stepService';
import { getRecentSteps } from '../database/repositories/stepsRepository';
import {
  completeWorkout,
  createWorkout,
  getWorkoutForDate,
  statusForExercises,
  updateExercises,
} from '../database/repositories/workoutsRepository';
import { getProfile } from '../database/repositories/userProfileRepository';
import { selectWorkoutTemplate } from '../constants/workoutTemplates';
import { getTodayDateString } from '../utils/dateUtils';
import PressableScale from '../components/PressableScale';
import { colors } from '../styles/theme';
import styles from '../styles/MovementScreen.styles';

// This screen is the app's daily movement dashboard. It combines three pieces
// of data: the device's step count, the user's saved step goal, and a
// generated workout plan for the day. The screen is intentionally split into
// browser-like "live UI" state (status, todaySteps, workout) and persistence
// layer calls (syncRecentSteps, createWorkout, updateExercises) so the screen
// always reflects both the current device reading and the stored historical data.
export default function MovementScreen() {
  // status covers the Pedometer part of the screen only (the workout part
  // below always renders regardless of step status):
  //   loading     - checking Pedometer availability/permission right now
  //   ok          - steps are working, show the steps card + history
  //   unsupported - this device has no step-counting hardware (e.g. Simulator)
  //   denied      - user has not granted Motion & Fitness permission
  //   error       - reading steps failed (e.g. Core Motion threw an error)
  const [status, setStatus] = useState('loading');
  const [todaySteps, setTodaySteps] = useState(0);
  const [stepGoal, setStepGoal] = useState(null); // from the profile, or null if not set
  const [recentHistory, setRecentHistory] = useState([]); // last 7 days of saved step counts

  const [profile, setProfile] = useState(null); // needed for step goal + workout template choice
  const [workout, setWorkout] = useState(null); // today's workout, or null if none generated yet
  // Always the latest workout, updated the moment it changes. Exercise taps
  // build on this instead of `workout`, which only updates on the next
  // render - otherwise two fast taps both start from the same old list and
  // the second save undoes the first.
  const workoutRef = useRef(null);
  // Exercise saves run one after another in tap order, so an older list
  // can never be written over a newer one.
  const saveQueueRef = useRef(Promise.resolve());
  // Lock so a double-tap on "Generate Today's Workout" only creates one
  // workout (the database allows one per day and would reject the second).
  // A ref, not state, because it has to change before the next render.
  const generatingRef = useRef(false);

  // Syncs the last 7 days of steps from the Pedometer into SQLite (see
  // stepService.js), then shows today's count + history. Runs whenever the
  // screen is opened or the app comes back to the foreground - iOS does not
  // let us reliably wake up in the background to do this.
  // Any failure shows the "unavailable" message instead of leaving the
  // spinner on screen forever (HomeScreen.js does the same).
  const refreshSteps = useCallback(async () => {
    try {
      const profileRow = await getProfile();
      setProfile(profileRow);
      setStepGoal(profileRow?.step_goal ?? null);

      const result = await syncRecentSteps();

      if (!result.supported) {
        setStatus('unsupported');
        return;
      }
      if (!result.granted) {
        setStatus('denied');
        return;
      }

      setTodaySteps(result.steps);
      setStatus('ok');

      const history = await getRecentSteps(7);
      setRecentHistory(history);
    } catch (error) {
      setStatus('error');
    }
  }, []);

  // Puts a workout on screen and keeps workoutRef in step with it.
  const showWorkout = useCallback((nextWorkout) => {
    workoutRef.current = nextWorkout;
    setWorkout(nextWorkout);
  }, []);

  // Reads today's workout from SQLite (or null if none exists yet).
  const loadWorkout = useCallback(async () => {
    const todaysWorkout = await getWorkoutForDate(getTodayDateString());
    showWorkout(todaysWorkout);
  }, [showWorkout]);

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
  // If today already has a workout (e.g. created a moment ago), it just
  // shows that one instead of trying to create a second.
  async function handleGenerateWorkout() {
    if (generatingRef.current) return; // already generating - ignore this tap
    generatingRef.current = true;
    try {
      const date = getTodayDateString();
      const existing = await getWorkoutForDate(date);
      if (existing) {
        showWorkout(existing);
        return;
      }

      // The profile normally loaded already (refreshSteps), but if Generate
      // was tapped first, read it now - otherwise a Beginner would get the
      // default (intermediate) plan.
      const currentProfile = profile ?? (await getProfile());
      const template = selectWorkoutTemplate(currentProfile);
      const exercises = template.exercises.map((exercise) => ({ ...exercise, completed: false }));
      const created = await createWorkout({
        date,
        workoutName: template.name,
        location: currentProfile?.training_location ?? 'Home',
        goal: currentProfile?.goal ?? null,
        exercises,
      });
      showWorkout(created);
    } catch (error) {
      // Most likely today's workout was created some other way in the
      // meantime - just show whatever is saved now.
      loadWorkout();
    } finally {
      generatingRef.current = false;
    }
  }

  // Flips one exercise's completed flag on/off. The screen updates right
  // away (status worked out the same way the database does), then the whole
  // list is saved (SQLite stores it as one JSON blob, not individual rows).
  // If the save fails, re-read what's really saved.
  function handleToggleExercise(index) {
    const current = workoutRef.current;
    if (!current) return;
    const updatedExercises = current.exercises.map((exercise, i) =>
      i === index ? { ...exercise, completed: !exercise.completed } : exercise
    );
    showWorkout({ ...current, exercises: updatedExercises, status: statusForExercises(updatedExercises) });
    saveQueueRef.current = saveQueueRef.current
      .then(() => updateExercises(current.id, updatedExercises))
      .catch(() => loadWorkout());
  }

  // The "Mark Workout Complete" button - marks every exercise done at once,
  // even ones the user never individually checked.
  async function handleCompleteWorkout() {
    const current = workoutRef.current;
    if (!current) return;
    await saveQueueRef.current; // let any exercise taps finish saving first
    await completeWorkout(current.id, current.exercises);
    loadWorkout();
  }

  // 0 to 1 (or more, if the user exceeded their goal) for the progress bar.
  const progress = stepGoal ? todaySteps / stepGoal : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.overline}>Steps & workouts</Text>
      <Text style={styles.title}>Movement</Text>

      {status === 'loading' && (
        <ActivityIndicator size="large" color={colors.primary} style={styles.centerBlock} />
      )}

      {status === 'unsupported' && (
        <Text style={styles.messageText}>
          Step tracking isn't available on this device. This feature needs a physical iPhone (it
          doesn't work in the Simulator).
        </Text>
      )}

      {status === 'error' && (
        <Text style={styles.messageText}>
          Steps are unavailable right now. Try again in a moment.
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
            <View style={styles.stepsIcon}>
              <Ionicons name="footsteps" size={22} color={colors.primary} />
            </View>
            <Text style={styles.stepsLabel}>Today's Steps</Text>
            <Text style={styles.stepsCount}>{todaySteps.toLocaleString()}</Text>

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
              <View style={styles.historyDot} />
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
          <View style={styles.workoutIcon}>
            <Ionicons name="barbell" size={22} color={colors.accent} />
          </View>
          <Text style={styles.messageText}>No workout planned for today yet.</Text>
          <PressableScale style={styles.generateButton} onPress={handleGenerateWorkout}>
            <Ionicons name="sparkles" size={16} color={colors.textOnColor} />
            <Text style={styles.generateButtonText}>Generate Today's Workout</Text>
          </PressableScale>
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
            <View style={styles.workoutCompletedRow}>
              <Ionicons name="trophy" size={18} color={colors.primary} />
              <Text style={styles.workoutCompletedText}>Workout completed</Text>
            </View>
          ) : (
            <PressableScale style={styles.generateButton} onPress={handleCompleteWorkout}>
              <Ionicons name="checkmark-done" size={18} color={colors.textOnColor} />
              <Text style={styles.generateButtonText}>Mark Workout Complete</Text>
            </PressableScale>
          )}
        </View>
      )}
    </ScrollView>
  );
}
