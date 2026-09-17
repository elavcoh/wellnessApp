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
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [meals, setMeals] = useState([]);

  const [photoMimeType, setPhotoMimeType] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle | loading | done | not_food | error
  const [detectedFoods, setDetectedFoods] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [aiObservation, setAiObservation] = useState('');

  // Estimated calories: works for both AI-analyzed and purely manual meals.
  // Auto-filled/recalculated from AI results unless the user has typed their
  // own value - same "never overwrite a manual entry" rule as description.
  const [caloriesInput, setCaloriesInput] = useState('');
  const [caloriesManuallyEdited, setCaloriesManuallyEdited] = useState(false);
  const [proteinInput, setProteinInput] = useState('');
  const [proteinManuallyEdited, setProteinManuallyEdited] = useState(false);

  const [profile, setProfile] = useState(null);

  const loadMeals = useCallback(async () => {
    const rows = await getMealsForDate(getTodayDateString());
    setMeals(rows);
  }, []);

  const loadProfile = useCallback(async () => {
    const profileRow = await getProfile();
    setProfile(profileRow);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMeals();
      loadProfile();
    }, [loadMeals, loadProfile])
  );

  function resetAnalysis() {
    setAnalysisStatus('idle');
    setDetectedFoods([]);
    setAiSummary('');
    setAiObservation('');
  }

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
      resetAnalysis();
    }
  }

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

  function handleRemovePhoto() {
    setPhotoUri(null);
    setPhotoMimeType(null);
    resetAnalysis();
  }

  async function handleAnalyzeWithAI() {
    setAnalysisStatus('loading');
    try {
      const result = await analyzeMealPhoto(photoUri, photoMimeType);

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

  function handleCaloriesChange(text) {
    setCaloriesInput(text);
    setCaloriesManuallyEdited(true);
  }

  function handleProteinChange(text) {
    setProteinInput(text);
    setProteinManuallyEdited(true);
  }

  async function handleAddMeal() {
    if (!description.trim()) return;

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

  const totalCaloriesToday = meals.reduce((sum, meal) => sum + (meal.estimated_calories || 0), 0);
  const totalProteinToday = meals.reduce((sum, meal) => sum + (meal.estimated_protein_g || 0), 0);
  const calorieTarget = calculateCalorieTarget(profile);
  const proteinTarget = calculateProteinTarget(profile);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition</Text>

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
