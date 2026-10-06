/**
 * ProgressScreen.js
 *
 * Purpose: Simple 7-day charts for steps, meals, workouts and breathing. Read-only -
 * this screen never writes anything.
 * Related to: AppTabs.js. Reads from the repositories. Styles in
 * styles/ProgressScreen.styles.js.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import BarRow from '../components/BarRow';
import { getRecentSteps } from '../database/repositories/stepsRepository';
import { getMealCountsByDate } from '../database/repositories/mealsRepository';
import { getRecentWorkouts } from '../database/repositories/workoutsRepository';
import { getBreathingCountsByDate } from '../database/repositories/breathingRepository';
import { getLastNDateStrings, getWeekdayLabel } from '../utils/dateUtils';
import { colors } from '../styles/theme';
import styles from '../styles/ProgressScreen.styles';

// This screen is effectively a mini dashboard for the last 7 days. It does not
// calculate anything new or make any recommendations; it only reads the existing
// database, turns it into a simple day-by-day series, and visualizes that trend
// so the user can quickly see patterns in steps, meals, workouts, and breathing.
const DAYS = 7;

// One "series" per chart: 7 entries (one per day), oldest first.
export default function ProgressScreen() {
  const [stepsSeries, setStepsSeries] = useState([]);
  const [mealsSeries, setMealsSeries] = useState([]);
  const [workoutsSeries, setWorkoutsSeries] = useState([]);
  const [breathingSeries, setBreathingSeries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Builds the last 7 days of data for each chart. Missing step days are
  // kept as null (no data), not 0, so the chart doesn't invent activity
  // that was never measured.
  const loadProgress = useCallback(async () => {
    // The fixed list of the last 7 calendar dates, e.g.
    // ["2026-09-17", ..., "2026-09-23"] - this is the x-axis every chart
    // below is built around, regardless of which days actually have data.
    const dates = getLastNDateStrings(DAYS);

    const [stepsRows, mealRows, workoutRows, breathingRows] = await Promise.all([
      getRecentSteps(DAYS),
      getMealCountsByDate(DAYS),
      getRecentWorkouts(DAYS),
      getBreathingCountsByDate(DAYS),
    ]);

    // Each repository returns only the rows that exist (e.g. just 3 rows if
    // steps were only recorded on 3 of the last 7 days). Turning each list
    // into a {date: value} lookup object makes it easy to ask "what was the
    // value on this specific date, if any?" in the .map() calls below.
    const byDate = (rows, getValue) => Object.fromEntries(rows.map((row) => [row.date, getValue(row)]));
    const stepsByDate = byDate(stepsRows, (row) => row.step_count);
    const mealsByDate = byDate(mealRows, (row) => row.count);
    const workoutsByDate = byDate(workoutRows, (row) => row);
    const breathingByDate = byDate(breathingRows, (row) => row.count);

    // One entry per day of the week for a chart: the date, its short
    // weekday label ("Tue") and whatever values that chart needs.
    const perDay = (getValues) =>
      dates.map((date) => ({ date, label: getWeekdayLabel(date), ...getValues(date) }));

    // null = no data recorded that day, different from a measured 0.
    setStepsSeries(perDay((date) => ({ steps: date in stepsByDate ? stepsByDate[date] : null })));
    setMealsSeries(perDay((date) => ({ count: mealsByDate[date] ?? 0 })));
    setWorkoutsSeries(
      perDay((date) => ({
        completed: workoutsByDate[date]?.status === 'completed',
        hasWorkout: Boolean(workoutsByDate[date]),
      }))
    );
    setBreathingSeries(perDay((date) => ({ count: breathingByDate[date] ?? 0 })));
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  // --- Summary numbers shown above each chart, all derived from the series above ---
  // Average only counts days that actually have a step reading - a day
  // with no data (null) is excluded rather than treated as a 0, so it
  // can't drag the average down for a day that was never measured.
  const daysWithSteps = stepsSeries.filter((day) => day.steps !== null);
  const averageSteps = daysWithSteps.length
    ? Math.round(daysWithSteps.reduce((sum, day) => sum + day.steps, 0) / daysWithSteps.length)
    : null;
  // maxSteps sets the "full bar" reference for BarRow - at least 1, so we
  // never divide by zero if every day so far has 0 steps.
  const maxSteps = Math.max(1, ...daysWithSteps.map((day) => day.steps));

  const totalMeals = mealsSeries.reduce((sum, day) => sum + day.count, 0);
  const maxMeals = Math.max(1, ...mealsSeries.map((day) => day.count));

  const workoutsCompletedCount = workoutsSeries.filter((day) => day.completed).length;

  const totalBreathingSessions = breathingSeries.reduce((sum, day) => sum + day.count, 0);
  const maxBreathing = Math.max(1, ...breathingSeries.map((day) => day.count));

  const hasAnyData =
    daysWithSteps.length > 0 ||
    totalMeals > 0 ||
    workoutsSeries.some((day) => day.hasWorkout) ||
    totalBreathingSessions > 0;

  if (!loaded) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.subtitle}>This Week</Text>
      <Text style={styles.title}>Progress</Text>

      {!hasAnyData && (
        <Text style={styles.emptyText}>
          No activity logged in the last {DAYS} days yet. Once you log meals, steps, workouts, or
          breathing sessions, your trends will show up here.
        </Text>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="walk" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Steps</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          {averageSteps !== null ? `Average: ${averageSteps.toLocaleString()}` : 'No step data yet'}
        </Text>
        {stepsSeries.map((day) => (
          <BarRow
            key={day.date}
            label={day.label}
            value={day.steps ?? 0}
            maxValue={maxSteps}
            valueLabel={day.steps !== null ? day.steps.toLocaleString() : ''}
            noData={day.steps === null}
          />
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="nutrition" size={18} color={colors.accent} />
          <Text style={styles.cardTitle}>Meals Logged</Text>
        </View>
        {mealsSeries.map((day) => (
          <BarRow
            key={day.date}
            label={day.label}
            value={day.count}
            maxValue={maxMeals}
            valueLabel={String(day.count)}
          />
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="barbell" size={18} color={colors.accent} />
          <Text style={styles.cardTitle}>Workouts</Text>
        </View>
        <Text style={styles.cardSubtitle}>{workoutsCompletedCount} completed this week</Text>
        <View style={styles.dotsRow}>
          {workoutsSeries.map((day) => (
            <View key={day.date} style={styles.dotColumn}>
              <View
                style={[
                  styles.dot,
                  day.completed && styles.dotCompleted,
                  !day.hasWorkout && styles.dotEmpty,
                ]}
              />
              <Text style={styles.dotLabel}>{day.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="leaf" size={18} color={colors.calm} />
          <Text style={styles.cardTitle}>Breathing</Text>
        </View>
        <Text style={styles.cardSubtitle}>{totalBreathingSessions} sessions this week</Text>
        {breathingSeries.map((day) => (
          <BarRow
            key={day.date}
            label={day.label}
            value={day.count}
            maxValue={maxBreathing}
            valueLabel={String(day.count)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
