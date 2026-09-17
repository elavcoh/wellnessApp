import { getDb } from './db';

export async function initDatabase() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age INTEGER,
      height_cm REAL,
      weight_kg REAL,
      goal TEXT,
      activity_level TEXT,
      workout_experience TEXT,
      workout_days_per_week INTEGER,
      training_location TEXT,
      dietary_preference TEXT,
      avoided_foods TEXT,
      step_goal INTEGER,
      sex TEXT,
      calorie_target_override INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await addColumnIfMissing(db, 'user_profile', 'sex', 'TEXT');
  await addColumnIfMissing(db, 'user_profile', 'calorie_target_override', 'INTEGER');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_type TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      photo_uri TEXT,
      detected_foods_json TEXT,
      estimated_calories INTEGER,
      estimated_protein_g INTEGER,
      created_at TEXT NOT NULL
    );
  `);

  await addColumnIfMissing(db, 'meals', 'photo_uri', 'TEXT');
  await addColumnIfMissing(db, 'meals', 'detected_foods_json', 'TEXT');
  await addColumnIfMissing(db, 'meals', 'estimated_calories', 'INTEGER');
  await addColumnIfMissing(db, 'meals', 'estimated_protein_g', 'INTEGER');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS steps_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      step_count INTEGER NOT NULL,
      step_goal_snapshot INTEGER,
      source TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      workout_name TEXT NOT NULL,
      location TEXT NOT NULL,
      goal TEXT,
      status TEXT NOT NULL DEFAULT 'not_started',
      exercises_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS breathing_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_type TEXT NOT NULL,
      level TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_reminders_enabled INTEGER NOT NULL DEFAULT 0,
      movement_reminders_enabled INTEGER NOT NULL DEFAULT 0,
      evening_summary_enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);
}

// Adds a column to an existing table if it isn't there yet. Needed because
// CREATE TABLE IF NOT EXISTS only runs for brand-new tables, not ones that
// already existed from an earlier version of the app.
async function addColumnIfMissing(db, table, column, type) {
  const columns = await db.getAllAsync(`PRAGMA table_info(${table});`);
  const hasColumn = columns.some((c) => c.name === column);
  if (!hasColumn) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
  }
}
