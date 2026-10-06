/**
 * NutritionScreen.styles.js
 *
 * Purpose: All styles for NutritionScreen.js - layout, colors and text sizes only, no logic.
 * Related to: imported by screens/NutritionScreen.js. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, common, radius, spacing, type } from './theme';

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: common.screen,
  overline: { ...type.overline, color: colors.accent, marginBottom: spacing.xs },
  title: { ...type.display, marginBottom: spacing.lg },

  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  aiBannerText: { flex: 1, color: colors.warning, fontSize: 13, fontWeight: '600' },

  // Daily summary - the numbers at a glance.
  summaryCard: common.card,
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryColumn: { flex: 1 },
  summaryLabel: { ...type.overline, fontSize: 10, letterSpacing: 0.6 },
  summaryValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, color: colors.primary, marginTop: spacing.xs },
  summaryValueOver: { color: colors.danger },
  summarySubtext: { ...type.small, marginTop: spacing.xs },

  input: common.input,
  textEstimateWrapper: { marginTop: -spacing.sm, marginBottom: spacing.lg },
  hintText: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.xs },

  // "Estimate with AI" / "Analyze with AI" - lavender, the app's AI color.
  analyzeButton: {
    ...common.primaryButton,
    backgroundColor: colors.calm,
    shadowColor: colors.calm,
    paddingVertical: 13,
    marginTop: spacing.xs,
  },
  analyzeButtonText: common.primaryButtonText,
  buttonDisabled: common.disabled,
  errorText: common.errorText,

  photoButtonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  photoButton: { ...common.secondaryButton, flex: 1, paddingVertical: 14 },
  photoButtonText: common.secondaryButtonText,
  previewWrapper: { alignItems: 'center', marginBottom: spacing.lg },
  previewImage: { width: '100%', height: 220, borderRadius: radius.lg, marginBottom: spacing.sm },
  removePhotoText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginBottom: spacing.md },

  // The AI result waiting for the user's review.
  reviewBox: {
    backgroundColor: colors.calmSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reviewTitle: { ...type.overline, color: colors.calm },
  reviewObservation: { ...type.small, color: colors.text, marginTop: spacing.sm },
  reviewCalories: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: spacing.sm },

  saveErrorText: { ...common.errorText, marginBottom: spacing.sm },
  addButton: { ...common.primaryButton, marginTop: spacing.xs },
  addButtonText: common.primaryButtonText,

  sectionTitle: { ...type.overline, marginTop: spacing.xxl, marginBottom: spacing.md },
  emptyText: { ...type.small, textAlign: 'center', paddingVertical: spacing.lg },
  disclaimerText: { fontSize: 11, color: colors.textSoft, lineHeight: 16, marginTop: spacing.lg, textAlign: 'center' },
});
