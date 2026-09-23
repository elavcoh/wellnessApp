/**
 * workoutTemplates.js
 *
 * Purpose: Fixed, hand-written workout plans (no AI involved). Picks one
 * template based on the user's experience level and home/gym preference.
 * Related to: used by MovementScreen.js when the user generates a workout
 * for the day.
 */

// Small, fixed set of templates - no generated/AI workouts here. Picked by
// experience tier + home/gym only, matching the examples in the spec.
// "Advanced" is folded into the intermediate tier to keep this to two tiers.
const WORKOUT_TEMPLATES = {
  beginner: {
    gym: {
      name: 'Beginner Full-Body (Gym)',
      exercises: [
        { name: 'Squat or Leg Press', sets: 3, reps: '10-12' },
        { name: 'Chest Press', sets: 3, reps: '10-12' },
        { name: 'Seated Row', sets: 3, reps: '10-12' },
        { name: 'Shoulder Press', sets: 3, reps: '10-12' },
        { name: 'Core Exercise', sets: 2, reps: '30-45 sec' },
      ],
    },
    home: {
      name: 'Beginner Full-Body (Home)',
      exercises: [
        { name: 'Bodyweight Squat', sets: 3, reps: '12-15' },
        { name: 'Push-ups', sets: 3, reps: '8-12' },
        { name: 'Glute Bridge', sets: 3, reps: '12-15' },
        { name: 'Bent-Over Towel Row', sets: 3, reps: '12-15' },
        { name: 'Plank', sets: 2, reps: '20-30 sec' },
      ],
    },
  },
  intermediate: {
    gym: {
      name: 'Intermediate Full-Body (Gym)',
      exercises: [
        { name: 'Barbell Squat', sets: 4, reps: '8-10' },
        { name: 'Chest Press', sets: 4, reps: '8-10' },
        { name: 'Seated Row', sets: 4, reps: '8-10' },
        { name: 'Shoulder Press', sets: 3, reps: '8-10' },
        { name: 'Core Circuit', sets: 3, reps: '45-60 sec' },
      ],
    },
    home: {
      name: 'Intermediate Full-Body (Home)',
      exercises: [
        { name: 'Bulgarian Split Squat', sets: 4, reps: '10-12' },
        { name: 'Push-ups (elevated feet)', sets: 4, reps: '10-15' },
        { name: 'Single-Leg Glute Bridge', sets: 3, reps: '10-12' },
        { name: 'Resistance Band Row', sets: 4, reps: '12-15' },
        { name: 'Plank + Side Plank', sets: 3, reps: '30-40 sec' },
      ],
    },
  },
};

// Picks one fixed template. No AI or complex logic here on purpose.
export function selectWorkoutTemplate(profile) {
  const tier = profile?.workout_experience === 'Beginner' ? 'beginner' : 'intermediate';
  const location = profile?.training_location === 'Gym' ? 'gym' : 'home';
  return WORKOUT_TEMPLATES[tier][location];
}
