import { getDb } from '../db';

const DEFAULT_SETTINGS = {
  meal_reminders_enabled: 0,
  movement_reminders_enabled: 0,
  evening_summary_enabled: 0,
};

export async function getNotificationSettings() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM notification_settings ORDER BY id LIMIT 1;');
  return row ?? DEFAULT_SETTINGS;
}

export async function saveNotificationSettings(settings) {
  const db = await getDb();
  const existing = await db.getFirstAsync('SELECT id FROM notification_settings ORDER BY id LIMIT 1;');
  const now = new Date().toISOString();
  const values = [
    settings.meal_reminders_enabled ? 1 : 0,
    settings.movement_reminders_enabled ? 1 : 0,
    settings.evening_summary_enabled ? 1 : 0,
  ];

  if (existing) {
    await db.runAsync(
      `UPDATE notification_settings
       SET meal_reminders_enabled = ?, movement_reminders_enabled = ?, evening_summary_enabled = ?, updated_at = ?
       WHERE id = ?;`,
      [...values, now, existing.id]
    );
  } else {
    await db.runAsync(
      `INSERT INTO notification_settings
        (meal_reminders_enabled, movement_reminders_enabled, evening_summary_enabled, updated_at)
       VALUES (?, ?, ?, ?);`,
      [...values, now]
    );
  }
}
