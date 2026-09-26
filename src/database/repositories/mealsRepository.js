/**
 * Reads and saves meals in SQLite.
 */

import { getDb } from '../db';

// Returns all meals logged on one specific date, newest first.
// getAllAsync (as opposed to getFirstAsync) is used because there can be
// many meals on one date - it returns an array, even if it's empty.
export async function getMealsForDate(date) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM meals WHERE date = ? ORDER BY time DESC;', [date]);
}

// Saves one meal. photoUri/detectedFoodsJson/estimatedCalories/estimatedProteinG
// are optional - a manual meal with no photo just leaves them null.
export async function addMeal({
  mealType,
  description,
  date,
  time,
  photoUri,
  detectedFoodsJson,
  estimatedCalories,
  estimatedProteinG,
}) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO meals
      (meal_type, description, date, time, photo_uri, detected_foods_json, estimated_calories, estimated_protein_g, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      mealType,
      description,
      date,
      time,
      photoUri ?? null,
      detectedFoodsJson ?? null,
      estimatedCalories ?? null,
      estimatedProteinG ?? null,
      now,
    ]
  );
}

// Permanently removes one meal by its id (the ✕ button in the meal list).
export async function deleteMeal(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM meals WHERE id = ?;', [id]);
}

// Returns how many meals were logged on each of the last N days.
// Used by ProgressScreen.js to draw the "Meals Logged" chart.
//
// "GROUP BY date" is what turns many individual meal rows into one row per
// date - e.g. 3 separate meal rows all with date "2026-09-24" become one
// result row: { date: "2026-09-24", count: 3 }. "COUNT(*) as count" counts
// how many original rows were grouped together, and names that number "count".
export async function getMealCountsByDate(days) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT date, COUNT(*) as count FROM meals GROUP BY date ORDER BY date DESC LIMIT ?;',
    [days]
  );
}
