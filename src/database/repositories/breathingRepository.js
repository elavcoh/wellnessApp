/**
 * breathingRepository.js
 *
 * Purpose: Saves finished breathing sessions and counts them per day (table
 * breathing_sessions).
 * Related to: BreathingScreen.js saves sessions; HomeScreen.js, ProgressScreen.js and
 * wellnessContextBuilder.js read them.
 */

import { getDb } from '../db';
import { startOfLocalDay, toLocalDateString } from '../../utils/dateUtils';

// Only called when a session finishes naturally - canceling never writes a
// row, so this table always means "sessions actually completed."
export async function saveCompletedSession({ sessionType, level, durationSeconds, startedAt }) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO breathing_sessions (session_type, level, duration_seconds, completed, started_at, completed_at)
     VALUES (?, ?, ?, 1, ?, ?);`,
    [sessionType, level, durationSeconds, startedAt, now]
  );
}

// Returns all sessions completed since local midnight today.
export async function getTodayCompletedSessions() {
  const db = await getDb();
  const startOfToday = startOfLocalDay(0);

  return db.getAllAsync(
    'SELECT * FROM breathing_sessions WHERE completed_at >= ? ORDER BY completed_at DESC;',
    [startOfToday.toISOString()]
  );
}

// Returns how many sessions were completed on each of the last N days.
// Used by ProgressScreen.js to draw the "Breathing" chart.
// Unlike the other tables, breathing_sessions has no separate "date" column
// - only a full UTC timestamp (completed_at, e.g. "2026-09-24T18:03:00.000Z").
// SQLite's date(...) would group by the UTC day, so instead we load the
// sessions from the last N local days and group them by LOCAL day here in JS.
export async function getBreathingCountsByDate(days) {
  const db = await getDb();
  const startOfRange = startOfLocalDay(days - 1); // local midnight, N-1 days ago

  const rows = await db.getAllAsync(
    'SELECT completed_at FROM breathing_sessions WHERE completed_at >= ?;',
    [startOfRange.toISOString()]
  );

  // { "2026-10-06": 2, ... } - one counter per local day.
  const countsByDate = {};
  for (const row of rows) {
    const date = toLocalDateString(new Date(row.completed_at));
    countsByDate[date] = (countsByDate[date] ?? 0) + 1;
  }
  return Object.entries(countsByDate).map(([date, count]) => ({ date, count }));
}
