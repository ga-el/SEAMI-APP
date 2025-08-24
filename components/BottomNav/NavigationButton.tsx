import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useContext, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../../app/_layout';
import { DEBOUNCE_DELAY } from './constants';
import { createStyles } from './styles';
import { NavigationButtonProps } from './types';

const NavigationButton: React.FC<NavigationButtonProps> = ({
  icon,
  isActive,
  onPress,
  accessibilityLabel,
  testID,
}) => {
  const { isDarkTheme } = useContext(ThemeContext);
  const styles = createStyles(isDarkTheme);
  const [isPressed, setIsPressed] = useState(false);
  const [lastPressTime, setLastPressTime] = useState(0);

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastPressTime < DEBOUNCE_DELAY) {
      return; // Prevent rapid taps
    }
    setLastPressTime(now);
    onPress();
  }, [onPress, lastPressTime]);

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
  }, []);

  const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    if (isActive) {
      // Return filled version for active state
      switch (iconName) {
        case 'home-outline':
          return 'home';
        case 'person-outline':
          return 'person';
        default:
          return iconName as keyof typeof Ionicons.glyphMap;
      }
    }
    return iconName as keyof typeof Ionicons.glyphMap;
  };

  const renderIcon = () => {
    if (typeof icon === 'string') {
      try {
        return (
          <Ionicons
            name={getIconName(icon)}
            size={24}
            style={isActive ? styles.iconActive : styles.iconInactive}
          />
        );
      } catch (error) {
        console.error('Icon loading error:', error);
        // Fallback to text icon
        return (
          <Text style={isActive ? styles.iconActive : styles.iconInactive}>
            {icon === 'home-outline' ? '🏠' : '👤'}
          </Text>
        );
      }
    }
    return icon;
  };

  return (
    <TouchableOpacity
      style={[
        styles.navigationButton,
        isActive && styles.navigationButtonActive,
        isPressed && styles.navigationButtonPressed,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      testID={testID}
    >
      {renderIcon()}
    </TouchableOpacity>
  );
};

export default React.memo(NavigationButton, (prevProps, nextProps) => {
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.icon === nextProps.icon &&
    prevProps.accessibilityLabel === nextProps.accessibilityLabel &&
    prevProps.testID === nextProps.testID
  );
});