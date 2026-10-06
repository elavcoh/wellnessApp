/**
 * ProfileSetupScreen.js
 *
 * Purpose: The profile form - used once for onboarding and again as "Edit Profile".
 * Shows a live calorie target and can ask the AI Coach about a custom one.
 * Related to: RootNavigator.js (routes ProfileSetup and ProfileEdit). Saves through
 * userProfileRepository.js. Styles in styles/ProfileSetupScreen.styles.js.
 */

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';

import ChipSelector from '../components/ChipSelector';
import { getProfile, saveProfile } from '../database/repositories/userProfileRepository';
import { calculateCalorieTarget, calculateProteinTarget } from '../services/nutritionTargets';
import { getWellnessAdvice } from '../services/aiService';
import PressableScale from '../components/PressableScale';
import { colors } from '../styles/theme';
import styles from '../styles/ProfileSetupScreen.styles';

// The choices for each chip row. These exact strings are saved in the
// database and used by nutritionTargets.js and workoutTemplates.js, so
// change them in all places together.
const GOAL_OPTIONS = ['Lose weight', 'Maintain', 'Build muscle', 'General wellness'];
const ACTIVITY_LEVEL_OPTIONS = ['Sedentary', 'Light', 'Moderate', 'Active'];
const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const LOCATION_OPTIONS = ['Home', 'Gym'];
const SEX_OPTIONS = ['Male', 'Female'];

// Sensible ranges for each number field. Anything outside these is almost
// certainly a typo (e.g. weight -70, or height in metres instead of cm)
// and would produce nonsense calorie/protein targets, so it isn't saved.
const NUMBER_RULES = {
  age: { label: 'Age', min: 13, max: 120, wholeNumber: true },
  heightCm: { label: 'Height', min: 100, max: 250 },
  weightKg: { label: 'Weight', min: 30, max: 300 },
  workoutDaysPerWeek: { label: 'Workout days per week', min: 0, max: 7, wholeNumber: true },
  stepGoal: { label: 'Daily step goal', min: 1000, max: 100000, wholeNumber: true },
  calorieTarget: { label: 'Custom calorie target', min: 800, max: 6000, wholeNumber: true },
};

// Checks one number field against its rule in NUMBER_RULES.
// Returns { value, error }:
//   empty text      -> { value: null, error: null } (every field is optional)
//   a valid number  -> { value: the number, error: null }
//   anything else   -> { value: null, error: a message to show the user }
// Accepts "70,5" too, since some phone keyboards type a comma for decimals.
function parseNumberField(text, rule) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return { value: null, error: null };
  const value = Number(trimmed.replace(',', '.'));
  const isValid =
    Number.isFinite(value) &&
    value >= rule.min &&
    value <= rule.max &&
    (!rule.wholeNumber || Number.isInteger(value));
  if (!isValid) {
    const kind = rule.wholeNumber ? 'a whole number' : 'a number';
    return { value: null, error: `${rule.label} must be ${kind} between ${rule.min} and ${rule.max}.` };
  }
  return { value, error: null };
}

// One form row: a small label above a text box. Any extra props (value,
// onChangeText, placeholder, keyboardType...) go straight to the TextInput.
function LabeledInput({ label, ...inputProps }) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textSoft} {...inputProps} />
    </>
  );
}

