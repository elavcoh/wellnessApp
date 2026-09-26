/**
 * Shared SQLite connection.
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
