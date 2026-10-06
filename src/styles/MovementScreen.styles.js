/**
 * MovementScreen.styles.js
 *
 * Purpose: All styles for MovementScreen.js - layout, colors and text sizes only, no logic.
 * Related to: imported by screens/MovementScreen.js. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, common, radius, spacing, type } from './theme';

export default StyleSheet.create({
  container: common.screen,
  overline: { ...type.overline, color: colors.primary, marginBottom: spacing.xs },
  title: { ...type.display, marginBottom: spacing.xl },
  centerBlock: { marginVertical: spacing.xxxl },
  messageText: { ...type.small, marginBottom: spacing.md },

  stepsCard: { ...common.card, alignItems: 'center', paddingVertical: spacing.xxl },
  stepsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stepsLabel: type.overline,
  stepsCount: { ...type.metric, fontSize: 44, color: colors.primary, marginTop: spacing.xs, marginBottom: spacing.lg },
  goalText: { ...type.small, marginTop: spacing.sm, textAlign: 'center', alignSelf: 'stretch' },

  sectionTitle: { ...type.overline, marginTop: spacing.sm, marginBottom: spacing.md },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: spacing.md },
  historyDate: { flex: 1, fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  historySteps: { fontSize: 14, fontWeight: '700', color: colors.text },

  workoutsSectionTitle: { marginTop: spacing.xxl },
  workoutCard: common.card,
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  workoutName: { ...type.title, fontSize: 19 },
  workoutMeta: { ...type.overline, color: colors.accent, marginTop: spacing.xs, marginBottom: spacing.lg },
  generateButton: { ...common.primaryButton, marginTop: spacing.md },
  generateButtonText: common.primaryButtonText,
  workoutCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
  workoutCompletedText: { color: colors.primaryDark, fontWeight: '700', fontSize: 15 },
});
