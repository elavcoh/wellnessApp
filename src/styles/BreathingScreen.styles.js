/**
 * BreathingScreen.styles.js
 *
 * Purpose: All styles for BreathingScreen.js - layout, colors and text sizes only, no logic.
 * Related to: imported by screens/BreathingScreen.js. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, common, radius, shadow, spacing, type } from './theme';

export default StyleSheet.create({
  container: common.screen,
  overline: { ...type.overline, color: colors.calm, marginBottom: spacing.xs },
  title: { ...type.display, marginBottom: spacing.lg },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  statusPillDone: { backgroundColor: colors.primarySoft },
  statusText: { fontSize: 13, fontWeight: '600', color: colors.text },
  sectionTitle: { ...type.overline, marginTop: spacing.xl, marginBottom: spacing.md },

  // The session player - a calm lavender-tinted card.
  player: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow,
  },
  playerTitle: { ...type.title, textAlign: 'center' },
  playerTime: { ...type.overline, marginTop: spacing.sm },
  controlsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.calm,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.pill,
  },
  cancelButton: { backgroundColor: colors.surfaceAlt },
  controlButtonText: { color: colors.textOnColor, fontSize: 15, fontWeight: '700' },
  cancelButtonText: { color: colors.text },
});
