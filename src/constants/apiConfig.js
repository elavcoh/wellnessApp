/**
 * apiConfig.js
 *
 * Purpose: Holds the address of the local backend server (Node/Express).
 * Related to: aiService.js and backendService.js use this URL to reach
 * the backend, which is the only place that talks to OpenAI.
 */

// Your Mac's LAN IP address. The iPhone can't reach the backend via
// "localhost" — that would mean the iPhone itself, not the Mac.
// Update this if your Mac's IP changes (e.g. after reconnecting to WiFi).
export const API_BASE_URL = 'http://10.0.0.15:3000';
