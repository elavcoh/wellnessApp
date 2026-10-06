/**
 * components.styles.js
 *
 * Purpose: Styles for the small shared components in src/components/, one block per
 * component.
 * Related to: imported by each component file. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing, type } from './theme';

// BarRow.js
export const barRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  label: { width: 36, fontSize: 12, fontWeight: '600', color: colors.textMuted },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  value: { width: 60, fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'right' },
});

// BreathingCircle.js
export const breathingCircleStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    marginVertical: 12,
  },
  ring: { position: 'absolute', borderRadius: 999 },
  ringOuter: { width: 200, height: 200 },
  ringMiddle: { width: 170, height: 170 },
  circle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  phaseLabel: { ...type.heading, fontSize: 19, color: colors.textOnColor, letterSpacing: 0.5 },
});

// ChipSelector.js
export const chipSelectorStyles = StyleSheet.create({
  wrapper: { marginBottom: spacing.xl },
  label: { ...type.overline, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: colors.textOnColor, fontWeight: '700' },
});

// DetectedFoodItem.js
export const detectedFoodItemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  detail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  calories: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 4 },
  removeButton: { padding: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
});

// ExerciseItem.js
export const exerciseItemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.surface,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  nameCompleted: { color: colors.textMuted, textDecorationLine: 'line-through' },
  detail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});

// MealListItem.js
export const mealListItemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow,
    shadowOpacity: 0.05,
  },
  thumbnail: { width: 48, height: 48, borderRadius: radius.sm, marginRight: spacing.md },
  info: { flex: 1 },
  mealType: { ...type.overline, color: colors.accent },
  description: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
  calories: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 2 },
  time: { fontSize: 12, color: colors.textMuted, marginRight: spacing.sm },
  deleteButton: { padding: spacing.sm, borderRadius: radius.pill },
});

// RecommendationCard.js
export const recommendationCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.calmSoft,
    borderRadius: radius.md,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  reason: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 2 },
});

// SessionCard.js
export const sessionCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow,
  },
  playBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  playBadgeAdvanced: { backgroundColor: colors.calmSoft },
  body: { flex: 1 },
  title: { ...type.heading, fontSize: 16 },
  description: { ...type.small, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  duration: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  pattern: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});

// StepProgressBar.js
export const stepProgressBarStyles = StyleSheet.create({
  track: {
    height: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
});
