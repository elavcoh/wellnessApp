/**
 * db.js
 *
 * Purpose: Opens the local SQLite database ("wellness.db") once and shares
 * the same connection everywhere, instead of opening a new one each time.
 * Related to: used by every file in database/repositories/ and by
 * database/schema.js. This is the only file that talks to expo-sqlite
 * directly.
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
