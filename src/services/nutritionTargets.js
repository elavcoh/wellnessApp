// Deterministic, non-AI calorie/protein target estimates.
//
// Calories: Mifflin-St Jeor BMR formula (a well-established general-purpose
// estimate, does not need body-fat% like some alternatives), scaled by an
// activity multiplier, then shifted by a fixed, moderate offset per goal.
// Protein: grams-per-kg-bodyweight, the standard simple approach in general
// fitness guidance (not a medical calculation).
//
// Returns null whenever required profile data (notably `sex`) is missing -
// we never guess a value the user hasn't provided.

const ACTIVITY_MULTIPLIERS = {
  Sedentary: 1.2,
  Light: 1.375,
  Moderate: 1.55,
  Active: 1.725,
};

const GOAL_CALORIE_OFFSETS = {
  'Lose weight': -500,
  Maintain: 0,
  'Build muscle': 300,
  'General wellness': 0,
};

const GOAL_PROTEIN_PER_KG = {
  'Lose weight': 1.6,
  Maintain: 1.2,
  'Build muscle': 1.8,
  'General wellness': 1.2,
};

const MINIMUM_CALORIE_FLOOR = 1200;

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

export function calculateCalorieTarget(profile) {
  if (profile?.calorie_target_override) {
    return profile.calorie_target_override;
  }

  if (!hasRequiredFields(profile)) return null;

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

export function calculateProteinTarget(profile) {
  if (!profile?.weight_kg || !profile?.goal) return null;

  const gramsPerKg = GOAL_PROTEIN_PER_KG[profile.goal] ?? 1.2;
  const target = profile.weight_kg * gramsPerKg;
  return Math.round(target / 5) * 5;
}
