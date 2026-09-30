/**
 * Reads and saves completed breathing sessions.
 */

import { getDb } from '../db';
import { toLocalDateString } from '../../utils/dateUtils';

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
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

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
  const startOfRange = new Date();
  startOfRange.setDate(startOfRange.getDate() - (days - 1));
  startOfRange.setHours(0, 0, 0, 0); // local midnight, N-1 days ago

  const rows = await db.getAllAsync(
    'SELECT completed_at FROM breathing_sessions WHERE completed_at >= ?;',
    [startOfRange.toISOString()]
  );

  const countsByDate = {};
  for (const row of rows) {
    const date = toLocalDateString(new Date(row.completed_at));
    countsByDate[date] = (countsByDate[date] ?? 0) + 1;
  }
  return Object.entries(countsByDate).map(([date, count]) => ({ date, count }));
}
