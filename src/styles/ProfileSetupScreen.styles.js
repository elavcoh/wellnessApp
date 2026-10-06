/**
 * ProfileSetupScreen.styles.js
 *
 * Purpose: All styles for ProfileSetupScreen.js - layout, colors and text sizes only, no logic.
 * Related to: imported by screens/ProfileSetupScreen.js. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, common, radius, spacing, type } from './theme';

export default StyleSheet.create({
  container: { ...common.screen, backgroundColor: colors.background },
  containerOnboarding: { paddingTop: 72 },
  overline: { ...type.overline, color: colors.accent, marginBottom: spacing.xs },
  title: { ...type.display, marginBottom: spacing.xl },
  fieldLabel: { ...type.overline, marginBottom: spacing.sm },
  input: common.input,
  helperText: { fontSize: 12, color: colors.textMuted, marginTop: -spacing.md, marginBottom: spacing.lg, lineHeight: 17 },

  saveButton: { ...common.primaryButton, marginTop: spacing.md },
  saveButtonDisabled: common.disabled,
  saveButtonText: common.primaryButtonText,

  // The live calorie target preview.
  targetCard: { ...common.card, borderTopWidth: 4, borderTopColor: colors.primary },
  targetCardTitle: { ...type.overline, marginBottom: spacing.sm },
  targetValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: colors.primary },
  targetSubtext: { ...type.small, marginTop: spacing.xs },
  overrideLink: { fontSize: 13, fontWeight: '600', color: colors.danger, marginTop: spacing.md },
  overrideBox: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  overrideLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  checkButton: {
    ...common.primaryButton,
    backgroundColor: colors.calm,
    shadowColor: colors.calm,
    paddingVertical: 13,
    marginTop: spacing.xs,
  },
  checkButtonText: common.primaryButtonText,
  checkAnswer: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  checkAnswerCaution: { color: colors.warning, backgroundColor: colors.warningSoft },
  errorText: common.errorText,
});
