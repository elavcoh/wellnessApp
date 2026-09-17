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

export async function getTodayCompletedSessions() {
  const db = await getDb();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return db.getAllAsync(
    'SELECT * FROM breathing_sessions WHERE completed_at >= ? ORDER BY completed_at DESC;',
    [startOfToday.toISOString()]
  );
}

export async function getBreathingCountsByDate(days) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT date(completed_at) as date, COUNT(*) as count FROM breathing_sessions
     GROUP BY date(completed_at) ORDER BY date DESC LIMIT ?;`,
    [days]
  );
}
