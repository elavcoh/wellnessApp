import { Pedometer } from 'expo-sensors';

// Never queries historical days - iOS only reliably retains about a week of
// pedometer history anyway. We only ask for "today", and let the app build
// up its own history in SQLite one saved day at a time.
export async function getTodayStepCount() {
  const isAvailable = await Pedometer.isAvailableAsync();
  if (!isAvailable) {
    return { supported: false, granted: false, steps: 0 };
  }

  const permission = await Pedometer.requestPermissionsAsync();
  if (!permission.granted) {
    return { supported: true, granted: false, steps: 0 };
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const now = new Date();

  const result = await Pedometer.getStepCountAsync(startOfToday, now);
  return { supported: true, granted: true, steps: result?.steps ?? 0 };
}
