/**
 * dateUtils.js
 *
 * Purpose: Small helper functions for dates and times used across the app
 * (e.g. "today" as a string, formatting a list of recent days).
 * Related to: used by many screens and repositories that need to know
 * "today's date" or show the last few days.
 */

// Returns today's date as "YYYY-MM-DD". Note: this uses UTC, so right
// after midnight it can briefly show yesterday's date in timezones ahead
// of UTC. Known limitation, not fixed yet.
export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Returns the current clock time as "HH:MM" (local device time).
export function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Oldest to newest, including today - e.g. getLastNDateStrings(7) gives the
// last 7 calendar days as ["2026-09-09", ..., "2026-09-15"].
export function getLastNDateStrings(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// Turns "2026-09-15" into a short weekday name like "Tue", for chart labels.
export function getWeekdayLabel(dateString) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}
