import { getDb } from '../db';

export async function saveTodaySteps({ date, stepCount, stepGoalSnapshot, source }) {
  const db = await getDb();
  const now = new Date().toISOString();
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

export async function getRecentSteps(days) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM steps_daily ORDER BY date DESC LIMIT ?;', [days]);
}

export async function getStepsForDate(date) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM steps_daily WHERE date = ?;', [date]);
}
