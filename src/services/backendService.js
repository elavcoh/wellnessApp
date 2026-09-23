/**
 * backendService.js
 *
 * Purpose: Simple check that the local backend server is reachable.
 * Related to: used by HomeScreen.js's "Test Backend Connection" button
 * (a diagnostic tool from early development).
 */

import { API_BASE_URL } from '../constants/apiConfig';

// Returns true if the backend responds with an "ok" status, false otherwise.
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    return false;
  }
}
