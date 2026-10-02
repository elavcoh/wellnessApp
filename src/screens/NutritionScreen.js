import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Meal logging and nutrition tracking screen.
 */

import ChipSelector from '../components/ChipSelector';
import MealListItem from '../components/MealListItem';
import DetectedFoodItem from '../components/DetectedFoodItem';
import { addMeal, deleteMeal, getMealsForDate } from '../database/repositories/mealsRepository';
import { getProfile } from '../database/repositories/userProfileRepository';
import { getCurrentTimeString, getTodayDateString } from '../utils/dateUtils';
import { analyzeMealPhoto, analyzeMealText } from '../services/aiService';
import { calculateCalorieTarget, calculateProteinTarget } from '../services/nutritionTargets';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

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

  // --- Estimated calories/protein for the meal being added ---
  // These work the same way for both AI-analyzed and purely manual meals.
  // They get auto-filled/recalculated from the AI result whenever it
  // changes, UNLESS the user has typed into the field themselves - once
  // that happens, "*ManuallyEdited" flips to true and auto-fill stops,
  // exactly like how "description" is never overwritten once non-empty.
  const [caloriesInput, setCaloriesInput] = useState('');
  const [caloriesManuallyEdited, setCaloriesManuallyEdited] = useState(false);
  const [proteinInput, setProteinInput] = useState('');
  const [proteinManuallyEdited, setProteinManuallyEdited] = useState(false);

  // Message shown above "Add Meal" when the meal can't be saved yet (e.g.
  // calories missing). Cleared as soon as the user changes the form.
  const [saveError, setSaveError] = useState('');

  // The user's profile, needed only to calculate the calorie/protein
  // targets shown in the summary card below (see calculateCalorieTarget).
  const [profile, setProfile] = useState(null);

  // Re-reads today's meals from SQLite (used after saving/deleting a meal,
  // and every time this tab gains focus).
  const loadMeals = useCallback(async () => {
    const rows = await getMealsForDate(getTodayDateString());
    setMeals(rows);
  }, []);

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
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoMimeType(result.assets[0].mimeType ?? null);
      resetAnalysis(); // a new photo makes any previous analysis result invalid
    }
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
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoMimeType(result.assets[0].mimeType ?? null);
      resetAnalysis();
    }
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
    // never overwrite something they already wrote.
    if (!description.trim()) {
      setDescription(result.meal_summary);
    }
    if (overwriteValues || !caloriesManuallyEdited) {
      setCaloriesInput(String(result.total_estimated_calories));
      setCaloriesManuallyEdited(false);
    }
    if (overwriteValues || !proteinManuallyEdited) {
      setProteinInput(String(result.total_estimated_protein_g));
      setProteinManuallyEdited(false);
    }
  }

  // Sends the photo to the backend for AI analysis and fills in the
  // detected foods, calories and protein (unless the user already typed
  // their own values).
  async function handleAnalyzeWithAI() {
    setAnalysisStatus('loading');
    try {
      const result = await analyzeMealPhoto(photoUri, photoMimeType);
      applyAnalysisResult(result, { overwriteValues: false });
    } catch (error) {
      setAnalysisStatus('error');
    }
  }

  // Sends the typed description to the backend for an AI estimate and
  // fills in the calories and protein. The user can still edit them, and
  // nothing is saved until they press "Add Meal".
  async function handleEstimateWithAI() {
    if (!description.trim()) return; // button is disabled in this case anyway
    setAnalysisStatus('loading');
    try {
      const result = await analyzeMealText(description.trim());
      applyAnalysisResult(result, { overwriteValues: true });
    } catch (error) {
      setAnalysisStatus('error');
    }
  }

  // Removes one AI-detected food and recalculates the calorie/protein
  // totals from what's left.
  function handleRemoveDetectedFood(index) {
    setDetectedFoods((current) => {
      const updated = current.filter((_, i) => i !== index);
      if (!caloriesManuallyEdited) {
        const recalculatedCalories = updated.reduce(
          (sum, food) => sum + (food.estimated_calories || 0),
          0
        );
        setCaloriesInput(String(recalculatedCalories));
      }
      if (!proteinManuallyEdited) {
        const recalculatedProtein = updated.reduce(
          (sum, food) => sum + (food.estimated_protein_g || 0),
          0
        );
        setProteinInput(String(recalculatedProtein));
      }
      return updated;
    });
  }

  // These fire whenever the user types into the calories/protein fields.
  // Marking "manually edited" is what stops handleAnalyzeWithAI and
  // handleRemoveDetectedFood from overwriting the user's own number later.
  // Any change to the form also clears an old "can't save yet" message.
  function handleDescriptionChange(text) {
    setDescription(text);
    setSaveError('');
  }

  function handleCaloriesChange(text) {
    setCaloriesInput(text);
    setCaloriesManuallyEdited(true);
    setSaveError('');
  }

  function handleProteinChange(text) {
    setProteinInput(text);
    setProteinManuallyEdited(true);
    setSaveError('');
  }

  // Saves the meal to SQLite. This is the only place the meal is actually
  // stored - nothing is saved just from taking a photo or analyzing it.
  // Description, calories and protein are all required: a meal without
  // numbers would silently count as 0 in today's totals and the AI Coach.
  async function handleAddMeal() {
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

    await addMeal({
      mealType,
      description: description.trim(),
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      photoUri,
      detectedFoodsJson,
      estimatedCalories: calories,
      estimatedProteinG: protein,
    });
    setSaveError('');
    setDescription('');
    setPhotoUri(null);
    setPhotoMimeType(null);
    setCaloriesInput('');
    setCaloriesManuallyEdited(false);
    setProteinInput('');
    setProteinManuallyEdited(false);
    resetAnalysis();
    loadMeals();
  }

  async function handleDeleteMeal(id) {
    await deleteMeal(id);
    loadMeals();
  }

  // Everything below is computed fresh on every render from `meals` and
  // `profile` - no extra state needed, just plain math over what's already loaded.
  const totalCaloriesToday = meals.reduce((sum, meal) => sum + (meal.estimated_calories || 0), 0);
  const totalProteinToday = meals.reduce((sum, meal) => sum + (meal.estimated_protein_g || 0), 0);
  // null if the profile is missing required fields (e.g. sex) - see nutritionTargets.js.
  const calorieTarget = calculateCalorieTarget(profile);
  const proteinTarget = calculateProteinTarget(profile);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition</Text>

      <View style={styles.aiBanner}>
        <Text style={styles.aiBannerText}>AI estimates are approximate. Review before saving.</Text>
      </View>

      {/* Two versions of the summary card: a full target/logged/remaining
          view once we can calculate a target, or a simpler "just show what
          was logged" view when the profile doesn't have enough data yet. */}
      <View style={styles.summaryCard}>
        {calorieTarget ? (
          <>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Estimated daily target</Text>
                <Text style={styles.summaryValue}>~{calorieTarget.toLocaleString()} kcal</Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>Logged today</Text>
                <Text style={styles.summaryValue}>~{totalCaloriesToday.toLocaleString()} kcal</Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text style={styles.summaryValue}>
                  ~{(calorieTarget - totalCaloriesToday).toLocaleString()} kcal
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
      />

      {/* "Estimate with AI" for a typed meal. Hidden while a photo is
          attached - the photo has its own "Analyze with AI" button below,
          and showing both would be confusing. */}
      {!photoUri && (
        <View style={styles.textEstimateWrapper}>
          <Text style={styles.hintText}>Include portion size for a better estimate.</Text>
          <Pressable
            style={[
              styles.analyzeButton,
              (!description.trim() || analysisStatus === 'loading') && styles.buttonDisabled,
            ]}
            onPress={handleEstimateWithAI}
            disabled={!description.trim() || analysisStatus === 'loading'}
          >
            {analysisStatus === 'loading' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeButtonText}>
                {analysisStatus === 'done' ? 'Estimate again' : 'Estimate with AI'}
              </Text>
            )}
          </Pressable>

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
        <Pressable style={styles.photoButton} onPress={handleTakePhoto}>
          <Text style={styles.photoButtonText}>Take Photo</Text>
        </Pressable>
        <Pressable style={styles.photoButton} onPress={handleChooseFromLibrary}>
          <Text style={styles.photoButtonText}>Choose from Library</Text>
        </Pressable>
      </View>

      {/* Photo preview + "Analyze with AI" only shows once a photo exists.
          The Analyze button itself is hidden once analysisStatus is "done"
          (nothing left to analyze until a new photo is picked). */}
      {photoUri ? (
        <View style={styles.previewWrapper}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <Pressable onPress={handleRemovePhoto}>
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </Pressable>

          {analysisStatus !== 'done' && (
            <Pressable style={styles.analyzeButton} onPress={handleAnalyzeWithAI} disabled={analysisStatus === 'loading'}>
              {analysisStatus === 'loading' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
              )}
            </Pressable>
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

      <Pressable style={styles.addButton} onPress={handleAddMeal}>
        <Text style={styles.addButtonText}>Add Meal</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Today's Meals</Text>

      <FlatList
        data={meals}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <MealListItem meal={item} onDelete={handleDeleteMeal} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No meals logged yet today.</Text>}
        ListFooterComponent={
          <Text style={styles.disclaimerText}>
            Nutrition values are estimates based on the information and images provided. Actual
            values may vary due to portion size, ingredients and preparation method.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2f8f5b',
    marginTop: 2,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#999',
    marginTop: 16,
    lineHeight: 16,
  },
  reviewCalories: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a6ea5',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  photoButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  photoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2f8f5b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#2f8f5b',
    fontWeight: '600',
    fontSize: 13,
  },
  previewWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
  },
  removePhotoText: {
    color: '#c0392b',
    fontSize: 13,
  },
  analyzeButton: {
    backgroundColor: '#3a6ea5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  textEstimateWrapper: {
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 14,
  },
  hintText: {
    fontSize: 12,
    color: '#888',
  },
  aiBanner: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#f0d58a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  aiBannerText: {
    fontSize: 13,
    color: '#7a5b00',
  },
  saveErrorText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 8,
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  reviewBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  reviewObservation: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#2f8f5b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
