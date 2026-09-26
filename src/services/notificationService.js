/**
 * Handles local app notifications.
 */

import * as Notifications from 'expo-notifications';

// Makes notifications show as a banner even while the app is open, not just
// when it's backgrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Stable identifiers so re-scheduling replaces the previous one instead of
// piling up duplicates. Each notification we schedule is given one of
// these exact id strings - that's what lets us find and cancel or replace
// a specific reminder later (e.g. cancelScheduledNotificationAsync below).
const IDENTIFIERS = {
  meal: 'meal-reminder',
  movement: 'movement-reminder',
  eveningSummary: 'evening-summary-reminder',
};

// The actual wording and time-of-day for each of the 3 reminder types.
// "hour"/"minute" are in 24-hour local device time (17 = 5 PM).
const REMINDERS = {
  meal: {
    title: 'Meal check-in',
    body: "It's lunchtime. Have you logged your meal?",
    hour: 13,
    minute: 0,
  },
  movement: {
    title: 'Movement reminder',
    body: 'A short walk could help you get closer to your step goal.',
    hour: 17,
    minute: 0,
  },
  eveningSummary: {
    title: 'Wellness summary',
    body: 'Want to see how your wellness day went?',
    hour: 20,
    minute: 30,
  },
};

// Just checks the current iOS permission status without asking for
// anything - used to decide what message to show on screen (see
// NotificationSettingsScreen.js), separately from actually requesting it.
export async function getNotificationPermissionStatus() {
  return Notifications.getPermissionsAsync();
}

// Only prompts if permission is still undetermined - never re-prompts after
// a denial (iOS won't show the system dialog again anyway once denied).
export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

// Schedules one reminder to repeat every day at a fixed time.
// "key" is one of 'meal' | 'movement' | 'eveningSummary' - just picks which
// entry of REMINDERS/IDENTIFIERS to use.
async function scheduleDaily(key) {
  const { title, body, hour, minute } = REMINDERS[key];
  const identifier = IDENTIFIERS[key];
  // Cancel any existing schedule under this exact identifier first. The
  // ".catch(() => {})" means "if there was nothing to cancel, that's fine,
  // don't treat it as an error" - this makes the function safe to call
  // whether or not this reminder was already scheduled.
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    // type: DAILY + hour/minute means "fire once a day, every day, at this
    // exact clock time" - this is a repeating trigger, not a one-time one.
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// Removes one scheduled reminder. Same "ignore if it wasn't there" safety
// as scheduleDaily above.
async function cancelReminder(key) {
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIERS[key]).catch(() => {});
}

// Applies the saved settings to actual OS-level schedules. Safe to call
// repeatedly (e.g. every app launch) - already-correct schedules are just
// replaced with an identical one.
export async function syncScheduledNotifications(settings) {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  if (settings.meal_reminders_enabled) {
    await scheduleDaily('meal');
  } else {
    await cancelReminder('meal');
  }

  if (settings.movement_reminders_enabled) {
    await scheduleDaily('movement');
  } else {
    await cancelReminder('movement');
  }

  if (settings.evening_summary_enabled) {
    await scheduleDaily('eveningSummary');
  } else {
    await cancelReminder('eveningSummary');
  }
}

// Sends one test notification, used by the "Send test notification" button.
export async function sendTestNotificationIn5Seconds() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'This is a test notification from Wellness App.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
}
