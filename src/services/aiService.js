/**
 * aiService.js
 *
 * Purpose: Sends requests from the phone to the local backend for the two
 * AI features (meal photo analysis, AI Coach advice). Never talks to
 * OpenAI directly - only to our own backend, which holds the API key.
 * Related to: used by NutritionScreen.js and AICoachScreen.js.
 */

import { File } from 'expo-file-system';

import { API_BASE_URL } from '../constants/apiConfig';

// Sends a meal photo to the backend for AI analysis.
// Throws on any failure (network down, backend down, OpenAI error) so the
// screen can show a clear "analysis failed" message instead of pretending
// it worked.
export async function analyzeMealPhoto(photoUri, mimeType) {
  const file = new File(photoUri);
  const imageBase64 = await file.base64();

  const response = await fetch(`${API_BASE_URL}/api/analyze-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType: mimeType ?? 'image/jpeg' }),
  });

  if (!response.ok) {
    throw new Error('Meal analysis request failed');
  }

  return response.json();
}

// Sends a question plus the current wellness context to the AI Coach.
export async function getWellnessAdvice(question, context) {
  const response = await fetch(`${API_BASE_URL}/api/wellness-advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  });

  if (!response.ok) {
    throw new Error('Wellness advice request failed');
  }

  return response.json();
}
