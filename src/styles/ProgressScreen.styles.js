/**
 * ProgressScreen.styles.js
 *
 * Purpose: All styles for ProgressScreen.js - layout, colors and text sizes only, no logic.
 * Related to: imported by screens/ProgressScreen.js. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, common, spacing, type } from './theme';

export default StyleSheet.create({
  container: common.screen,
  subtitle: { ...type.overline, color: colors.primary, marginBottom: spacing.xs },
  title: { ...type.display, marginBottom: spacing.xl },
  emptyText: { ...type.small, marginBottom: spacing.lg },

  card: common.card,
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: type.heading,
  cardSubtitle: { ...type.small, marginTop: -spacing.sm, marginBottom: spacing.md },

  // Workout week - one dot per day.
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  dotColumn: { alignItems: 'center', gap: spacing.sm },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accentSoft, borderWidth: 2, borderColor: colors.accent },
  dotCompleted: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotEmpty: { backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt },
  dotLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
});
