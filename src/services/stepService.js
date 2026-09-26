/**
 * Reads the phone's step count for today.
 */

import { Pedometer } from 'expo-sensors';

// Checks Pedometer permission/availability, then returns today's step count.
// Never queries historical days - iOS only reliably retains about a week of
// pedometer history anyway. We only ask for "today", and let the app build
// up its own history in SQLite one saved day at a time.
export async function getTodayStepCount() {
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

  // setHours(0, 0, 0, 0) moves a Date to the very start of today (midnight)
  // in the phone's local time zone - this is the starting point for "how
  // many steps have I taken today".
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const now = new Date();

  // Asks Core Motion (iOS's built-in step-counting system) for the total
  // step count between those two exact times.
  const result = await Pedometer.getStepCountAsync(startOfToday, now);
  return { supported: true, granted: true, steps: result?.steps ?? 0 };
}
