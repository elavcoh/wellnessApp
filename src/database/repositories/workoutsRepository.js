/**
 * workoutsRepository.js
 *
 * Purpose: Reads and writes the daily workout in SQLite. One workout per
 * day; exercises are stored as a JSON list inside one column.
 * Related to: used by MovementScreen.js (create/update today's workout),
 * HomeScreen.js (workout status), wellnessContextBuilder.js, and
 * ProgressScreen.js (workout completion chart).
 */

import { getDb } from '../db';

// Converts a raw SQLite row into a normal object with exercises as a real
// array (SQLite stores it as a JSON string, not a real array).
function rowToWorkout(row) {
  if (!row) return null;
  return { ...row, exercises: JSON.parse(row.exercises_json) };
}

// Returns today's (or any date's) workout, or null if none was created yet.
export async function getWorkoutForDate(date) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM workouts WHERE date = ?;', [date]);
  return rowToWorkout(row);
}

// Returns the most recent workouts, used for the Progress screen's weekly view.
export async function getRecentWorkouts(days) {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM workouts ORDER BY date DESC LIMIT ?;', [days]);
  return rows.map(rowToWorkout);
}

// Saves a brand-new workout for a date (from a template, see workoutTemplates.js).
export async function createWorkout({ date, workoutName, location, goal, exercises }) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO workouts (date, workout_name, location, goal, status, exercises_json, created_at)
     VALUES (?, ?, ?, ?, 'not_started', ?, ?);`,
    [date, workoutName, location, goal, JSON.stringify(exercises), now]
  );
  return getWorkoutForDate(date);
}

// Works out the workout's status from its exercises: no boxes checked =
// not_started, some checked = in_progress, all checked = completed.
function statusForExercises(exercises) {
  const allCompleted = exercises.every((e) => e.completed);
  if (allCompleted) return 'completed';
  const anyCompleted = exercises.some((e) => e.completed);
  return anyCompleted ? 'in_progress' : 'not_started';
}

// Saves the exercise list after the user checks/unchecks one exercise, and
// recalculates the workout's status automatically.
export async function updateExercises(id, exercises) {
  const db = await getDb();
  const status = statusForExercises(exercises);
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  await db.runAsync(
    'UPDATE workouts SET exercises_json = ?, status = ?, completed_at = ? WHERE id = ?;',
    [JSON.stringify(exercises), status, completedAt, id]
  );
}

// Marks every exercise as completed at once (the "Mark Workout Complete" button).
export async function completeWorkout(id, exercises) {
  const db = await getDb();
  const now = new Date().toISOString();
  const completedExercises = exercises.map((e) => ({ ...e, completed: true }));
  await db.runAsync(
    "UPDATE workouts SET exercises_json = ?, status = 'completed', completed_at = ? WHERE id = ?;",
    [JSON.stringify(completedExercises), now, id]
  );
}
