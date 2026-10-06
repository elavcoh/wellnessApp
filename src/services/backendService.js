/**
 * backendService.js
 *
 * Purpose: Checks whether the local backend server is reachable (used by the
 * developer "Test Backend Connection" button).
 * Related to: HomeScreen.js. Uses API_BASE_URL from apiConfig.js.
 */

import { API_BASE_URL } from '../constants/apiConfig';

// Returns true if the backend responds with an "ok" status, false otherwise.
// Never throws - any failure (backend not running, wrong IP, no WiFi, etc.)
// is treated the same way and just returns false, so the button that calls
// this never crashes the app, it just shows "Connection failed".
export async function checkBackendHealth() {
  // Give up after 5 seconds. Without this, a wrong IP leaves the button on
  // "Checking..." for about a minute (the phone's default network timeout).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    // fetch() itself throws (rather than just returning a bad response)
    // when it can't even reach the server at all - e.g. wrong IP, backend
    // not running, or the phone isn't on the same WiFi network.
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
