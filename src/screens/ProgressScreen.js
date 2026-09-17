import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import BarRow from '../components/BarRow';
import { getRecentSteps } from '../database/repositories/stepsRepository';
import { getMealCountsByDate } from '../database/repositories/mealsRepository';
import { getRecentWorkouts } from '../database/repositories/workoutsRepository';
import { getBreathingCountsByDate } from '../database/repositories/breathingRepository';
import { getLastNDateStrings, getWeekdayLabel } from '../utils/dateUtils';

const DAYS = 7;

export default function ProgressScreen() {
  const [stepsSeries, setStepsSeries] = useState([]);
  const [mealsSeries, setMealsSeries] = useState([]);
  const [workoutsSeries, setWorkoutsSeries] = useState([]);
  const [breathingSeries, setBreathingSeries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadProgress = useCallback(async () => {
    const dates = getLastNDateStrings(DAYS);

    const [stepsRows, mealRows, workoutRows, breathingRows] = await Promise.all([
      getRecentSteps(DAYS),
      getMealCountsByDate(DAYS),
      getRecentWorkouts(DAYS),
      getBreathingCountsByDate(DAYS),
    ]);

    const stepsByDate = Object.fromEntries(stepsRows.map((row) => [row.date, row.step_count]));
    const mealsByDate = Object.fromEntries(mealRows.map((row) => [row.date, row.count]));
    const workoutsByDate = Object.fromEntries(workoutRows.map((row) => [row.date, row]));
    const breathingByDate = Object.fromEntries(breathingRows.map((row) => [row.date, row.count]));

    setStepsSeries(
      dates.map((date) => ({
        date,
        label: getWeekdayLabel(date),
        // null = no data recorded that day, distinct from a confirmed 0
        steps: date in stepsByDate ? stepsByDate[date] : null,
      }))
    );
    setMealsSeries(
      dates.map((date) => ({
        date,
        label: getWeekdayLabel(date),
        count: mealsByDate[date] ?? 0,
      }))
    );
    setWorkoutsSeries(
      dates.map((date) => ({
        date,
        label: getWeekdayLabel(date),
        completed: workoutsByDate[date]?.status === 'completed',
        hasWorkout: Boolean(workoutsByDate[date]),
      }))
    );
    setBreathingSeries(
      dates.map((date) => ({
        date,
        label: getWeekdayLabel(date),
        count: breathingByDate[date] ?? 0,
      }))
    );
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const daysWithSteps = stepsSeries.filter((day) => day.steps !== null);
  const averageSteps = daysWithSteps.length
    ? Math.round(daysWithSteps.reduce((sum, day) => sum + day.steps, 0) / daysWithSteps.length)
    : null;
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
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>This Week</Text>

      {!hasAnyData && (
        <Text style={styles.emptyText}>
          No activity logged in the last {DAYS} days yet. Once you log meals, steps, workouts, or
          breathing sessions, your trends will show up here.
        </Text>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Steps</Text>
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
        <Text style={styles.cardTitle}>Meals Logged</Text>
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
        <Text style={styles.cardTitle}>Workouts</Text>
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
        <Text style={styles.cardTitle}>Breathing</Text>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dotColumn: {
    alignItems: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
    marginBottom: 4,
  },
  dotCompleted: {
    backgroundColor: '#2f8f5b',
    borderColor: '#2f8f5b',
  },
  dotEmpty: {
    borderColor: '#eee',
  },
  dotLabel: {
    fontSize: 11,
    color: '#666',
  },
});
