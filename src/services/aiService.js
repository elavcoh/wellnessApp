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
  // photoUri is a local file path on the phone (e.g. "file:///.../photo.jpg")
  // - it only makes sense on this device, so we can't just send that path
  // to the backend. Instead we read the actual image bytes and turn them
  // into base64 text, which CAN be sent inside a normal JSON request.
  const file = new File(photoUri);
  const imageBase64 = await file.base64();

  // fetch() is the standard way to make an HTTP request in JavaScript.
  // API_BASE_URL is the Mac's LAN address (see constants/apiConfig.js) -
  // this request only works while the phone and Mac are on the same WiFi.
  const response = await fetch(`${API_BASE_URL}/api/analyze-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType: mimeType ?? 'image/jpeg' }),
  });

  // response.ok is false for any HTTP error status (400, 500, etc.) - fetch
  // does NOT throw automatically just because the server returned an
  // error, so this check is what turns that into a real JS error the
  // calling screen can catch.
  if (!response.ok) {
    throw new Error('Meal analysis request failed');
  }

  return response.json();
}

// Sends a question plus the current wellness context to the AI Coach.
// Simpler than analyzeMealPhoto above - no file to read, just plain data,
// so the whole request body is already JSON-friendly on its own.
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
