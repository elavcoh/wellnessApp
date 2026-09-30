/**
 * Reads and saves daily step totals.
 */

import { getDb } from '../db';

// Saves the step count for several days at once (from stepService.js's
// 7-day sync). Each day gets a new row, or updates its existing row.
// "ON CONFLICT(date) DO UPDATE" is SQLite's built-in insert-or-update: since
// the date column is UNIQUE, inserting a date that already exists updates
// that row instead. One transaction = one disk write for all the days.
export async function saveDailySteps(days) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const { date, stepCount, stepGoalSnapshot, source } of days) {
      await db.runAsync(
        `INSERT INTO steps_daily (date, step_count, step_goal_snapshot, source, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET
           step_count = excluded.step_count,
           step_goal_snapshot = excluded.step_goal_snapshot,
           source = excluded.source,
           updated_at = excluded.updated_at;`,
        [date, stepCount, stepGoalSnapshot, source, now]
      );
    }
  });
}

// Returns the most recent step rows, newest first (up to `days` rows).
export async function getRecentSteps(days) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM steps_daily ORDER BY date DESC LIMIT ?;', [days]);
}

// Returns the step row for one specific date, or undefined if none exists
// (e.g. the app wasn't opened within 7 days of that date - not the same as 0 steps).
export async function getStepsForDate(date) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM steps_daily WHERE date = ?;', [date]);
}
