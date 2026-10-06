/**
 * apiConfig.js
 *
 * Purpose: Works out the address of the local backend server (Node/Express on the
 * computer), so the phone knows where to send AI requests.
 * Related to: aiService.js and backendService.js build every request URL from
 * API_BASE_URL.
 */

import Constants from 'expo-constants';

const BACKEND_PORT = 3000;

// The phone can't reach the backend via "localhost" - that would mean the
// phone itself, not the computer. Instead of hardcoding the computer's LAN
// IP (which changes between WiFi networks and between computers), we reuse
// the address the phone already used to load the app from the Expo dev
// server. hostUri looks like "192.168.1.7:8081" - we keep the IP and swap
// in the backend's port. This assumes the backend runs on the same computer
// as "npx expo start", which is how this project is set up.
//
// To point at a different backend, set EXPO_PUBLIC_API_URL (e.g. in a .env
// file in the project root) and restart Expo - it takes priority.
function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:${BACKEND_PORT}`;
}

export const API_BASE_URL = getApiBaseUrl();
