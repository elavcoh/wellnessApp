import { getDb } from '../db';

export async function getMealsForDate(date) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM meals WHERE date = ? ORDER BY time DESC;', [date]);
}

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

export async function getMealCountsByDate(days) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT date, COUNT(*) as count FROM meals GROUP BY date ORDER BY date DESC LIMIT ?;',
    [days]
  );
}
