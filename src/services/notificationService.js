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
// piling up duplicates.
const IDENTIFIERS = {
  meal: 'meal-reminder',
  movement: 'movement-reminder',
  eveningSummary: 'evening-summary-reminder',
};

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

async function scheduleDaily(key) {
  const { title, body, hour, minute } = REMINDERS[key];
  const identifier = IDENTIFIERS[key];
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

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
