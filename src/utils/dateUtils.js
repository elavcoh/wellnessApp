/**
 * Date and time helpers.
 *
 * Every calendar day in the app ("YYYY-MM-DD") uses the phone's local
 * clock, never UTC - so "today" always matches what the user sees on
 * their phone, even right after midnight.
 */

// Turns a Date into "YYYY-MM-DD" using the phone's local time zone.
// (toISOString() would give the UTC day instead, which can be off by one.)
export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Returns today's local date as "YYYY-MM-DD".
export function getTodayDateString() {
  return toLocalDateString(new Date());
}

// Returns the current clock time as "HH:MM" (local device time).
export function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Oldest to newest, including today - e.g. getLastNDateStrings(7) gives the
// last 7 local calendar days as ["2026-09-09", ..., "2026-09-15"].
export function getLastNDateStrings(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(toLocalDateString(d));
  }
  return dates;
}

// Turns "2026-09-15" into a short weekday name like "Tue", for chart labels.
// Builds the Date from its parts (year, month, day) so it's read as a local
// date - no UTC conversion involved.
export function getWeekdayLabel(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
}