// isEditing comes from RootNavigator.js: false for first-time setup,
// true when opened from Home as "Edit Profile".
export default function ProfileSetupScreen({ navigation, route }) {
  const isEditing = route?.params?.isEditing ?? false;

  // Form fields.
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

  // Custom calorie target state.
  const [confirmedOverride, setConfirmedOverride] = useState(null);
  const [proposedOverride, setProposedOverride] = useState('');
  const [overrideReason, setOverrideReason] = useState(''); //For the AI context if needed
  const [checkStatus, setCheckStatus] = useState('idle');
  const [checkAnswer, setCheckAnswer] = useState(''); // the AI's explanation text, shown under the button
  const [overrideError, setOverrideError] = useState(''); // shown when the proposed target isn't a sensible number
  // Goes up by one every time the proposed number is edited. An AI answer
  // only counts if this hasn't changed since the question was sent - so an
  // answer about 2200 can never approve 900 typed while it was loading.
  const checkRequestRef = useRef(0);

  // Shown above the save button when a number field is out of range.
  const [saveError, setSaveError] = useState('');
  // Lock so a double-tap on "Finish Setup" only saves once - two saves at
  // the same moment would both see "no profile yet" and create two rows.
  // A ref, not state, because it has to change before the next render.
  const savingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved profile when editing.
  useEffect(() => {
    if (!isEditing) return;
    getProfile().then((profile) => {
      if (profile) {
        setAge(String(profile.age ?? ''));
        setHeightCm(String(profile.height_cm ?? ''));
        setWeightKg(String(profile.weight_kg ?? ''));
        setSex(profile.sex ?? null);
        setConfirmedOverride(profile.calorie_target_override ?? null);
        setGoal(profile.goal ?? GOAL_OPTIONS[0]);// default to first option if not set
        setActivityLevel(profile.activity_level ?? ACTIVITY_LEVEL_OPTIONS[0]);
        setWorkoutExperience(profile.workout_experience ?? EXPERIENCE_OPTIONS[0]);
        setWorkoutDaysPerWeek(String(profile.workout_days_per_week ?? ''));
        setTrainingLocation(profile.training_location ?? LOCATION_OPTIONS[0]);
        setDietaryPreference(profile.dietary_preference ?? '');
        setAvoidedFoods(profile.avoided_foods ?? '');
        setStepGoal(String(profile.step_goal ?? ''));
      }
      setLoading(false);// done loading, show the form
    });
  }, [isEditing]);// only run on mount

  // Save profile and close or continue to app.
  // Every number is checked first (see NUMBER_RULES) - if any is out of
  // range, nothing is saved and the first problem is shown instead.
  async function handleSave() {
    if (savingRef.current) return; // already saving - ignore this tap

    // Check every number field; each gives { value, error }.
    const fields = {
      age: parseNumberField(age, NUMBER_RULES.age),
      heightCm: parseNumberField(heightCm, NUMBER_RULES.heightCm),
      weightKg: parseNumberField(weightKg, NUMBER_RULES.weightKg),
      workoutDaysPerWeek: parseNumberField(workoutDaysPerWeek, NUMBER_RULES.workoutDaysPerWeek),
      stepGoal: parseNumberField(stepGoal, NUMBER_RULES.stepGoal),
    };
    const firstError = Object.values(fields).find((field) => field.error)?.error;
    if (firstError) {
      setSaveError(firstError);
      return;
    }
    setSaveError('');

    savingRef.current = true;
    setIsSaving(true);
    try {
      await saveProfile({
        age: fields.age.value,
        heightCm: fields.heightCm.value,
        weightKg: fields.weightKg.value,
        sex,
        goal,
        activityLevel,
        workoutExperience,
        workoutDaysPerWeek: fields.workoutDaysPerWeek.value,
        trainingLocation,
        dietaryPreference,
        avoidedFoods,
        stepGoal: fields.stepGoal.value,
        calorieTargetOverride: confirmedOverride,
      });
    } catch (error) {
      setSaveError("Couldn't save your profile. Please try again.");
      return;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }

    if (isEditing) {
      // Just close this screen and go back to wherever it was opened from (Home).
      navigation.goBack();
    } else {
      // First-time setup: replace the whole navigation stack with the main
      // app, so the user can't swipe/navigate back into onboarding again.
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }

  // Live preview from current form values. An out-of-range value counts as
  // "not filled in" here, so the preview never shows a nonsense target.
  const draftProfile = {
    age: parseNumberField(age, NUMBER_RULES.age).value,// a number, or null if empty/out of range
    height_cm: parseNumberField(heightCm, NUMBER_RULES.heightCm).value,
    weight_kg: parseNumberField(weightKg, NUMBER_RULES.weightKg).value,
    sex,// can be null if not selected
    goal,
    activity_level: activityLevel,
  };
  const calculatedCalorieTarget = calculateCalorieTarget(draftProfile);// null if not enough data yet
  const calculatedProteinTarget = calculateProteinTarget(draftProfile);

  // Ask the AI coach to review a custom calorie target.
  async function handleCheckOverride() {
    if (!proposedOverride.trim()) return; // nothing typed yet, don't bother asking
    // Don't ask the AI about something that isn't a sensible target at all.
    const { error } = parseNumberField(proposedOverride, NUMBER_RULES.calorieTarget);
    if (error) {
      setOverrideError(error);
      return;
    }

    const requestId = checkRequestRef.current;
    setCheckStatus('checking');
    try {
      // We write out the question in plain English ourselves, including
      // both numbers and the user's reason, instead of just sending the
      // raw number - this way the AI Coach's normal wellness-advice prompt
      // can understand exactly what's being asked without any special code path.
      const question = `I want to set my own daily calorie target of ${proposedOverride} kcal instead of the app's calculated target of ${
        calculatedCalorieTarget ?? 'an unknown amount (not enough profile data yet)'
      } kcal. My reason: "${overrideReason.trim() || 'no reason given'}". Is this a reasonable target for someone with my profile and goal? What should I consider?`;
      // A small, purpose-built context - not the full buildTodayContext(),
      // since during onboarding there's no "today" data yet, and this
      // question is only about the profile + the proposed number.
      const context = {// the AI Coach prompt expects these exact keys
        profile: draftProfile,// the user's profile data, including age, height, weight, sex, goal, activity level
        nutrition_targets: calculatedCalorieTarget//  the calculated target, if available, so the AI can compare it to the proposed one
          ? { estimated_calorie_target: calculatedCalorieTarget }
          : null,
      };
      const result = await getWellnessAdvice(question, context);// returns { answer: string, target_assessment: 'reasonable' | 'caution' | 'not_applicable' }
      // The number was edited while the AI was answering - this answer is
      // about the old number, so throw it away.
      if (requestId !== checkRequestRef.current) return;
      setCheckAnswer(result.answer);// the AI's explanation text, shown under the button
      // Anything other than an explicit "reasonable" is treated as
      // "caution" (including the normal not_applicable default) - the
      // safer choice when we're not sure, since it just adds one extra tap.
      setCheckStatus(result.target_assessment === 'reasonable' ? 'reasonable' : 'caution');//
    } catch (error) {
      if (requestId !== checkRequestRef.current) return; // old question, ignore
      setCheckStatus('error');
    }
  }

  // Editing the proposed number makes any AI answer out of date (it was
  // about the old number), so clear it - the user has to check again
  // before "Use This Target" shows up.
  function handleProposedOverrideChange(text) {
    setProposedOverride(text);
    checkRequestRef.current += 1;
    setCheckStatus('idle');
    setCheckAnswer('');
    setOverrideError('');
  }

  // Confirm the custom target. Checked again here, so only a sensible
  // whole number can ever be saved as the target.
  function handleUseOverride() {
    const { value, error } = parseNumberField(proposedOverride, NUMBER_RULES.calorieTarget);
    if (error || value === null) {
      setOverrideError(error ?? 'Type a target first.');
      return;
    }
    setConfirmedOverride(value);
    setProposedOverride('');
    setOverrideReason('');
    setCheckStatus('idle');
    setCheckAnswer('');
    setOverrideError('');
  }

  // Remove the custom target and use the calculated one again.
  function handleRemoveOverride() {
    setConfirmedOverride(null);
  }

  if (loading) {// still loading the profile from the database, show a spinner
    return <View style={styles.container} />;
  }

  return (// the main form
    // During onboarding there's no header bar, so the form gets extra top
    // space to clear the status bar.
    <ScrollView contentContainerStyle={[styles.container, !isEditing && styles.containerOnboarding]}>
      <Text style={styles.overline}>{isEditing ? 'Your details' : "Let's get to know you"}</Text>
      <Text style={styles.title}>{isEditing ? 'Edit Profile' : 'Create Your Profile'}</Text>

      <LabeledInput
        label="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        placeholder="e.g. 25"
      />

      <LabeledInput
        label="Height (cm)"
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="numeric"
        placeholder="e.g. 175"
      />

      <LabeledInput
        label="Weight (kg)"
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="numeric"
        placeholder="e.g. 70"
      />

      {/* Tapping the selected chip again un-selects it - sex is optional. */}
      <ChipSelector
        label="Sex"
        options={SEX_OPTIONS}
        selected={sex}
        onSelect={(option) => setSex((current) => (current === option ? null : option))}
      />
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

      {/* This card has 3 possible states:
          1. Not enough profile data yet -> just the "add more info" message.
          2. Enough data, no custom target -> shows the calculated target,
             plus the "propose your own" box.
          3. A custom target is confirmed -> shows that instead, with a
             link to remove it and go back to the calculated one. */}
      <View style={styles.targetCard}>
        <Text style={styles.targetCardTitle}>Estimated Nutrition Target</Text>
        {/* Also shown when only a custom target exists (e.g. sex was
            un-selected), so it can still be seen and removed. */}
        {calculatedCalorieTarget || confirmedOverride ? (
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
              <PressableScale onPress={handleRemoveOverride}>
                <Text style={styles.overrideLink}>Remove custom target, use calculated value</Text>
              </PressableScale>
            ) : (
              <View style={styles.overrideBox}>
                <Text style={styles.overrideLabel}>Want a different target? Propose one:</Text>
                <TextInput
                  style={styles.input}
                  value={proposedOverride}
                  onChangeText={handleProposedOverrideChange}
                  keyboardType="numeric"
                  placeholder="e.g. 2200"
                />
                <TextInput
                  style={styles.input}
                  value={overrideReason}
                  onChangeText={setOverrideReason}
                  placeholder="Why? (optional)"
                />
                <PressableScale
                  style={styles.checkButton}
                  onPress={handleCheckOverride}
                  disabled={checkStatus === 'checking'}
                >
                  {checkStatus === 'checking' ? (
                    <ActivityIndicator color={colors.textOnColor} />
                  ) : (
                    <Text style={styles.checkButtonText}>Check with AI Coach</Text>
                  )}
                </PressableScale>

                {overrideError ? <Text style={styles.errorText}>{overrideError}</Text> : null}

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
                    <PressableScale style={styles.checkButton} onPress={handleUseOverride}>
                      <Text style={styles.checkButtonText}>
                        {checkStatus === 'caution' ? 'Use Anyway' : 'Use This Target'}
                      </Text>
                    </PressableScale>
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

      <LabeledInput
        label="Workout Days per Week"
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

      <LabeledInput
        label="Dietary Preferences"
        value={dietaryPreference}
        onChangeText={setDietaryPreference}
        placeholder="e.g. vegetarian"
      />

      <LabeledInput
        label="Foods You Avoid"
        value={avoidedFoods}
        onChangeText={setAvoidedFoods}
        placeholder="e.g. peanuts, shellfish"
      />

      <LabeledInput
        label="Daily Step Goal (optional)"
        value={stepGoal}
        onChangeText={setStepGoal}
        keyboardType="numeric"
        placeholder="e.g. 8000"
      />

      {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

      <PressableScale
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Finish Setup'}
        </Text>
      </PressableScale>
    </ScrollView>
  );
}
