/**
 * breathingRepository.js
 *
 * Purpose: Reads and writes completed breathing sessions in SQLite. A row
 * is only ever created when a session finishes - canceling a session
 * writes nothing.
 * Related to: used by BreathingScreen.js, HomeScreen.js (breathing
 * status), wellnessContextBuilder.js, and ProgressScreen.js.
 */

import { getDb } from '../db';

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
export async function getBreathingCountsByDate(days) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT date(completed_at) as date, COUNT(*) as count FROM breathing_sessions
     GROUP BY date(completed_at) ORDER BY date DESC LIMIT ?;`,
    [days]
  );
}
