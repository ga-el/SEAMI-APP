import { Dimensions, StyleSheet } from 'react-native';
import { COLORS, SPACING } from './constants';

const { width: screenWidth } = Dimensions.get('window');

export const createStyles = (isDarkTheme: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SPACING.containerHeight,
    backgroundColor: isDarkTheme ? COLORS.background.dark : COLORS.background.light,
    borderTopWidth: 1,
    borderTopColor: isDarkTheme ? COLORS.border.dark : COLORS.border.light,
    borderTopLeftRadius: SPACING.borderRadius.container,
    borderTopRightRadius: SPACING.borderRadius.container,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.padding.horizontal,
    paddingVertical: SPACING.padding.vertical,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: isDarkTheme ? 0.4 : 0.15,
    shadowRadius: 12,
    elevation: 12,
    // Backdrop blur effect simulation
    ...(isDarkTheme ? {
      borderTopColor: 'rgba(139, 195, 74, 0.15)',
    } : {
      borderTopColor: 'rgba(139, 195, 74, 0.08)',
    }),
  },
  safeAreaContainer: {
    backgroundColor: isDarkTheme ? COLORS.background.dark : COLORS.background.light,
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10, // Slight elevation effect
  },
  navigationButton: {
    width: SPACING.buttonSize.lateral,
    height: SPACING.buttonSize.lateral,
    borderRadius: SPACING.buttonSize.lateral / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    // Smooth transition preparation
    transform: [{ scale: 1 }],
  },
  navigationButtonActive: {
    backgroundColor: isDarkTheme 
      ? 'rgba(139, 195, 74, 0.18)' 
      : 'rgba(139, 195, 74, 0.12)',
    borderWidth: 1,
    borderColor: isDarkTheme 
      ? 'rgba(139, 195, 74, 0.3)' 
      : 'rgba(139, 195, 74, 0.2)',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navigationButtonPressed: {
    backgroundColor: isDarkTheme 
      ? 'rgba(139, 195, 74, 0.28)' 
      : 'rgba(139, 195, 74, 0.22)',
    transform: [{ scale: 0.92 }],
  },
  centerButton: {
    width: SPACING.buttonSize.center,
    height: SPACING.buttonSize.center,
    borderRadius: SPACING.borderRadius.centerButton,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    // Gradient-like effect with multiple shadows
    ...(isDarkTheme ? {} : {
      shadowColor: COLORS.primary,
    }),
    transform: [{ scale: 1 }],
  },
  centerButtonPressed: {
    backgroundColor: COLORS.primaryDark,
    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
    transform: [{ scale: 0.93 }],
    shadowOpacity: 0.6,
  },
  iconActive: {
    color: COLORS.text.active,
  },
  iconInactive: {
    color: isDarkTheme ? COLORS.text.inactive.dark : COLORS.text.inactive.light,
  },
  centerButtonIcon: {
    color: '#ffffff',
  },
  zenIcon: {
    width: 28,
    height: 28,
    tintColor: '#ffffff',
  },
  profileAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Additional visual enhancements
  buttonRipple: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(139, 195, 74, 0.3)',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  centerButtonGlow: {
    position: 'absolute',
    width: SPACING.buttonSize.center + 20,
    height: SPACING.buttonSize.center + 20,
    borderRadius: (SPACING.buttonSize.center + 20) / 2,
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    top: -10,
    left: -10,
  },
  // Responsive adjustments for smaller screens
  ...(screenWidth < 375 && {
    container: {
      paddingHorizontal: SPACING.padding.horizontal - 4,
    },
    navigationButton: {
      width: SPACING.buttonSize.lateral - 4,
      height: SPACING.buttonSize.lateral - 4,
    },
    centerButton: {
      width: SPACING.buttonSize.center - 8,
      height: SPACING.buttonSize.center - 8,
    },
  }),
});