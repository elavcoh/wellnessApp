/**
 * NutritionScreen.js
 *
 * Purpose: Log meals: type or photograph a meal, get an AI estimate of calories and
 * protein, review it, and save. Also shows today's totals vs. the target.
 * Related to: AppTabs.js. Uses aiService.js, mealsRepository.js, photoStorage.js,
 * nutritionTargets.js. Styles in styles/NutritionScreen.styles.js.
 */

import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import ChipSelector from '../components/ChipSelector';
import MealListItem from '../components/MealListItem';
import DetectedFoodItem from '../components/DetectedFoodItem';
import { addMeal, deleteMeal, getMealsForDate } from '../database/repositories/mealsRepository';
import { getProfile } from '../database/repositories/userProfileRepository';
import { getCurrentTimeString, getTodayDateString } from '../utils/dateUtils';
import { analyzeMealPhoto, analyzeMealText } from '../services/aiService';
import { calculateCalorieTarget, calculateProteinTarget, sumField } from '../services/nutritionTargets';
import { deleteMealPhoto, saveMealPhoto } from '../services/photoStorage';
import PressableScale from '../components/PressableScale';
import { colors } from '../styles/theme';
import styles from '../styles/NutritionScreen.styles';

// The meal type chips shown above the form.
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const MAX_MEAL_CALORIES = 5000;
const MAX_MEAL_PROTEIN_G = 500;

