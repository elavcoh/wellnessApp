/**
 * HomeScreen.styles.js
 *
 * Purpose: All styles for HomeScreen.js - layout, colors and text sizes only, no logic.
 * Related to: imported by screens/HomeScreen.js. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, common, radius, shadow, spacing, type } from './theme';

export default StyleSheet.create({
  container: common.screen,
  greeting: { ...type.overline, color: colors.accent, marginBottom: spacing.xs },
  title: { ...type.display, marginBottom: spacing.xl },

  // Steps hero card - deep sage with a soft light circle in the corner.
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadow,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -80,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroOverline: { ...type.overline, color: 'rgba(255,255,255,0.75)' },
  heroValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: colors.textOnColor, marginTop: spacing.xs },
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  heroLinkText: { fontSize: 13, fontWeight: '600', color: colors.textOnColor },

  // Two small tiles side by side.
  tileRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 130,
    ...shadow,
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tileIconWorkout: { backgroundColor: colors.accentSoft },
  tileIconBreathing: { backgroundColor: colors.calmSoft },
  tileOverline: type.overline,
  tileText: { ...type.heading, fontSize: 15, marginTop: spacing.xs },

  editButton: { ...common.secondaryButton, alignSelf: 'flex-start' },
  editButtonText: common.secondaryButtonText,

  // Developer tools card - deliberately quiet.
  backendTest: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  backendOverline: { ...type.overline, color: colors.textSoft, marginBottom: spacing.sm },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  testButtonText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  statusText: { marginTop: spacing.sm, fontSize: 13, color: colors.textMuted },
  statusConnected: { color: colors.primary, fontWeight: '700' },
  statusFailed: { color: colors.danger, fontWeight: '700' },
});
