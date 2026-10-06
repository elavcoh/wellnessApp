/**
 * AppTabs.js
 *
 * Purpose: The bottom tab bar with the 6 main screens, and how it looks (icons,
 * colors).
 * Related to: RootNavigator.js shows it as the "MainTabs" screen. Styles in
 * styles/navigation.styles.js.
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import NutritionScreen from '../screens/NutritionScreen';
import MovementScreen from '../screens/MovementScreen';
import BreathingScreen from '../screens/BreathingScreen';
import AICoachScreen from '../screens/AICoachScreen';
import ProgressScreen from '../screens/ProgressScreen';
import { colors } from '../styles/theme';
import styles from '../styles/navigation.styles';

// The tab navigator object - Tab.Navigator holds the tabs, Tab.Screen is one tab.
const Tab = createBottomTabNavigator();

// Icon per tab: [outline when inactive, filled when active].
const TAB_ICONS = {
  Home: ['home-outline', 'home'],
  Nutrition: ['nutrition-outline', 'nutrition'],
  Movement: ['walk-outline', 'walk'],
  Breathing: ['leaf-outline', 'leaf'],
  'AI Coach': ['sparkles-outline', 'sparkles'],
  Progress: ['stats-chart-outline', 'stats-chart'],
};

// Look of the tab bar and the (title-less) header above each tab. Each
// screen shows its own big title, so the header is just a calm spacer
// under the status bar.
const tabScreenOptions = ({ route }) => ({
  headerTitle: '',
  headerStyle: styles.header,
  headerShadowVisible: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSoft,
  tabBarStyle: styles.tabBar,
  tabBarLabelStyle: styles.tabBarLabel,
  tabBarIcon: ({ focused, color, size }) => (
    <Ionicons name={TAB_ICONS[route.name][focused ? 1 : 0]} size={size - 2} color={color} />
  ),
});

// This component itself has no logic - it's just a declaration of "these 6
// screens exist as tabs, in this order". React Navigation handles showing
// the tab bar, switching screens, and keeping each screen's own state alive
// in the background when you switch away and back (which is why, for
// example, Movement's step count doesn't reset just from visiting another tab).
export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Movement" component={MovementScreen} />
      <Tab.Screen name="Breathing" component={BreathingScreen} />
      <Tab.Screen name="AI Coach" component={AICoachScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}
