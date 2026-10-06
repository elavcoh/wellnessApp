/**
 * RootNavigator.js
 *
 * Purpose: Starts the app: prepares the database, checks if a profile exists, then
 * shows either the welcome/onboarding flow or the main tabs.
 * Related to: App.js renders it; AppTabs.js holds the tabs. Styles in
 * styles/navigation.styles.js.
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import AppTabs from './AppTabs';
import { initDatabase } from '../database/schema';
import { getProfile } from '../database/repositories/userProfileRepository';
import PressableScale from '../components/PressableScale';
import { colors } from '../styles/theme';
import styles from '../styles/navigation.styles';

// React Navigation's own colors (screen background, header, text) set to
// the app theme, so nothing flashes white between screens.
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

// createNativeStackNavigator gives us a "stack" of screens where opening a
// new one visually slides in on top, and going back slides it back off -
// like the built-in iOS Settings app. This is different from AppTabs.js's
// bottom-tab navigator, which switches between screens instead of stacking them.
const Stack = createNativeStackNavigator();

// hasProfile: null = still checking, true/false = the answer.
// startupFailed: the database could not be opened.
// startupAttempt: bumped by "Try Again" to run the startup check again.
export default function RootNavigator() {
  // null = still checking, true/false = whether a profile already exists
  const [hasProfile, setHasProfile] = useState(null);
  // true if opening the database failed - shows an error with a "Try Again"
  // button instead of leaving the spinner up forever.
  const [startupFailed, setStartupFailed] = useState(false);
  // Bumped by "Try Again" to run the startup check below one more time.
  const [startupAttempt, setStartupAttempt] = useState(0);

  // Runs when the app starts (and again on "Try Again"): creates the
  // database tables and checks if a profile already exists.
  useEffect(() => {
    // Create/upgrade the tables first, then look for a saved profile.
    async function checkProfile() {
      try {
        await initDatabase();
        const profile = await getProfile();
        setHasProfile(profile !== null);
      } catch (error) {
        setStartupFailed(true);
      }
    }
    checkProfile();
  }, [startupAttempt]);

  // "Try Again" button: hide the error and run the startup check again.
  function handleRetryStartup() {
    setStartupFailed(false);
    setStartupAttempt((attempt) => attempt + 1);
  }

  if (startupFailed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.startupErrorText}>
          The app couldn't open its data. Please try again. If this keeps happening, restart the app.
        </Text>
        <PressableScale onPress={handleRetryStartup} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </PressableScale>
      </View>
    );
  }

  // While hasProfile is still null (the startup check above hasn't
  // finished yet), show a spinner instead of a blank or half-set-up
  // screen. This only lasts a fraction of a second in practice.
  if (hasProfile === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // NavigationContainer must wrap the WHOLE app exactly once - this is the
  // only place it appears anywhere in this project (compare AppTabs.js,
  // which used to have its own but doesn't anymore, since nested
  // NavigationContainers aren't allowed).
  return (
    <NavigationContainer theme={navigationTheme}>
      {/* initialRouteName picks which screen to start on, decided once
          based on hasProfile - a brand-new user starts at "Welcome", a
          returning user skips straight to "MainTabs".
          screenOptions={{ headerShown: false }} turns off the default
          top header bar for every screen in this stack UNLESS a specific
          screen below overrides it with its own "options" (see ProfileEdit,
          which turns the header back on so it gets a title and a back
          button). */}
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
          options={{
            headerShown: true,
            title: 'Edit Profile',
            headerStyle: styles.header,
            headerShadowVisible: false,
            headerTintColor: colors.primary,
            headerTitleStyle: styles.headerTitle,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
