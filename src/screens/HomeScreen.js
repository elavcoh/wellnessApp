import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * HomeScreen.js
 *
 * Purpose: The first tab. Shows a quick daily status (workout, breathing)
 * and links to Edit Profile and Notification Settings.
 * Related to: one of the 6 main tabs, defined in navigation/AppTabs.js.
 */

import { checkBackendHealth } from '../services/backendService';
import { getWorkoutForDate } from '../database/repositories/workoutsRepository';
import { getTodayCompletedSessions } from '../database/repositories/breathingRepository';
import { getTodayDateString } from '../utils/dateUtils';

const WORKOUT_STATUS_LABELS = {
  not_started: 'Workout not started',
  in_progress: 'Workout in progress',
  completed: 'Workout completed',
};

export default function HomeScreen({ navigation }) {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [workoutStatusLabel, setWorkoutStatusLabel] = useState(WORKOUT_STATUS_LABELS.not_started);
  const [breathingStatusLabel, setBreathingStatusLabel] = useState('No breathing session today');

  useFocusEffect(
    useCallback(() => {
      getWorkoutForDate(getTodayDateString()).then((workout) => {
        setWorkoutStatusLabel(WORKOUT_STATUS_LABELS[workout?.status ?? 'not_started']);
      });
      getTodayCompletedSessions().then((sessions) => {
        setBreathingStatusLabel(
          sessions.length > 0 ? 'Breathing completed' : 'No breathing session today'
        );
      });
    }, [])
  );

  async function handleTestConnection() {
    setConnectionStatus('checking');
    const isConnected = await checkBackendHealth();
    setConnectionStatus(isConnected ? 'connected' : 'failed');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.workoutStatus}>{workoutStatusLabel}</Text>
      <Text style={styles.workoutStatus}>{breathingStatusLabel}</Text>
      <View style={styles.buttonRow}>
        <Pressable
          style={styles.editButton}
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
        <Pressable
          style={styles.editButton}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <Text style={styles.editButtonText}>Notification Settings</Text>
        </Pressable>
      </View>

      {/* Temporary backend connectivity check for Milestone 5 */}
      <View style={styles.backendTest}>
        <Pressable style={styles.testButton} onPress={handleTestConnection}>
          <Text style={styles.testButtonText}>Test Backend Connection</Text>
        </Pressable>
        {connectionStatus === 'checking' && <Text style={styles.statusText}>Checking...</Text>}
        {connectionStatus === 'connected' && (
          <Text style={[styles.statusText, styles.statusConnected]}>Connected</Text>
        )}
        {connectionStatus === 'failed' && (
          <Text style={[styles.statusText, styles.statusFailed]}>Connection failed</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  workoutStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2f8f5b',
  },
  editButtonText: {
    color: '#2f8f5b',
    fontWeight: '600',
  },
  backendTest: {
    marginTop: 32,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#2f8f5b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
  },
  statusConnected: {
    color: '#2f8f5b',
    fontWeight: '700',
  },
  statusFailed: {
    color: '#c0392b',
    fontWeight: '700',
  },
});
