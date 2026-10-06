/**
 * WelcomeScreen.js
 *
 * Purpose: The first screen a brand-new user sees, before a profile exists. Leads
 * into ProfileSetupScreen.js.
 * Related to: RootNavigator.js shows it when no profile is saved yet. Styles in
 * styles/WelcomeScreen.styles.js.
 */

import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '../components/PressableScale';
import { colors } from '../styles/theme';
import styles from '../styles/WelcomeScreen.styles';

// This screen has no state and no data loading - it's the simplest screen
// in the app, just a message and one button. "navigation" is provided
// automatically by React Navigation (see RootNavigator.js, which lists
// "Welcome" as one of its screens).
export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Soft layered circles behind the logo - decoration only. */}
      <View style={styles.orbOuter}>
        <View style={styles.orbMiddle}>
          <View style={styles.orbInner}>
            <Ionicons name="leaf" size={44} color={colors.textOnColor} />
          </View>
        </View>
      </View>
      <Text style={styles.overline}>Nutrition · Movement · Breath</Text>
      <Text style={styles.title}>Welcome to Wellness</Text>
      <Text style={styles.subtitle}>
        Let's set up your profile so we can tailor your daily suggestions.
      </Text>
      {/* "ProfileSetup" is the route name registered in RootNavigator.js -
          tapping this button moves forward in the one-time onboarding flow. */}
      <PressableScale
        style={styles.button}
        onPress={() => navigation.navigate('ProfileSetup')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.textOnColor} />
      </PressableScale>
    </View>
  );
}
