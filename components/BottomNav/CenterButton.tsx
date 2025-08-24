import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../../app/_layout';
import { DEBOUNCE_DELAY, ROUTES } from './constants';
import { createStyles } from './styles';
import { CenterButtonProps } from './types';

const CenterButton: React.FC<CenterButtonProps> = ({
  currentRoute,
  onPress,
  testID,
}) => {
  const { isDarkTheme } = useContext(ThemeContext);
  const router = useRouter();
  const styles = createStyles(isDarkTheme);
  const [isPressed, setIsPressed] = useState(false);
  const [lastPressTime, setLastPressTime] = useState(0);

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastPressTime < DEBOUNCE_DELAY) {
      return; // Prevent rapid taps
    }
    setLastPressTime(now);

    try {
      // Route-specific actions
      switch (currentRoute) {
        case ROUTES.DASHBOARD:
          // Navigate to ZEN/meditation screen
          router.push('/ZEN');
          break;
        case ROUTES.DASHBOARD_TEACHER:
          // Navigate to upload video screen for teachers
          router.push('/subirvideos');
          break;
        default:
          // Default action - could be dashboard navigation
          router.push(ROUTES.DASHBOARD);
          break;
      }
    } catch (error) {
      console.error('Center button navigation error:', error);
      // Fallback to dashboard
      try {
        router.replace(ROUTES.DASHBOARD);
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
      }
    }

    // Call custom onPress if provided
    if (onPress) {
      try {
        onPress();
      } catch (error) {
        console.error('Custom onPress error:', error);
      }
    }
  }, [currentRoute, router, onPress, lastPressTime]);

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  const getIcon = () => {
    try {
      switch (currentRoute) {
        case ROUTES.DASHBOARD:
          return (
            <Text style={[styles.centerButtonIcon, { fontSize: 28 }]}>
              🧘
            </Text>
          );
        case ROUTES.DASHBOARD_TEACHER:
          return (
            <Ionicons
              name="add"
              size={32}
              style={styles.centerButtonIcon}
            />
          );
        default:
          return (
            <Ionicons
              name="home"
              size={28}
              style={styles.centerButtonIcon}
            />
          );
      }
    } catch (error) {
      console.error('Center button icon error:', error);
      // Fallback icon
      return (
        <Text style={[styles.centerButtonIcon, { fontSize: 24 }]}>
          ⭐
        </Text>
      );
    }
  };

  const getAccessibilityLabel = () => {
    switch (currentRoute) {
      case ROUTES.DASHBOARD:
        return 'Abrir modo ZEN';
      case ROUTES.DASHBOARD_TEACHER:
        return 'Agregar contenido';
      default:
        return 'Acción principal';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.centerButton,
        isPressed && styles.centerButtonPressed,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityRole="button"
      testID={testID}
    >
      {getIcon()}
    </TouchableOpacity>
  );
};

export default React.memo(CenterButton, (prevProps, nextProps) => {
  return (
    prevProps.currentRoute === nextProps.currentRoute &&
    prevProps.testID === nextProps.testID
  );
});