import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  getNotificationSettings,
  saveNotificationSettings,
} from '../database/repositories/notificationSettingsRepository';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  sendTestNotificationIn5Seconds,
  syncScheduledNotifications,
} from '../services/notificationService';

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  const load = useCallback(async () => {
    const saved = await getNotificationSettings();
    setSettings(saved);
    const permission = await getNotificationPermissionStatus();
    setPermissionDenied(!permission.granted && !permission.canAskAgain);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleToggle(key, value) {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermissionDenied(true);
        return; // permission refused - leave the switch off, nothing saved
      }
      setPermissionDenied(false);
    }

    const updated = { ...settings, [key]: value ? 1 : 0 };
    setSettings(updated);
    await saveNotificationSettings(updated);
    await syncScheduledNotifications(updated);
  }

  async function handleTestNotification() {
    const granted = await requestNotificationPermission();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);
    await sendTestNotificationIn5Seconds();
    setTestStatus('Scheduled - it should arrive in about 5 seconds.');
  }

  if (!settings) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      <Text style={styles.subtitle}>
        All reminders are local, scheduled on this device only, at fixed times.
      </Text>

      {permissionDenied && (
        <Text style={styles.deniedText}>
          Notifications are turned off for this app. Enable them in Settings → Notifications →
          Wellness App to use reminders.
        </Text>
      )}

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Meal reminders</Text>
          <Text style={styles.rowSubtitle}>Daily at 1:00 PM</Text>
        </View>
        <Switch
          value={Boolean(settings.meal_reminders_enabled)}
          onValueChange={(value) => handleToggle('meal_reminders_enabled', value)}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Movement reminders</Text>
          <Text style={styles.rowSubtitle}>Daily at 5:00 PM</Text>
        </View>
        <Switch
          value={Boolean(settings.movement_reminders_enabled)}
          onValueChange={(value) => handleToggle('movement_reminders_enabled', value)}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Evening summary</Text>
          <Text style={styles.rowSubtitle}>Daily at 8:30 PM</Text>
        </View>
        <Switch
          value={Boolean(settings.evening_summary_enabled)}
          onValueChange={(value) => handleToggle('evening_summary_enabled', value)}
        />
      </View>

      <Pressable style={styles.testButton} onPress={handleTestNotification}>
        <Text style={styles.testButtonText}>Send test notification in 5 seconds</Text>
      </Pressable>
      {testStatus && <Text style={styles.testStatusText}>{testStatus}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  deniedText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  testButton: {
    backgroundColor: '#2f8f5b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  testStatusText: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});