// Turns what the user typed into a calories/protein field into a whole
// number, or null if it's empty or not a valid number of 0 or more.
// 0 is a real value here (black coffee, an apple's protein) - not "empty".
// Accepts "12,5" too, since some phone keyboards type a comma for decimals.
function parseNutritionValue(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

// One screen with three parts: the daily summary card, the "new meal"
// form (text or photo + optional AI estimate), and today's meal list.
export default function NutritionScreen() {
  // --- The "new meal" form fields (what the user is currently filling in) ---
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState(null); // local file path of the chosen/taken photo, or null
  const [meals, setMeals] = useState([]); // today's already-saved meals, shown in the list below

  // --- AI analysis state (all reset together by resetAnalysis()) ---
  // Shared by both AI flows: "Analyze with AI" for a photo, and "Estimate
  // with AI" for a typed description. Only one can be on screen at a time -
  // the text button is hidden while a photo is attached.
  const [photoMimeType, setPhotoMimeType] = useState(null); // needed so the backend knows the real image format (see handleChooseFromLibrary)
  // analysisStatus tracks where we are in either AI flow:
  //   idle     - no analysis run yet for the current photo/description
  //   loading  - waiting for the backend/AI to respond
  //   done     - got a real food result back, showing the review box
  //   not_food - the AI decided the photo/text isn't food at all
  //   error    - the request failed (network/backend down)
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [detectedFoods, setDetectedFoods] = useState([]); // array of {name, portion_description, category, estimated_calories, ...}
  const [aiSummary, setAiSummary] = useState(''); // AI's one-line meal description, used to prefill "description" if it's empty
  const [aiObservation, setAiObservation] = useState(''); // AI's free-text note, shown in the review box
  // Numbers each AI request. Bumped when a request starts and whenever the
  // form moves on (new/removed photo, Add Meal), so an answer that arrives
  // late can tell it's out of date and be ignored instead of refilling the
  // form with the old meal's numbers and foods.
  const analysisRequestRef = useRef(0);

  // --- Estimated calories/protein for the meal being added ---
  // These work the same way for both AI-analyzed and purely manual meals.
  // They get auto-filled/recalculated from the AI result whenever it
  // changes, UNLESS the user has typed into the field themselves - once
  // that happens, "*ManuallyEdited" flips to true and auto-fill stops,
  // exactly like how "description" is never overwritten once non-empty.
  // The two flags are refs, not state: an AI answer can arrive seconds after
  // the request started, and it must see whether the user typed a number
  // in the meantime - a state value captured at request time would be stale.
  const [caloriesInput, setCaloriesInput] = useState('');
  const caloriesManuallyEditedRef = useRef(false);
  const [proteinInput, setProteinInput] = useState('');
  const proteinManuallyEditedRef = useRef(false);

  // The description text the last "Estimate with AI" was run on. If the
  // user edits the description after that, the estimate no longer matches
  // it and is cleared (see handleDescriptionChange).
  const estimatedDescriptionRef = useRef('');
  // True right after such a clear, to tell the user why the review box
  // disappeared and that the numbers may be out of date.
  const [estimateOutdated, setEstimateOutdated] = useState(false);

  // Message shown above "Add Meal" when the meal can't be saved yet (e.g.
  // calories missing). Cleared as soon as the user changes the form.
  const [saveError, setSaveError] = useState('');

  // True while "Add Meal" is saving, so the button shows as disabled.
  // savingRef is the real lock: a state update only takes effect on the
  // next render, so two very fast taps could both still see isSaving as
  // false - a ref changes immediately, so the second tap is ignored.
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  // The user's profile, needed only to calculate the calorie/protein
  // targets shown in the summary card below (see calculateCalorieTarget).
  const [profile, setProfile] = useState(null);

  // Re-reads today's meals from SQLite (used after saving/deleting a meal,
  // and every time this tab gains focus).
  const loadMeals = useCallback(async () => {
    const rows = await getMealsForDate(getTodayDateString());
    setMeals(rows);
  }, []);

  // Reads the profile (for the calorie/protein targets).
  const loadProfile = useCallback(async () => {
    const profileRow = await getProfile();
    setProfile(profileRow);
  }, []);

  // Refresh both today's meals and the profile every time this tab becomes
  // visible - e.g. after editing the profile or coming back from another tab.
  useFocusEffect(
    useCallback(() => {
      loadMeals();
      loadProfile();
    }, [loadMeals, loadProfile])
  );

  // Clears all AI-analysis state. Called when a new/removed photo makes the
  // previous analysis meaningless. Does NOT clear description or the
  // calorie/protein inputs - those belong to the meal being built, not to
  // one specific photo analysis attempt.
  function resetAnalysis() {
    analysisRequestRef.current += 1; // drop any answer still on its way
    setEstimateOutdated(false);
    setAnalysisStatus('idle');
    setDetectedFoods([]);
    setAiSummary('');
    setAiObservation('');
  }

  // Opens the camera. Asks for permission first - if the user denies it,
  // we just do nothing rather than showing an error (they can try again).
  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.5,
    });
    keepPickedPhoto(result);
  }

  // Opens the photo library picker.
  async function handleChooseFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      // iOS photo library assets are often stored as HEIC. Without this,
      // the picker can hand back HEIC bytes while still (incorrectly)
      // reporting mimeType as "image/jpeg" - OpenAI then rejects the image
      // because the bytes don't match any supported format. "Compatible"
      // forces a real JPEG/PNG transcode instead of the raw HEIC asset.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    keepPickedPhoto(result);
  }

  // Shared by the camera and the library: keeps the picked photo, unless the
  // user cancelled. A new photo makes any previous analysis result invalid.
  function keepPickedPhoto(result) {
    if (result.canceled) return;
    setPhotoUri(result.assets[0].uri);
    setPhotoMimeType(result.assets[0].mimeType ?? null);
    resetAnalysis();
  }

  // Lets the user discard the current photo and start over (e.g. wrong
  // photo, or they want to try analyzing a different one).
  function handleRemovePhoto() {
    setPhotoUri(null);
    setPhotoMimeType(null);
    resetAnalysis();
  }

  // Puts an AI result (from a photo or a typed description - both have the
  // same shape) into the review box and the calorie/protein fields.
  // Nothing is saved here; the user still has to press "Add Meal".
  //   overwriteValues - true when the user explicitly asked for a new
  //   estimate of their typed text, so it should replace whatever is in
  //   the fields. The photo flow passes false and keeps the user's own
  //   typed numbers, as before.
  function applyAnalysisResult(result, { overwriteValues }) {
    // The AI decided this isn't food at all (e.g. a screenshot, or text
    // like "my car") - show the "not a meal" message instead of
    // pretending it found something.
    if (!result.is_food) {
      setDetectedFoods([]);
      setAnalysisStatus('not_food');
      return;
    }

    setDetectedFoods(result.foods);
    setAiSummary(result.meal_summary);
    setAiObservation(result.general_observation);
    setAnalysisStatus('done');
    setSaveError('');
    // Only fill the description if the user hasn't typed their own -
    // never overwrite something they already wrote. The (current) => form
    // reads the description as it is NOW, not as it was when the request
    // started - the user may have typed one while the photo was analyzing.
    setDescription((current) => (current.trim() ? current : result.meal_summary));
    if (overwriteValues || !caloriesManuallyEditedRef.current) {
      setCaloriesInput(String(result.total_estimated_calories));
      caloriesManuallyEditedRef.current = false;
    }
    if (overwriteValues || !proteinManuallyEditedRef.current) {
      setProteinInput(String(result.total_estimated_protein_g));
      proteinManuallyEditedRef.current = false;
    }
  }

  // Sends the photo to the backend for AI analysis and fills in the
  // detected foods, calories and protein (unless the user already typed
  // their own values).
  function handleAnalyzeWithAI() {
    runAnalysis(() => analyzeMealPhoto(photoUri, photoMimeType), { overwriteValues: false });
  }

  // Sends the typed description to the backend for an AI estimate and
  // fills in the calories and protein. The user can still edit them, and
  // nothing is saved until they press "Add Meal".
  function handleEstimateWithAI() {
    if (!description.trim()) return; // button is disabled in this case anyway
    estimatedDescriptionRef.current = description.trim();
    setEstimateOutdated(false);
    runAnalysis(() => analyzeMealText(description.trim()), { overwriteValues: true });
  }

  // Shared by both AI buttons: shows the spinner, waits for the answer and
  // puts it in the form. Every request gets a number - if the form moved on
  // while waiting (new photo, Add Meal, edited text), the number no longer
  // matches and the late answer is ignored.
  async function runAnalysis(sendRequest, options) {
    const requestId = ++analysisRequestRef.current;
    setAnalysisStatus('loading');
    try {
      const result = await sendRequest();
      if (requestId !== analysisRequestRef.current) return; // form moved on
      applyAnalysisResult(result, options);
    } catch (error) {
      if (requestId !== analysisRequestRef.current) return;
      setAnalysisStatus('error');
    }
  }

  // Removes one AI-detected food and recalculates the calorie/protein
  // totals from what's left.
  function handleRemoveDetectedFood(index) {
    setDetectedFoods((current) => {
      const updated = current.filter((_, i) => i !== index);
      if (!caloriesManuallyEditedRef.current) {
        setCaloriesInput(String(sumField(updated, 'estimated_calories')));
      }
      if (!proteinManuallyEditedRef.current) {
        setProteinInput(String(sumField(updated, 'estimated_protein_g')));
      }
      return updated;
    });
  }

  // These fire whenever the user types into the calories/protein fields.
  // Marking "manually edited" is what stops handleAnalyzeWithAI and
  // handleRemoveDetectedFood from overwriting the user's own number later.
  // Any change to the form also clears an old "can't save yet" message.
  // Editing the description after "Estimate with AI" (or while it's still
  // loading) means the AI's food list belongs to the old text - clear it so
  // it isn't saved with the meal, and drop a late answer. Only for the typed
  // flow: with a photo, the foods come from the photo, not the text.
  function handleDescriptionChange(text) {
    setDescription(text);
    setSaveError('');
    const estimateWasForOldText =
      !photoUri &&
      (analysisStatus === 'done' || analysisStatus === 'loading') &&
      text.trim() !== estimatedDescriptionRef.current;
    if (estimateWasForOldText) {
      resetAnalysis();
      setEstimateOutdated(true);
    } else if (!photoUri && (analysisStatus === 'error' || analysisStatus === 'not_food')) {
      resetAnalysis(); // hide the old error message once the text changes
    }
  }

  // The user typed their own calories - stop the AI from overwriting them.
  function handleCaloriesChange(text) {
    setCaloriesInput(text);
    caloriesManuallyEditedRef.current = true;
    setSaveError('');
  }

  // Same as above, for protein.
  function handleProteinChange(text) {
    setProteinInput(text);
    proteinManuallyEditedRef.current = true;
    setSaveError('');
  }

  // Saves the meal to SQLite. This is the only place the meal is actually
  // stored - nothing is saved just from taking a photo or analyzing it.
  // Description, calories and protein are all required: a meal without
  // numbers would silently count as 0 in today's totals and the AI Coach.
  async function handleAddMeal() {
    if (savingRef.current) return; // a save is already running - ignore this tap
    if (!description.trim()) {
      setSaveError('Describe what you ate before saving.');
      return;
    }

    const calories = parseNutritionValue(caloriesInput);
    const protein = parseNutritionValue(proteinInput);
    if (!caloriesInput.trim() || !proteinInput.trim()) {
      setSaveError(
        'Add calories and protein before saving. Type them in, or use Estimate with AI. ' +
          'Meals without these values make your daily totals inaccurate.'
      );
      return;
    }
    if (calories === null || protein === null) {
      setSaveError('Calories and protein must be numbers (0 or more).');
      return;
    }
    // One meal above these is almost certainly a typo (an extra zero) and
    // would throw off today's totals and the AI Coach.
    if (calories > MAX_MEAL_CALORIES || protein > MAX_MEAL_PROTEIN_G) {
      setSaveError(
        `That looks too high for one meal (max ${MAX_MEAL_CALORIES} kcal and ${MAX_MEAL_PROTEIN_G}g protein). Check for a typo.`
      );
      return;
    }

    // Only attach the AI result JSON if analysis actually finished
    // successfully (status "done") - a manual meal, or one where analysis
    // failed/found no food, saves with detectedFoodsJson = null.
    const detectedFoodsJson =
      analysisStatus === 'done'
        ? JSON.stringify({
            foods: detectedFoods,
            meal_summary: aiSummary,
            general_observation: aiObservation,
          })
        : null;

    // An estimate still loading belongs to the meal being saved now - drop
    // it so it can't refill the cleared form afterwards.
    if (analysisStatus === 'loading') {
      resetAnalysis();
    }

    savingRef.current = true;
    setIsSaving(true);
    try {
      // The picked photo sits in a temporary folder iOS can clear, so copy
      // it into the app's own folder first (see photoStorage.js). Done only
      // here, on save, so photos that are picked and then discarded never
      // get copied. If the copy fails, still save the meal with the
      // temporary photo rather than losing the meal.
      let savedPhotoUri = photoUri;
      if (photoUri) {
        try {
          savedPhotoUri = await saveMealPhoto(photoUri);
        } catch (error) {
          savedPhotoUri = photoUri;
        }
      }

      await addMeal({
        mealType,
        description: description.trim(),
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        photoUri: savedPhotoUri,
        detectedFoodsJson,
        estimatedCalories: calories,
        estimatedProteinG: protein,
      });
    } catch (error) {
      setSaveError("Couldn't save this meal. Please try again.");
      return;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
    setSaveError('');
    setDescription('');
    setPhotoUri(null);
    setPhotoMimeType(null);
    setCaloriesInput('');
    caloriesManuallyEditedRef.current = false;
    setProteinInput('');
    proteinManuallyEditedRef.current = false;
    resetAnalysis();
    loadMeals();
  }

  // The trash button on a meal: deletes the row, then its photo file.
  async function handleDeleteMeal(id) {
    const meal = meals.find((m) => m.id === id);
    await deleteMeal(id);
    deleteMealPhoto(meal?.photo_uri); // remove its photo file too, if it has one
    loadMeals();
  }

  // Everything below is computed fresh on every render from `meals` and
  // `profile` - no extra state needed, just plain math over what's already loaded.
  const totalCaloriesToday = sumField(meals, 'estimated_calories');
  const totalProteinToday = sumField(meals, 'estimated_protein_g');
  // null if the profile is missing required fields (e.g. sex) - see nutritionTargets.js.
  const calorieTarget = calculateCalorieTarget(profile);
  const proteinTarget = calculateProteinTarget(profile);
  // Negative once the user has eaten more than the target - the summary
  // card then shows "Over by 200" instead of "Remaining -200".
  const remainingCalories = calorieTarget ? calorieTarget - totalCaloriesToday : null;
  const isOverTarget = remainingCalories !== null && remainingCalories < 0;

  // The form + meal list is taller than the screen, so it all lives in one
  // ScrollView. KeyboardAvoidingView pushes it up so the keyboard doesn't
  // cover the field being typed in; keyboardShouldPersistTaps lets a tap on
  // a button work on the first tap even while the keyboard is open.
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // iOS: add space so the keyboard doesn't cover the fields
    >
      <ScrollView // the whole page scrolls when it's taller than the screen
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled" // buttons work on the first tap even with the keyboard open
        keyboardDismissMode="on-drag" // scrolling closes the keyboard
      >
        <Text style={styles.overline}>Fuel your day</Text>
        <Text style={styles.title}>Nutrition</Text>

        {/* Reminder that AI numbers are only estimates. */}
        <View style={styles.aiBanner}>
          <Ionicons name="sparkles-outline" size={16} color={colors.warning} />
          <Text style={styles.aiBannerText}>AI estimates are approximate. Review before saving.</Text>
        </View>

        {/* Two versions of the summary card: a full target/logged/remaining
            view once we can calculate a target, or a simpler "just show what
            was logged" view when the profile doesn't have enough data yet. */}
        <View style={styles.summaryCard}> 
          {calorieTarget ? (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Estimated daily target</Text>
                  <Text style={styles.summaryValue}>~{calorieTarget.toLocaleString()} kcal</Text>
                </View>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Logged today</Text>
                  <Text style={styles.summaryValue}>~{totalCaloriesToday.toLocaleString()} kcal</Text>
                </View>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>{isOverTarget ? 'Over by' : 'Remaining'}</Text>
                  <Text style={[styles.summaryValue, isOverTarget && styles.summaryValueOver]}>
                    ~{Math.abs(remainingCalories).toLocaleString()} kcal
                  </Text>
                </View>
              </View>
              {proteinTarget && (
                <Text style={styles.summarySubtext}>
                  Estimated protein: ~{totalProteinToday}g / target ~{proteinTarget}g
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.summaryLabel}>Estimated calories logged today</Text>
              <Text style={styles.summaryValue}>~{totalCaloriesToday.toLocaleString()} kcal</Text>
              <Text style={styles.summarySubtext}>
                Add your sex, age, height, weight and activity level in your profile to see a daily
                target.
              </Text>
            </>
          )}
          <Text style={styles.summarySubtext}>
            {meals.length} meal{meals.length === 1 ? '' : 's'} logged · estimates only
          </Text>
        </View>

        <ChipSelector label="Meal Type" options={MEAL_TYPES} selected={mealType} onSelect={setMealType} />

        <TextInput
          style={styles.input}
          value={description}
          onChangeText={handleDescriptionChange}
          placeholder="What did you eat?"
          maxLength={500} // same limit the backend enforces (routes/analyzeMealText.js)
        />

        {/* "Estimate with AI" for a typed meal. Hidden while a photo is
            attached - the photo has its own "Analyze with AI" button below,
            and showing both would be confusing. */}
        {!photoUri && (
          <View style={styles.textEstimateWrapper}>
            <Text style={styles.hintText}>Include portion size for a better estimate.</Text>
            <PressableScale
              style={[
                styles.analyzeButton,
                (!description.trim() || analysisStatus === 'loading') && styles.buttonDisabled,
              ]}
              onPress={handleEstimateWithAI}
              disabled={!description.trim() || analysisStatus === 'loading'}
            >
              {analysisStatus === 'loading' ? (
                <ActivityIndicator color={colors.textOnColor} />
              ) : (
                <Text style={styles.analyzeButtonText}>
                  {/* After one estimate, the same button offers to estimate again. */}
                  {analysisStatus === 'done' ? 'Estimate again' : 'Estimate with AI'}
                </Text>
              )}
            </PressableScale>

            {analysisStatus === 'error' && (
              <Text style={styles.errorText}>
                Couldn't estimate this meal. Check that the backend is running, then try again.
              </Text>
            )}

            {analysisStatus === 'not_food' && (
              <Text style={styles.errorText}>
                This doesn't look like a meal description. Describe what you ate and try again.
              </Text>
            )}

            {estimateOutdated && (
              <Text style={styles.hintText}>
                Description changed - estimate again, or check the numbers below yourself.
              </Text>
            )}
          </View>
        )}

        <TextInput
          style={styles.input}
          value={caloriesInput}
          onChangeText={handleCaloriesChange}
          keyboardType="numeric"
          placeholder="Estimated calories"
        />

        <TextInput
          style={styles.input}
          value={proteinInput}
          onChangeText={handleProteinChange}
          keyboardType="numeric"
          placeholder="Estimated protein, grams"
        />

        <View style={styles.photoButtonRow}>
          <PressableScale style={styles.photoButton} onPress={handleTakePhoto}>
            <Ionicons name="camera-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </PressableScale>
          <PressableScale style={styles.photoButton} onPress={handleChooseFromLibrary}>
            <Ionicons name="images-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.photoButtonText}>Library</Text>
          </PressableScale>
        </View>

        {/* Photo preview + "Analyze with AI" only shows once a photo exists.
            The Analyze button itself is hidden once analysisStatus is "done"
            (nothing left to analyze until a new photo is picked). */}
        {photoUri ? (
          <View style={styles.previewWrapper}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <PressableScale onPress={handleRemovePhoto}>
              <Text style={styles.removePhotoText}>Remove photo</Text>
            </PressableScale>

            {analysisStatus !== 'done' && (
              <PressableScale style={styles.analyzeButton} onPress={handleAnalyzeWithAI} disabled={analysisStatus === 'loading'}>
                {analysisStatus === 'loading' ? (
                  <ActivityIndicator color={colors.textOnColor} />
                ) : (
                  <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
                )}
              </PressableScale>
            )}

            {analysisStatus === 'error' && (
              <Text style={styles.errorText}>
                Couldn't analyze this photo. Check that the backend is running, then try again.
              </Text>
            )}

            {analysisStatus === 'not_food' && (
              <Text style={styles.errorText}>
                This image doesn't appear to contain food. Please choose or take a meal photo.
              </Text>
            )}
          </View>
        ) : null}

        {/* The "untrusted AI result" review step - nothing here is saved yet.
            Only tapping "Add Meal" below actually writes to SQLite. */}
        {analysisStatus === 'done' && (
          <View style={styles.reviewBox}>
            <Text style={styles.reviewTitle}>AI Detected Foods (review before saving)</Text>
            <Text style={styles.reviewObservation}>{aiObservation}</Text>
            <Text style={styles.reviewCalories}>
              Approximate calorie estimate: {caloriesInput} kcal · ~{proteinInput}g protein
            </Text>
            {detectedFoods.map((food, index) => (
              <DetectedFoodItem
                key={`${food.name}-${index}`}
                food={food}
                onRemove={() => handleRemoveDetectedFood(index)}
              />
            ))}
            {detectedFoods.length === 0 && (
              <Text style={styles.emptyText}>No foods left - all were removed.</Text>
            )}
          </View>
        )}

        {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}

        <PressableScale
          style={[styles.addButton, isSaving && styles.buttonDisabled]}
          onPress={handleAddMeal}
          disabled={isSaving}
        >
          {!isSaving && <Ionicons name="add-circle" size={20} color={colors.textOnColor} />}
          <Text style={styles.addButtonText}>{isSaving ? 'Saving…' : 'Add Meal'}</Text>
        </PressableScale>

        <Text style={styles.sectionTitle}>Today's Meals</Text>

        {/* A plain map instead of FlatList - a FlatList can't sit inside a
            ScrollView, and a day's meal list is short anyway. */}
        {meals.length === 0 ? (
          <Text style={styles.emptyText}>No meals logged yet today.</Text>
        ) : (
          meals.map((item) => (
            <MealListItem key={String(item.id)} meal={item} onDelete={handleDeleteMeal} />
          ))
        )}
        <Text style={styles.disclaimerText}>
          Nutrition values are estimates based on the information and images provided. Actual
          values may vary due to portion size, ingredients and preparation method.
        </Text>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
