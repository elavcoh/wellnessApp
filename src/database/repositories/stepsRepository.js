/**
 * Reads and saves daily step totals.
 */

import { getDb } from '../db';

// Saves today's step count. Creates a new row for today, or updates the
// existing one if MovementScreen already saved steps earlier today.
export async function saveTodaySteps({ date, stepCount, stepGoalSnapshot, source }) {
  const db = await getDb();
  const now = new Date().toISOString();
  // "SELECT id" (not "SELECT *") because we only need to know WHETHER a row
  // for today exists, and if so, its id - we don't need any of its other
  // columns just to decide between INSERT and UPDATE below.
  const existing = await db.getFirstAsync('SELECT id FROM steps_daily WHERE date = ?;', [date]);

  if (existing) {
    await db.runAsync(
      'UPDATE steps_daily SET step_count = ?, step_goal_snapshot = ?, source = ?, updated_at = ? WHERE id = ?;',
      [stepCount, stepGoalSnapshot, source, now, existing.id]
    );
  } else {
    await db.runAsync(
      `INSERT INTO steps_daily (date, step_count, step_goal_snapshot, source, updated_at)
       VALUES (?, ?, ?, ?, ?);`,
      [date, stepCount, stepGoalSnapshot, source, now]
    );
  }
}

// Returns the most recent step rows, newest first (up to `days` rows).
export async function getRecentSteps(days) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM steps_daily ORDER BY date DESC LIMIT ?;', [days]);
}

// Returns the step row for one specific date, or undefined if none exists
// (e.g. Movement was never opened that day - not the same as 0 steps).
export async function getStepsForDate(date) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM steps_daily WHERE date = ?;', [date]);
}
