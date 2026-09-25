/**
 * notificationSettingsRepository.js
 *
 * Purpose: Reads and writes the user's local notification preferences
 * (meal / movement / evening summary, each on or off). One row only.
 * Related to: used by NotificationSettingsScreen.js and by
 * RootNavigator.js (to re-apply schedules every time the app starts).
 */

import { getDb } from '../db';

// Used before the user has ever saved settings (e.g. first app launch).
const DEFAULT_SETTINGS = {
  meal_reminders_enabled: 0,
  movement_reminders_enabled: 0,
  evening_summary_enabled: 0,
};

// Reads the saved settings, or DEFAULT_SETTINGS (all off) if the user has
// never opened Notification Settings and saved anything yet.
export async function getNotificationSettings() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM notification_settings ORDER BY id LIMIT 1;');
  return row ?? DEFAULT_SETTINGS;
}

// Same insert-or-update pattern as userProfileRepository.saveProfile() -
// one row total, created the first time, updated every time after.
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
