/**
 * wellnessContextBuilder.js
 *
 * Purpose: Collects today's data (profile, meals, steps, workout, breathing) into one
 * JSON object that is sent to the AI Coach with every question.
 * Related to: AICoachScreen.js. Reads from all repositories and nutritionTargets.js.
 */

import { getProfile } from '../database/repositories/userProfileRepository';
import { getMealsForDate } from '../database/repositories/mealsRepository';
import { getStepsForDate } from '../database/repositories/stepsRepository';
import { getWorkoutForDate } from '../database/repositories/workoutsRepository';
import { getTodayCompletedSessions } from '../database/repositories/breathingRepository';
import { getTodayDateString } from '../utils/dateUtils';
import { calculateCalorieTarget, calculateProteinTarget, sumField } from './nutritionTargets';

// Builds the full "today" context object from scratch, fresh every time it
// is called - never cached, so the AI Coach always sees the latest data.
// null means "no data recorded" (e.g. Movement hasn't been opened today, or
// no workout was generated) - kept distinct from 0/"not_started" so the AI
// never mistakes "not measured" for "confirmed zero activity".
export async function buildTodayContext() {
  const today = getTodayDateString();

  // Read all 5 sources at once (instead of one after another) since none
  // of them depend on each other - this makes the whole function faster.
  const [profile, meals, stepsRow, workout, breathingSessions] = await Promise.all([
    getProfile(),
    getMealsForDate(today),
    getStepsForDate(today),
    getWorkoutForDate(today),
    getTodayCompletedSessions(),
  ]);

  // Run the same deterministic formulas ProfileSetupScreen.js and
  // NutritionScreen.js use, so the AI Coach sees the exact same numbers
  // the user sees on screen - never a different, AI-computed version.
  const calorieTarget = calculateCalorieTarget(profile);
  const proteinTarget = calculateProteinTarget(profile);
  const caloriesLogged = sumField(meals, 'estimated_calories');
  const proteinLogged = sumField(meals, 'estimated_protein_g');

  return {
    // Only pick the fields the AI actually needs to reason about wellness -
    // not every column in the table (e.g. created_at/updated_at timestamps
    // are left out, they'd be meaningless to the AI).
    profile: profile
      ? {
          age: profile.age,
          height_cm: profile.height_cm,
          weight_kg: profile.weight_kg,
          sex: profile.sex,
          goal: profile.goal,
          activity_level: profile.activity_level,
          workout_experience: profile.workout_experience,
          workout_days_per_week: profile.workout_days_per_week,
          training_location: profile.training_location,
          dietary_preference: profile.dietary_preference,
          avoided_foods: profile.avoided_foods,
          step_goal: profile.step_goal,
        }
      : null,
    // Calculated deterministically by the app (see nutritionTargets.js), not
    // by the AI. null when the profile doesn't have enough data yet (e.g.
    // sex not set) - the AI must not invent a target in that case.
    nutrition_targets:
      calorieTarget || proteinTarget
        ? {
            estimated_calorie_target: calorieTarget,
            estimated_protein_target_g: proteinTarget,
          }
        : null,
    today: {
      // Each meal's stored detected_foods_json is a JSON *string* in
      // SQLite - parse it back into a real array here so the AI receives
      // actual JSON, not a string full of escaped quotes.
      meals: meals.map((meal) => ({
        meal_type: meal.meal_type,
        description: meal.description,
        estimated_calories: meal.estimated_calories ?? null,
        estimated_protein_g: meal.estimated_protein_g ?? null,
        detected_foods: meal.detected_foods_json
          ? JSON.parse(meal.detected_foods_json).foods
          : null,
      })),
      // "remaining" is done here in plain JS subtraction rather than left
      // for the AI to compute - see the "deterministic app logic vs AI"
      // rule this project follows (nutritionTargets.js has the full formula).
      estimated_calories_logged: caloriesLogged,
      estimated_calories_remaining: calorieTarget ? calorieTarget - caloriesLogged : null,
      estimated_protein_logged_g: proteinLogged,
      estimated_protein_remaining_g: proteinTarget ? proteinTarget - proteinLogged : null,
      steps: stepsRow
        ? { count: stepsRow.step_count, goal: stepsRow.step_goal_snapshot }
        : null,
      workout: workout
        ? {
            name: workout.workout_name,
            status: workout.status,
            exercises: workout.exercises.map((exercise) => ({
              name: exercise.name,
              completed: exercise.completed,
            })),
          }
        : null,
      // Just a count - no per-session detail is needed for the AI Coach's
      // level of questions ("did I do any breathing today?").
      breathing: { sessions_completed: breathingSessions.length },
    },
  };
}
