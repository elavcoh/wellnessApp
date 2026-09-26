/**
 * aiService.js
 *
 * Calls the local backend for AI features.
 */

import { File } from 'expo-file-system';

import { API_BASE_URL } from '../constants/apiConfig';

// Sends a meal photo to the backend and returns the parsed AI result.
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

// Sends a user question plus today's wellness data to the AI coach.
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
