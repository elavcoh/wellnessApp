/**
 * AppTabs.js
 *
 * Purpose: Defines the 6 main bottom tabs of the app.
 * Related to: rendered by RootNavigator.js as the "MainTabs" screen, once
 * the user has a saved profile.
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import NutritionScreen from '../screens/NutritionScreen';
import MovementScreen from '../screens/MovementScreen';
import BreathingScreen from '../screens/BreathingScreen';
import AICoachScreen from '../screens/AICoachScreen';
import ProgressScreen from '../screens/ProgressScreen';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Movement" component={MovementScreen} />
      <Tab.Screen name="Breathing" component={BreathingScreen} />
      <Tab.Screen name="AI Coach" component={AICoachScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}
