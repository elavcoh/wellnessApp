import { getProfile } from '../database/repositories/userProfileRepository';
import { getMealsForDate } from '../database/repositories/mealsRepository';
import { getStepsForDate } from '../database/repositories/stepsRepository';
import { getWorkoutForDate } from '../database/repositories/workoutsRepository';
import { getTodayCompletedSessions } from '../database/repositories/breathingRepository';
import { getTodayDateString } from '../utils/dateUtils';
import { calculateCalorieTarget, calculateProteinTarget } from './nutritionTargets';

// null means "no data recorded" (e.g. Movement hasn't been opened today, or
// no workout was generated) - kept distinct from 0/"not_started" so the AI
// never mistakes "not measured" for "confirmed zero activity".
export async function buildTodayContext() {
  const today = getTodayDateString();

  const [profile, meals, stepsRow, workout, breathingSessions] = await Promise.all([
    getProfile(),
    getMealsForDate(today),
    getStepsForDate(today),
    getWorkoutForDate(today),
    getTodayCompletedSessions(),
  ]);

  const calorieTarget = calculateCalorieTarget(profile);
  const proteinTarget = calculateProteinTarget(profile);
  const caloriesLogged = meals.reduce((sum, meal) => sum + (meal.estimated_calories || 0), 0);
  const proteinLogged = meals.reduce((sum, meal) => sum + (meal.estimated_protein_g || 0), 0);

  return {
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
      meals: meals.map((meal) => ({
        meal_type: meal.meal_type,
        description: meal.description,
        estimated_calories: meal.estimated_calories ?? null,
        estimated_protein_g: meal.estimated_protein_g ?? null,
        detected_foods: meal.detected_foods_json
          ? JSON.parse(meal.detected_foods_json).foods
          : null,
      })),
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
      breathing: { sessions_completed: breathingSessions.length },
    },
  };
}
