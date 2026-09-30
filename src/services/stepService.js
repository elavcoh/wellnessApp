/**
 * Reads the phone's step counts (today + the last 7 days) and saves them.
 */

import { Pedometer } from 'expo-sensors';

import { getProfile } from '../database/repositories/userProfileRepository';
import { getRecentSteps, saveDailySteps } from '../database/repositories/stepsRepository';
import { toLocalDateString } from '../utils/dateUtils';

// iOS Core Motion keeps only the last 7 days of step data (today + 6 past
// days), so that's as far back as we can ever fill in.
const HISTORY_DAYS = 7;

// If a sync is already running (e.g. Home and Movement both asked at the
// same moment), callers share it instead of starting a second one.
let syncInFlight = null;

// Checks Pedometer permission/availability, fills in any missing or
// unfinished days from the last 7 days, saves them to SQLite, and returns
// today's step count: { supported, granted, steps }.
// Called by HomeScreen.js and MovementScreen.js every time they're opened.
export function syncRecentSteps() {
  if (!syncInFlight) {
    syncInFlight = runSync().finally(() => {
      syncInFlight = null;
    });
  }
  return syncInFlight;
}

async function runSync() {
  // isAvailableAsync checks whether this DEVICE has step-counting hardware
  // at all - the iOS Simulator does not, so this is false there, even
  // before asking about permission.
  const isAvailable = await Pedometer.isAvailableAsync();
  if (!isAvailable) {
    return { supported: false, granted: false, steps: 0 };
  }

  // This shows the iOS system permission prompt the first time it's
  // called. If the user already answered before, it just returns that
  // previous answer without showing the prompt again.
  const permission = await Pedometer.requestPermissionsAsync();
  if (!permission.granted) {
    return { supported: true, granted: false, steps: 0 };
  }

  const [profile, savedRows] = await Promise.all([getProfile(), getRecentSteps(HISTORY_DAYS)]);
  const currentGoal = profile?.step_goal ?? null;
  const savedByDate = Object.fromEntries(savedRows.map((row) => [row.date, row]));

  // Decide which days actually need asking Core Motion. Today always does.
  // A past day only does if we have no row for it, or its row was saved
  // before that day ended (so it's missing the steps from later that day).
  // Once a past day is saved after it ended, its number is final and it's
  // never fetched again - so normally this is just today (+ yesterday once).
  const now = new Date();
  const daysToFetch = [];
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    // Local midnight at the start of this day (setHours uses the phone's time zone).
    const start = new Date();
    start.setDate(start.getDate() - daysAgo);
    start.setHours(0, 0, 0, 0);
    // End = next local midnight, or "right now" for today.
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const isToday = daysAgo === 0;

    const date = toLocalDateString(start);
    const saved = savedByDate[date];
    const isFinal = saved && saved.updated_at >= end.toISOString();
    if (isToday || !isFinal) {
      daysToFetch.push({ date, start, end: isToday ? now : end, isToday, saved });
    }
  }

  // Ask Core Motion for all those days at the same time (in parallel), not
  // one after another - this is what keeps opening the app fast.
  const results = await Promise.all(
    daysToFetch.map((day) => Pedometer.getStepCountAsync(day.start, day.end))
  );

  const rowsToSave = daysToFetch.map((day, i) => ({
    date: day.date,
    stepCount: results[i]?.steps ?? 0,
    // Today uses the current goal. A past day keeps the goal it already had
    // saved (the goal the user had back then), or the current one if new.
    stepGoalSnapshot: day.isToday ? currentGoal : day.saved?.step_goal_snapshot ?? currentGoal,
    source: 'pedometer',
  }));
  await saveDailySteps(rowsToSave);

  const todaySteps = rowsToSave[rowsToSave.length - 1].stepCount; // today is always last
  return { supported: true, granted: true, steps: todaySteps };
}
