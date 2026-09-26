/**
 * Reads and saves the single profile row.
 */

import { getDb } from '../db';

// The app only ever has one local user, so this table only ever has one row.
// "SELECT *" means "get every column". "ORDER BY id LIMIT 1" just means
// "give me one row, the first one" - since there's only ever one row
// anyway, this is really just "get the profile, if it exists".
export async function getProfile() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM user_profile ORDER BY id LIMIT 1;');
  return row ?? null; // getFirstAsync returns undefined if no row exists - normalize that to null
}

// Inserts the profile the first time, updates it every time after that.
// This "insert if new, otherwise update" pattern is sometimes called an
// "upsert" - SQLite doesn't do it for us automatically here, so we check
// first with getProfile() and pick INSERT or UPDATE ourselves below.
export async function saveProfile(profile) {
  const db = await getDb();
  const existing = await getProfile();
  const now = new Date().toISOString();

  // One array of values, in the same order the "?" placeholders appear in
  // both SQL statements below - this avoids typing the same 13 values twice.
  const values = [
    profile.age,
    profile.heightCm,
    profile.weightKg,
    profile.goal,
    profile.activityLevel,
    profile.workoutExperience,
    profile.workoutDaysPerWeek,
    profile.trainingLocation,
    profile.dietaryPreference,
    profile.avoidedFoods,
    profile.stepGoal,
    profile.sex,
    profile.calorieTargetOverride,
  ];

  // Each "?" in the SQL text is a placeholder - it gets filled in, in
  // order, by the matching value in the array passed as the second
  // argument. Using "?" instead of pasting values directly into the SQL
  // string is what protects against SQL injection, and also correctly
  // handles special characters (quotes, etc.) inside text the user typed.
  if (existing) {
    // Profile already exists - update the one row that's already there.
    // "WHERE id = ?" is what makes sure we only touch that one row.
    await db.runAsync(
      `UPDATE user_profile SET
        age = ?, height_cm = ?, weight_kg = ?, goal = ?, activity_level = ?,
        workout_experience = ?, workout_days_per_week = ?, training_location = ?,
        dietary_preference = ?, avoided_foods = ?, step_goal = ?, sex = ?,
        calorie_target_override = ?, updated_at = ?
       WHERE id = ?;`,
      [...values, now, existing.id]
    );
  } else {
    // No profile yet - create the first (and only) row.
    await db.runAsync(
      `INSERT INTO user_profile
        (age, height_cm, weight_kg, goal, activity_level, workout_experience,
         workout_days_per_week, training_location, dietary_preference, avoided_foods,
         step_goal, sex, calorie_target_override, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [...values, now, now]
    );
  }
}
