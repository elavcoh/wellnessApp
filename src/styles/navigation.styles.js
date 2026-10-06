/**
 * navigation.styles.js
 *
 * Purpose: Styles for the tab bar, headers and startup screens.
 * Related to: AppTabs.js and RootNavigator.js. Values come from theme.js.
 */

import { StyleSheet } from 'react-native';

import { colors, common, radius, spacing, type } from './theme';

export default StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  startupErrorText: {
    ...type.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: common.primaryButton,
  retryButtonText: common.primaryButtonText,
  header: {
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...type.heading,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    shadowColor: '#8A6A4F',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
