/**
 * WelcomeScreen.js
 *
 * Purpose: The very first screen a new user sees, shown only once before a
 * profile exists. Leads into ProfileSetupScreen.js.
 * Related to: shown by RootNavigator.js when no profile is saved yet.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Wellness</Text>
      <Text style={styles.subtitle}>
        Let's set up your profile so we can tailor your daily suggestions.
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('ProfileSetup')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#2f8f5b',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
