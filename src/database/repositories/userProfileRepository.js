/**
 * userProfileRepository.js
 *
 * Purpose: Reads and writes the single user_profile row in SQLite.
 * Related to: used by ProfileSetupScreen.js (create/edit), and read by
 * several screens/services (Movement, Nutrition, AI Coach context) that
 * need profile fields like goal, weight, or step_goal.
 */

import { getDb } from '../db';

// The app only ever has one local user, so this table only ever has one row.
export async function getProfile() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM user_profile ORDER BY id LIMIT 1;');
  return row ?? null;
}

// Inserts the profile the first time, updates it every time after that.
export async function saveProfile(profile) {
  const db = await getDb();
  const existing = await getProfile();
  const now = new Date().toISOString();

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

  if (existing) {
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
