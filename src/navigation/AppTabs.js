/**
 * Bottom tab navigator for the 6 main screens.
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import NutritionScreen from '../screens/NutritionScreen';
import MovementScreen from '../screens/MovementScreen';
import BreathingScreen from '../screens/BreathingScreen';
import AICoachScreen from '../screens/AICoachScreen';
import ProgressScreen from '../screens/ProgressScreen';

const Tab = createBottomTabNavigator();

// This component itself has no logic - it's just a declaration of "these 6
// screens exist as tabs, in this order". React Navigation handles showing
// the tab bar, switching screens, and keeping each screen's own state alive
// in the background when you switch away and back (which is why, for
// example, Movement's step count doesn't reset just from visiting another tab).
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
