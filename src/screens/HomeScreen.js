/**
 * HomeScreen.js
 *
 * Purpose: The first tab: a quick view of today (steps, workout, breathing) with
 * shortcuts to Movement, Breathing and Edit Profile.
 * Related to: AppTabs.js. Uses stepService.js, workoutsRepository.js,
 * breathingRepository.js. Styles in styles/HomeScreen.styles.js.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { checkBackendHealth } from '../services/backendService';
import { syncRecentSteps } from '../services/stepService';
import { getWorkoutForDate } from '../database/repositories/workoutsRepository';
import { getTodayCompletedSessions } from '../database/repositories/breathingRepository';
import { getTodayDateString } from '../utils/dateUtils';
import PressableScale from '../components/PressableScale';
import { colors } from '../styles/theme';
import styles from '../styles/HomeScreen.styles';

// Text shown on Home for each workout status saved in the database.
const WORKOUT_STATUS_LABELS = {
  not_started: 'Workout not started',
  in_progress: 'Workout in progress',
  completed: 'Workout completed',
};

// "navigation" here is passed in automatically by React Navigation to every
// screen it renders - it's how this screen can move to a different screen
// (see navigation.navigate calls below) even though HomeScreen itself
// never appears in RootNavigator.js's list of routes (it's nested one
// level deeper, inside AppTabs.js).
export default function HomeScreen({ navigation }) {
  const [connectionStatus, setConnectionStatus] = useState(null); // null | 'checking' | 'connected' | 'failed'
  const [workoutStatusLabel, setWorkoutStatusLabel] = useState(WORKOUT_STATUS_LABELS.not_started);
  const [breathingStatusLabel, setBreathingStatusLabel] = useState('No breathing session today');
  const [stepsTodayLabel, setStepsTodayLabel] = useState('Checking steps...');

  // Every time this tab is opened, re-check today's workout and breathing
  // status - this is what keeps Home in sync after the user does something
  // on the Movement or Breathing tab and then switches back here.
  useFocusEffect(
    useCallback(() => {
      getWorkoutForDate(getTodayDateString()).then((workout) => {
        // workout is null if none was generated yet today - "?? 'not_started'"
        // handles that by falling back to the same label as a real
        // not-started workout.
        setWorkoutStatusLabel(WORKOUT_STATUS_LABELS[workout?.status ?? 'not_started']);
      });
      getTodayCompletedSessions().then((sessions) => {
        setBreathingStatusLabel(
          sessions.length > 0 ? 'Breathing completed' : 'No breathing session today'
        );
      });
      // Also saves the last 7 days of steps to SQLite, so the step history
      // stays complete even if the user never opens the Movement tab.
      syncRecentSteps()
        .then((result) => {
          if (!result.supported) {
            setStepsTodayLabel('Steps today unavailable');
          } else if (!result.granted) {
            setStepsTodayLabel('Steps today: permission needed');
          } else {
            setStepsTodayLabel(`Steps today: ${result.steps.toLocaleString()}`);
          }
        })
        .catch(() => setStepsTodayLabel('Steps today unavailable'));
    }, [])
  );

  // Handler for the debug "Test Backend Connection" button below.
  async function handleTestConnection() {
    setConnectionStatus('checking');
    const isConnected = await checkBackendHealth();
    setConnectionStatus(isConnected ? 'connected' : 'failed');
  }

  // Display only: a warm greeting that matches the time of day.
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.title}>Your day</Text>

      {/* Steps - the main card. Tapping it opens Movement for the details. */}
      <PressableScale style={styles.heroCard} onPress={() => navigation.navigate('Movement')}>
        <View style={styles.heroGlow} />
        <View style={styles.heroIcon}>
          <Ionicons name="walk" size={26} color={colors.textOnColor} />
        </View>
        <Text style={styles.heroOverline}>Movement</Text>
        <Text style={styles.heroValue}>{stepsTodayLabel}</Text>
        <View style={styles.heroLink}>
          <Text style={styles.heroLinkText}>See history & workout</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.textOnColor} />
        </View>
      </PressableScale>

      <View style={styles.tileRow}>
        <PressableScale style={styles.tile} onPress={() => navigation.navigate('Movement')}>
          <View style={[styles.tileIcon, styles.tileIconWorkout]}>
            <Ionicons name="barbell-outline" size={20} color={colors.accent} />
          </View>
          <Text style={styles.tileOverline}>Workout</Text>
          <Text style={styles.tileText}>{workoutStatusLabel}</Text>
        </PressableScale>
        <PressableScale style={styles.tile} onPress={() => navigation.navigate('Breathing')}>
          <View style={[styles.tileIcon, styles.tileIconBreathing]}>
            <Ionicons name="leaf-outline" size={20} color={colors.calm} />
          </View>
          <Text style={styles.tileOverline}>Breathing</Text>
          <Text style={styles.tileText}>{breathingStatusLabel}</Text>
        </PressableScale>
      </View>

      <PressableScale style={styles.editButton} onPress={() => navigation.navigate('ProfileEdit')}>
        <Ionicons name="person-circle-outline" size={20} color={colors.primaryDark} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </PressableScale>

      {/* Debug button to test the backend connection - only visible in dev builds. */}
      <View style={styles.backendTest}>
        <Text style={styles.backendOverline}>Developer</Text>
        <PressableScale style={styles.testButton} onPress={handleTestConnection}>
          <Ionicons name="pulse-outline" size={16} color={colors.textMuted} />
          <Text style={styles.testButtonText}>Test Backend Connection</Text>
        </PressableScale>
        {connectionStatus === 'checking' && <Text style={styles.statusText}>Checking...</Text>}
        {connectionStatus === 'connected' && (
          <Text style={[styles.statusText, styles.statusConnected]}>Connected</Text>
        )}
        {connectionStatus === 'failed' && (
          <Text style={[styles.statusText, styles.statusFailed]}>Connection failed</Text>
        )}
      </View>
    </ScrollView>
  );
}
