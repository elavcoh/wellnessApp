/**
 * WelcomeScreen.styles.js
 *
 * Purpose: All styles for WelcomeScreen.js - layout, colors and text sizes only, no logic.
 * Related to: imported by screens/WelcomeScreen.js. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, common, spacing, type } from './theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  orbOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  orbMiddle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(47,125,109,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overline: { ...type.overline, color: colors.accent, marginBottom: spacing.sm },
  title: { ...type.display, textAlign: 'center', marginBottom: spacing.md },
  subtitle: { ...type.body, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xxl },
  button: { ...common.primaryButton, paddingHorizontal: spacing.xxl },
  buttonText: common.primaryButtonText,
});
