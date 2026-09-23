/**
 * mealsRepository.js
 *
 * Purpose: Reads and writes logged meals in SQLite (manual meals and
 * AI-analyzed meals both go through the same table).
 * Related to: used by NutritionScreen.js (add/delete/list meals),
 * wellnessContextBuilder.js (today's meals for the AI Coach), and
 * ProgressScreen.js (meal counts per day).
 */

import { getDb } from '../db';

// Returns all meals logged on one specific date, newest first.
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

export async function deleteMeal(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM meals WHERE id = ?;', [id]);
}

// Returns how many meals were logged on each of the last N days.
// Used by ProgressScreen.js to draw the "Meals Logged" chart.
export async function getMealCountsByDate(days) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT date, COUNT(*) as count FROM meals GROUP BY date ORDER BY date DESC LIMIT ?;',
    [days]
  );
}
