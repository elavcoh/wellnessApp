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
 * NutritionScreen.js
 *
 * Purpose: Log meals manually or by photo, review/edit AI-detected foods
 * and their estimated calories/protein, and see today's totals against the
 * calculated daily target.
 * Related to: one of the 6 main tabs. Uses aiService.js for photo analysis
 * and mealsRepository.js for storage.
 */

import ChipSelector from '../components/ChipSelector';
import MealListItem from '../components/MealListItem';
import DetectedFoodItem from '../components/DetectedFoodItem';
import { addMeal, deleteMeal, getMealsForDate } from '../database/repositories/mealsRepository';
import { getProfile } from '../database/repositories/userProfileRepository';
import { getCurrentTimeString, getTodayDateString } from '../utils/dateUtils';
import { analyzeMealPhoto } from '../services/aiService';
import { calculateCalorieTarget, calculateProteinTarget } from '../services/nutritionTargets';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function NutritionScreen() {
  // --- The "new meal" form fields (what the user is currently filling in) ---
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState(null); // local file path of the chosen/taken photo, or null
  const [meals, setMeals] = useState([]); // today's already-saved meals, shown in the list below

  // --- AI photo-analysis state (all reset together by resetAnalysis()) ---
  const [photoMimeType, setPhotoMimeType] = useState(null); // needed so the backend knows the real image format (see handleChooseFromLibrary)
  // analysisStatus tracks where we are in the "Analyze with AI" flow:
  //   idle     - no analysis run yet for the current photo
  //   loading  - waiting for the backend/AI to respond
  //   done     - got a real food result back, showing the review box
  //   not_food - the AI decided the photo isn't food at all
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

  // Sends the photo to the backend for AI analysis and fills in the
  // detected foods, calories and protein (unless the user already typed
  // their own values).
  async function handleAnalyzeWithAI() {
    setAnalysisStatus('loading');
    try {
      const result = await analyzeMealPhoto(photoUri, photoMimeType);

      // The AI checked the photo and decided it isn't food at all (e.g. a
      // screenshot or a person) - show the "not a meal photo" message
      // instead of pretending it found something.
      if (!result.is_food) {
        setDetectedFoods([]);
        setAnalysisStatus('not_food');
        return;
      }

      setDetectedFoods(result.foods);
      setAiSummary(result.meal_summary);
      setAiObservation(result.general_observation);
      setAnalysisStatus('done');
      // Only fill the description if the user hasn't typed their own -
      // never overwrite something they already wrote.
      if (!description.trim()) {
        setDescription(result.meal_summary);
      }
      if (!caloriesManuallyEdited) {
        setCaloriesInput(String(result.total_estimated_calories));
      }
      if (!proteinManuallyEdited) {
        setProteinInput(String(result.total_estimated_protein_g));
      }
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
  function handleCaloriesChange(text) {
    setCaloriesInput(text);
    setCaloriesManuallyEdited(true);
  }

  function handleProteinChange(text) {
    setProteinInput(text);
    setProteinManuallyEdited(true);
  }

  // Saves the meal to SQLite. This is the only place the meal is actually
  // stored - nothing is saved just from taking a photo or analyzing it.
  async function handleAddMeal() {
    if (!description.trim()) return; // description is the one required field

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
      estimatedCalories: Number(caloriesInput) || null,
      estimatedProteinG: Number(proteinInput) || null,
    });
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
        onChangeText={setDescription}
        placeholder="What did you eat?"
      />

      <TextInput
        style={styles.input}
        value={caloriesInput}
        onChangeText={handleCaloriesChange}
        keyboardType="numeric"
        placeholder="Estimated calories (optional)"
      />

      <TextInput
        style={styles.input}
        value={proteinInput}
        onChangeText={handleProteinChange}
        keyboardType="numeric"
        placeholder="Estimated protein, grams (optional)"
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
