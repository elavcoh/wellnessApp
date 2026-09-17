import { File } from 'expo-file-system';

import { API_BASE_URL } from '../constants/apiConfig';

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
