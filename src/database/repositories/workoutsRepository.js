import { getDb } from '../db';

function rowToWorkout(row) {
  if (!row) return null;
  return { ...row, exercises: JSON.parse(row.exercises_json) };
}

export async function getWorkoutForDate(date) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM workouts WHERE date = ?;', [date]);
  return rowToWorkout(row);
}

export async function getRecentWorkouts(days) {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM workouts ORDER BY date DESC LIMIT ?;', [days]);
  return rows.map(rowToWorkout);
}

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

function statusForExercises(exercises) {
  const allCompleted = exercises.every((e) => e.completed);
  if (allCompleted) return 'completed';
  const anyCompleted = exercises.some((e) => e.completed);
  return anyCompleted ? 'in_progress' : 'not_started';
}

export async function updateExercises(id, exercises) {
  const db = await getDb();
  const status = statusForExercises(exercises);
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  await db.runAsync(
    'UPDATE workouts SET exercises_json = ?, status = ?, completed_at = ? WHERE id = ?;',
    [JSON.stringify(exercises), status, completedAt, id]
  );
}

export async function completeWorkout(id, exercises) {
  const db = await getDb();
  const now = new Date().toISOString();
  const completedExercises = exercises.map((e) => ({ ...e, completed: true }));
  await db.runAsync(
    "UPDATE workouts SET exercises_json = ?, status = 'completed', completed_at = ? WHERE id = ?;",
    [JSON.stringify(completedExercises), now, id]
  );
}
