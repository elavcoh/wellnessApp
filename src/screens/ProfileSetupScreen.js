import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import ChipSelector from '../components/ChipSelector';
import { getProfile, saveProfile } from '../database/repositories/userProfileRepository';
import { calculateCalorieTarget, calculateProteinTarget } from '../services/nutritionTargets';
import { getWellnessAdvice } from '../services/aiService';

const GOAL_OPTIONS = ['Lose weight', 'Maintain', 'Build muscle', 'General wellness'];
const ACTIVITY_LEVEL_OPTIONS = ['Sedentary', 'Light', 'Moderate', 'Active'];
const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const LOCATION_OPTIONS = ['Home', 'Gym'];
const SEX_OPTIONS = ['Male', 'Female'];

export default function ProfileSetupScreen({ navigation, route }) {
  const isEditing = route?.params?.isEditing ?? false;

  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [sex, setSex] = useState(null);
  const [goal, setGoal] = useState(GOAL_OPTIONS[0]);
  const [activityLevel, setActivityLevel] = useState(ACTIVITY_LEVEL_OPTIONS[0]);
  const [workoutExperience, setWorkoutExperience] = useState(EXPERIENCE_OPTIONS[0]);
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState('');
  const [trainingLocation, setTrainingLocation] = useState(LOCATION_OPTIONS[0]);
  const [dietaryPreference, setDietaryPreference] = useState('');
  const [avoidedFoods, setAvoidedFoods] = useState('');
  const [stepGoal, setStepGoal] = useState('');
  const [loading, setLoading] = useState(isEditing);

  // Custom calorie target: null = use the calculated target below.
  const [confirmedOverride, setConfirmedOverride] = useState(null);
  const [proposedOverride, setProposedOverride] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [checkStatus, setCheckStatus] = useState('idle'); // idle | checking | reasonable | caution | error
  const [checkAnswer, setCheckAnswer] = useState('');

  // When editing an existing profile, pre-fill the form with the saved values.
  useEffect(() => {
    if (!isEditing) return;
    getProfile().then((profile) => {
      if (profile) {
        setAge(String(profile.age ?? ''));
        setHeightCm(String(profile.height_cm ?? ''));
        setWeightKg(String(profile.weight_kg ?? ''));
        setSex(profile.sex ?? null);
        setConfirmedOverride(profile.calorie_target_override ?? null);
        setGoal(profile.goal ?? GOAL_OPTIONS[0]);
        setActivityLevel(profile.activity_level ?? ACTIVITY_LEVEL_OPTIONS[0]);
        setWorkoutExperience(profile.workout_experience ?? EXPERIENCE_OPTIONS[0]);
        setWorkoutDaysPerWeek(String(profile.workout_days_per_week ?? ''));
        setTrainingLocation(profile.training_location ?? LOCATION_OPTIONS[0]);
        setDietaryPreference(profile.dietary_preference ?? '');
        setAvoidedFoods(profile.avoided_foods ?? '');
        setStepGoal(String(profile.step_goal ?? ''));
      }
      setLoading(false);
    });
  }, [isEditing]);

  async function handleSave() {
    await saveProfile({
      age: Number(age) || null,
      heightCm: Number(heightCm) || null,
      weightKg: Number(weightKg) || null,
      sex,
      goal,
      activityLevel,
      workoutExperience,
      workoutDaysPerWeek: Number(workoutDaysPerWeek) || null,
      trainingLocation,
      dietaryPreference,
      avoidedFoods,
      stepGoal: Number(stepGoal) || null,
      calorieTargetOverride: confirmedOverride,
    });

    if (isEditing) {
      navigation.goBack();
    } else {
      // Replace the whole stack so the user can't swipe back into onboarding.
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }

  // Draft profile built from the in-progress form (not yet saved) - used to
  // show a live target preview and to send to the AI Coach for the "is my
  // proposed target reasonable" check, without needing to save first.
  const draftProfile = {
    age: Number(age) || null,
    height_cm: Number(heightCm) || null,
    weight_kg: Number(weightKg) || null,
    sex,
    goal,
    activity_level: activityLevel,
  };
  const calculatedCalorieTarget = calculateCalorieTarget(draftProfile);
  const calculatedProteinTarget = calculateProteinTarget(draftProfile);

  async function handleCheckOverride() {
    if (!proposedOverride.trim()) return;
    setCheckStatus('checking');
    try {
      const question = `I want to set my own daily calorie target of ${proposedOverride} kcal instead of the app's calculated target of ${
        calculatedCalorieTarget ?? 'an unknown amount (not enough profile data yet)'
      } kcal. My reason: "${overrideReason.trim() || 'no reason given'}". Is this a reasonable target for someone with my profile and goal? What should I consider?`;
      const context = {
        profile: draftProfile,
        nutrition_targets: calculatedCalorieTarget
          ? { estimated_calorie_target: calculatedCalorieTarget }
          : null,
      };
      const result = await getWellnessAdvice(question, context);
      setCheckAnswer(result.answer);
      setCheckStatus(result.target_assessment === 'reasonable' ? 'reasonable' : 'caution');
    } catch (error) {
      setCheckStatus('error');
    }
  }

  function handleUseOverride() {
    setConfirmedOverride(Number(proposedOverride));
    setProposedOverride('');
    setOverrideReason('');
    setCheckStatus('idle');
    setCheckAnswer('');
  }

  function handleRemoveOverride() {
    setConfirmedOverride(null);
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{isEditing ? 'Edit Profile' : 'Create Your Profile'}</Text>

      <Text style={styles.fieldLabel}>Age</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        placeholder="e.g. 25"
      />

      <Text style={styles.fieldLabel}>Height (cm)</Text>
      <TextInput
        style={styles.input}
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="numeric"
        placeholder="e.g. 175"
      />

      <Text style={styles.fieldLabel}>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="numeric"
        placeholder="e.g. 70"
      />

      <ChipSelector label="Sex" options={SEX_OPTIONS} selected={sex} onSelect={setSex} />
      <Text style={styles.helperText}>
        Used only to estimate your daily calorie needs - optional, skip if you'd rather not say
        (you just won't see a calorie target).
      </Text>

      <ChipSelector label="Goal" options={GOAL_OPTIONS} selected={goal} onSelect={setGoal} />
      <ChipSelector
        label="Activity Level"
        options={ACTIVITY_LEVEL_OPTIONS}
        selected={activityLevel}
        onSelect={setActivityLevel}
      />

      <View style={styles.targetCard}>
        <Text style={styles.targetCardTitle}>Estimated Nutrition Target</Text>
        {calculatedCalorieTarget ? (
          <>
            <Text style={styles.targetValue}>
              {confirmedOverride ?? calculatedCalorieTarget} kcal / day
              {confirmedOverride ? ' (your custom target)' : ' (calculated)'}
            </Text>
            {calculatedProteinTarget && (
              <Text style={styles.targetSubtext}>~{calculatedProteinTarget}g protein / day</Text>
            )}
            <Text style={styles.targetSubtext}>
              Estimated using your age, height, weight, sex, activity level and goal - not a
              medical calculation.
            </Text>

            {confirmedOverride ? (
              <Pressable onPress={handleRemoveOverride}>
                <Text style={styles.overrideLink}>Remove custom target, use calculated value</Text>
              </Pressable>
            ) : (
              <View style={styles.overrideBox}>
                <Text style={styles.overrideLabel}>Want a different target? Propose one:</Text>
                <TextInput
                  style={styles.input}
                  value={proposedOverride}
                  onChangeText={setProposedOverride}
                  keyboardType="numeric"
                  placeholder="e.g. 2200"
                />
                <TextInput
                  style={styles.input}
                  value={overrideReason}
                  onChangeText={setOverrideReason}
                  placeholder="Why? (optional)"
                />
                <Pressable
                  style={styles.checkButton}
                  onPress={handleCheckOverride}
                  disabled={checkStatus === 'checking'}
                >
                  {checkStatus === 'checking' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.checkButtonText}>Check with AI Coach</Text>
                  )}
                </Pressable>

                {checkStatus === 'error' && (
                  <Text style={styles.errorText}>
                    Couldn't reach the AI Coach. Check that the backend is running, then try again.
                  </Text>
                )}

                {(checkStatus === 'reasonable' || checkStatus === 'caution') && (
                  <View>
                    <Text
                      style={[
                        styles.checkAnswer,
                        checkStatus === 'caution' && styles.checkAnswerCaution,
                      ]}
                    >
                      {checkAnswer}
                    </Text>
                    <Pressable style={styles.checkButton} onPress={handleUseOverride}>
                      <Text style={styles.checkButtonText}>
                        {checkStatus === 'caution' ? 'Use Anyway' : 'Use This Target'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.targetSubtext}>
            Add your age, height, weight, sex, activity level and goal above to see an estimated
            daily calorie target.
          </Text>
        )}
      </View>

      <ChipSelector
        label="Workout Experience"
        options={EXPERIENCE_OPTIONS}
        selected={workoutExperience}
        onSelect={setWorkoutExperience}
      />

      <Text style={styles.fieldLabel}>Workout Days per Week</Text>
      <TextInput
        style={styles.input}
        value={workoutDaysPerWeek}
        onChangeText={setWorkoutDaysPerWeek}
        keyboardType="numeric"
        placeholder="e.g. 3"
      />

      <ChipSelector
        label="Training Location"
        options={LOCATION_OPTIONS}
        selected={trainingLocation}
        onSelect={setTrainingLocation}
      />

      <Text style={styles.fieldLabel}>Dietary Preferences</Text>
      <TextInput
        style={styles.input}
        value={dietaryPreference}
        onChangeText={setDietaryPreference}
        placeholder="e.g. vegetarian"
      />

      <Text style={styles.fieldLabel}>Foods You Avoid</Text>
      <TextInput
        style={styles.input}
        value={avoidedFoods}
        onChangeText={setAvoidedFoods}
        placeholder="e.g. peanuts, shellfish"
      />

      <Text style={styles.fieldLabel}>Daily Step Goal (optional)</Text>
      <TextInput
        style={styles.input}
        value={stepGoal}
        onChangeText={setStepGoal}
        keyboardType="numeric"
        placeholder="e.g. 8000"
      />

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Finish Setup'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2f8f5b',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: -12,
    marginBottom: 16,
  },
  targetCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  targetCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  targetValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2f8f5b',
  },
  targetSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  overrideLink: {
    fontSize: 13,
    color: '#c0392b',
    marginTop: 10,
  },
  overrideBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  overrideLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  checkButton: {
    backgroundColor: '#3a6ea5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkAnswer: {
    fontSize: 13,
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
    lineHeight: 18,
  },
  checkAnswerCaution: {
    color: '#a35b00',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 8,
  },
});
