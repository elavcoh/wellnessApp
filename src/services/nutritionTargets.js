/**
 * nutritionTargets.js
 *
 * Simple daily nutrition targets from the saved profile.
 * This is just math, not AI.
 */

// Rough activity factor: more movement = higher calorie burn.
const ACTIVITY_MULTIPLIERS = {
  Sedentary: 1.2,
  Light: 1.375,
  Moderate: 1.55,
  Active: 1.725,
};

// Adjust the estimate based on the user's goal.
const GOAL_CALORIE_OFFSETS = {
  'Lose weight': -500,
  Maintain: 0,
  'Build muscle': 300,
  'General wellness': 0,
};

// Protein target in grams per kg of body weight.
const GOAL_PROTEIN_PER_KG = {
  'Lose weight': 1.6,
  Maintain: 1.2,
  'Build muscle': 1.8,
  'General wellness': 1.2,
};

// Keep the target from going unrealistically low.
const MINIMUM_CALORIE_FLOOR = 1200;

// Make sure the profile has everything needed before calculating.
function hasRequiredFields(profile) {
  return Boolean(
    profile &&
      profile.sex &&
      profile.age &&
      profile.height_cm &&
      profile.weight_kg &&
      profile.activity_level &&
      profile.goal
  );
}

// Main calorie target calculation. Uses the user's own custom target if
// they set one, otherwise runs the BMR formula. Returns null if the
// profile is missing required fields (never guesses a value).
export function calculateCalorieTarget(profile) {
  // Only a positive number counts as a custom target - a broken saved
  // value (negative, or text) falls back to the calculated one.
  const override = Number(profile?.calorie_target_override);
  if (Number.isFinite(override) && override > 0) {
    return override;
  }

  if (!hasRequiredFields(profile)) return null;

  // Rough formula:
  // BMR based on weight, height, age, and sex
  // × activity factor
  // + goal adjustment
  // rounded to nearest 50 kcal
  const bmr =
    profile.sex === 'Male'
      ? 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
      : 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161;

  const activityMultiplier = ACTIVITY_MULTIPLIERS[profile.activity_level] ?? 1.2;
  const maintenanceCalories = bmr * activityMultiplier;

  const goalOffset = GOAL_CALORIE_OFFSETS[profile.goal] ?? 0;
  const target = maintenanceCalories + goalOffset;

  const rounded = Math.round(target / 50) * 50;
  return Math.max(rounded, MINIMUM_CALORIE_FLOOR);
}

// Protein target calculation, in grams per day.
export function calculateProteinTarget(profile) {
  if (!profile?.weight_kg || !profile?.goal) return null;

  // Rough formula:
  // body weight in kg × protein per kg for the goal
  // rounded to nearest 5 g
  const gramsPerKg = GOAL_PROTEIN_PER_KG[profile.goal] ?? 1.2;
  const target = profile.weight_kg * gramsPerKg;
  return Math.round(target / 5) * 5;
}
