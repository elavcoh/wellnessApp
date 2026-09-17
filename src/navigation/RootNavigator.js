import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AppTabs from './AppTabs';
import { initDatabase } from '../database/schema';
import { getProfile } from '../database/repositories/userProfileRepository';
import { getNotificationSettings } from '../database/repositories/notificationSettingsRepository';
import { syncScheduledNotifications } from '../services/notificationService';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  // null = still checking, true/false = whether a profile already exists
  const [hasProfile, setHasProfile] = useState(null);

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

  if (hasProfile === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasProfile ? 'MainTabs' : 'Welcome'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="MainTabs" component={AppTabs} />
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
