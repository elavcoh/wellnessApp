/**
 * theme.js
 *
 * Purpose: The app's design system in one place: colors, spacing, corner radius,
 * shadows and text styles. No logic, only values.
 * Related to: every other file in src/styles/ builds on these values; a few screens
 * read colors directly (icons).
 */

// Warm, calm palette: cream background, deep sage as the main color, warm
// peach as the accent, and a soft lavender for breathing/AI.
export const colors = {
  background: '#FAF6F1', // warm cream behind every screen
  surface: '#FFFFFF', // cards
  surfaceAlt: '#F4EEE7', // inputs, inactive chips, tracks
  border: '#EDE4DA',

  text: '#2B2420', // warm charcoal, not pure black
  textMuted: '#857A71',
  textSoft: '#B5AAA0',
  textOnColor: '#FFFFFF',

  primary: '#2F7D6D', // deep sage teal - main actions, progress
  primaryDark: '#24655A',
  primarySoft: '#E2F0EB',

  accent: '#E58A5E', // warm peach - highlights, nutrition
  accentSoft: '#FBEAE0',

  calm: '#7D72C9', // lavender - breathing, AI Coach
  calmSoft: '#EEEBFA',

  warning: '#C2862B',
  warningSoft: '#FBF1DE',
  danger: '#D0574B',
  dangerSoft: '#FBE5E2',
};

// Each breathing phase gets its own color, so the circle "feels" the phase.
export const phaseColors = {
  inhale: colors.primary,
  hold: colors.calm,
  exhale: colors.accent,
};

// Space between and inside elements, in points. Use these instead of
// random numbers so the whole app has the same rhythm.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

// Corner roundness: small for inputs, large for cards, pill for buttons.
export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

// One soft, warm shadow used for every card (iOS reads shadow*, Android
// reads elevation).
export const shadow = {
  shadowColor: '#8A6A4F',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};

// Text styles. Spread one into a style, e.g. { ...type.title, color: ... }.
export const type = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, color: colors.text },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, color: colors.text },
  heading: { fontSize: 17, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  small: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  // Small spaced-out capitals - the "tech" label look used above numbers.
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  metric: { fontSize: 34, fontWeight: '800', letterSpacing: -1, color: colors.text },
};

// Shared building blocks that many style files reuse as-is.
export const common = {
  screen: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xl, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    marginBottom: spacing.lg,
    fontSize: 16,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadow,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
  },
  primaryButtonText: { color: colors.textOnColor, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  secondaryButton: {
    backgroundColor: colors.primarySoft,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: spacing.sm },
};
