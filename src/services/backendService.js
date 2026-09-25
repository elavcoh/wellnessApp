/**
 * backendService.js
 *
 * Purpose: Simple check that the local backend server is reachable.
 * Related to: used by HomeScreen.js's "Test Backend Connection" button
 * (a diagnostic tool from early development).
 */

import { API_BASE_URL } from '../constants/apiConfig';

// Returns true if the backend responds with an "ok" status, false otherwise.
// Never throws - any failure (backend not running, wrong IP, no WiFi, etc.)
// is treated the same way and just returns false, so the button that calls
// this never crashes the app, it just shows "Connection failed".
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    // fetch() itself throws (rather than just returning a bad response)
    // when it can't even reach the server at all - e.g. wrong IP, backend
    // not running, or the phone isn't on the same WiFi network.
    return false;
  }
}
