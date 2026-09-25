import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

/**
 * RootNavigator.js
 *
 * Purpose: The top-level navigator. Decides whether to show onboarding
 * (Welcome + Profile Setup) or go straight to the main app, based on
 * whether a profile already exists. Also sets up the database and
 * notification schedules once at startup.
 * Related to: rendered by App.js. Owns the app's only NavigationContainer.
 */

import WelcomeScreen from '../screens/WelcomeScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AppTabs from './AppTabs';
import { initDatabase } from '../database/schema';
import { getProfile } from '../database/repositories/userProfileRepository';
import { getNotificationSettings } from '../database/repositories/notificationSettingsRepository';
import { syncScheduledNotifications } from '../services/notificationService';

// createNativeStackNavigator gives us a "stack" of screens where opening a
// new one visually slides in on top, and going back slides it back off -
// like the built-in iOS Settings app. This is different from AppTabs.js's
// bottom-tab navigator, which switches between screens instead of stacking them.
const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  // null = still checking, true/false = whether a profile already exists
  const [hasProfile, setHasProfile] = useState(null);

  // Runs once when the app starts: creates the database tables, checks if
  // a profile already exists, and re-applies any saved notification schedules.
  useEffect(() => {
    async function checkProfile() {
      await initDatabase();
      const profile = await getProfile();
      setHasProfile(profile !== null);

      // Re-apply saved reminder schedules on every cold start, so they stay
      // correct even if iOS ever clears pending notifications.
      const notificationSettings = await getNotificationSettings();
      syncScheduledNotifications(notificationSettings);
    }
    checkProfile();
  }, []);

  // While hasProfile is still null (the startup check above hasn't
  // finished yet), show a spinner instead of a blank or half-set-up
  // screen. This only lasts a fraction of a second in practice.
  if (hasProfile === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // NavigationContainer must wrap the WHOLE app exactly once - this is the
  // only place it appears anywhere in this project (compare AppTabs.js,
  // which used to have its own but doesn't anymore, since nested
  // NavigationContainers aren't allowed).
  return (
    <NavigationContainer>
      {/* initialRouteName picks which screen to start on, decided once
          based on hasProfile - a brand-new user starts at "Welcome", a
          returning user skips straight to "MainTabs".
          screenOptions={{ headerShown: false }} turns off the default
          top header bar for every screen in this stack UNLESS a specific
          screen below overrides it with its own "options" (see ProfileEdit
          and NotificationSettings, which both turn the header back on so
          they get a title and a back button). */}
      <Stack.Navigator
        initialRouteName={hasProfile ? 'MainTabs' : 'Welcome'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        {/* "MainTabs" is the entire 6-tab app (see AppTabs.js) treated as
            just one more screen from this stack's point of view. */}
        <Stack.Screen name="MainTabs" component={AppTabs} />
        {/* Reuses the exact same ProfileSetupScreen component as onboarding
            above, just with a flag telling it to behave as an edit form
            instead (see ProfileSetupScreen.js's "isEditing"). */}
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileSetupScreen}
          initialParams={{ isEditing: true }}
          options={{ headerShown: true, title: 'Edit Profile' }}
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{ headerShown: true, title: 'Notifications' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
