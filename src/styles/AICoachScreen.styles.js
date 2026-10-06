/**
 * AICoachScreen.styles.js
 *
 * Purpose: All styles for AICoachScreen.js - layout, colors and text sizes only, no logic.
 * Related to: imported by screens/AICoachScreen.js. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, common, radius, shadow, spacing, type } from './theme';

export default StyleSheet.create({
  container: common.screen,
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  headerBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.calm,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowColor: colors.calm,
    shadowOpacity: 0.35,
  },
  overline: { ...type.overline, color: colors.calm },
  title: type.display,
  subtitle: { ...type.small, marginBottom: spacing.lg },

  // Today at a glance - a 2x2 grid.
  summaryBox: { ...common.card, flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  summaryItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingRight: spacing.sm },
  summaryLine: { fontSize: 13, fontWeight: '600', color: colors.text, flexShrink: 1 },

  sectionTitle: { ...type.overline, marginTop: spacing.md, marginBottom: spacing.md },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.calmSoft,
  },
  suggestionText: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1 },

  askRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { ...common.input, flex: 1, marginBottom: 0, borderRadius: radius.pill },
  askButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.calm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loading: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.md },
  loadingText: { ...type.small, color: colors.calm, fontWeight: '600' },
  errorText: { ...common.errorText, marginTop: spacing.lg },

  // The coach's answer.
  resultBox: { ...common.card, marginTop: spacing.xl, borderLeftWidth: 4, borderLeftColor: colors.calm },
  answerText: { ...type.body, marginBottom: spacing.sm },
  resultSectionTitle: { ...type.overline, marginTop: spacing.lg, marginBottom: spacing.sm },
  missingItem: { ...type.small, marginBottom: spacing.xs },
});
