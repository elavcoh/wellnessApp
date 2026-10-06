/**
 * aiService.js
 *
 * Purpose: The app's only connection to the backend's AI features: meal photo
 * analysis, typed meal estimate, and the AI Coach.
 * Related to: NutritionScreen.js, AICoachScreen.js and ProfileSetupScreen.js call it;
 * backend/routes/ answers it.
 */

import { File } from 'expo-file-system';

import { API_BASE_URL } from '../constants/apiConfig';

// Sends one JSON request to the backend and returns the JSON answer.
// Throws if the backend answers with an error, so each screen can show its
// own "couldn't reach..." message.
async function postToBackend(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Backend request to ${path} failed (${response.status})`);
  }
  return response.json();
}

// Sends a meal photo to the backend and returns the parsed AI result.
// The photo is read from the phone as base64 text so it can travel as JSON.
export async function analyzeMealPhoto(photoUri, mimeType) {
  const imageBase64 = await new File(photoUri).base64();
  return postToBackend('/api/analyze-meal', { imageBase64, mimeType: mimeType ?? 'image/jpeg' });
}

// Sends a typed meal description to the backend and returns the parsed AI
// result - same shape as analyzeMealPhoto(), so the Nutrition screen can
// handle both the same way.
export function analyzeMealText(description) {
  return postToBackend('/api/analyze-meal-text', { description });
}

// Sends a user question plus today's wellness data to the AI coach.
export function getWellnessAdvice(question, context) {
  return postToBackend('/api/wellness-advice', { question, context });
}
