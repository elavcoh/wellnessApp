/**
 * db.js
 *
 * Purpose: Opens the app's single SQLite database file (wellness.db) once and shares
 * that same connection with every repository.
 * Related to: every file in database/repositories/ and schema.js calls getDb().
 */

import * as SQLite from 'expo-sqlite';

let dbPromise = null;

// Returns the shared database connection, creating it the first time it's needed.
export function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('wellness.db');
  }
  return dbPromise;
}
