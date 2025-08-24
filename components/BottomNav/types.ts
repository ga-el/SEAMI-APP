import { ViewStyle } from 'react-native';

export interface BottomNavProps {
  style?: ViewStyle;
  testID?: string;
}

export interface NavigationButton {
  id: string;
  icon: string | React.ReactNode;
  route: string;
  position: 'left' | 'center' | 'right';
  isActive: boolean;
  onPress: () => void;
}

export interface NavigationState {
  currentRoute: string;
  isTransitioning: boolean;
  lastActiveRoute: string;
}

export interface ButtonState {
  isPressed: boolean;
  isActive: boolean;
  isDisabled: boolean;
}

export interface ThemeConfig {
  isDarkTheme: boolean;
  colors: ColorPalette;
  spacing: SpacingConfig;
  typography: TypographyConfig;
}

export interface ColorPalette {
  primary: string;
  primaryDark: string;
  background: {
    dark: string;
    light: string;
  };
  border: {
    dark: string;
    light: string;
  };
  text: {
    active: string;
    inactive: {
      dark: string;
      light: string;
    };
  };
}

export interface SpacingConfig {
  containerHeight: number;
  buttonSize: {
    lateral: number;
    center: number;
  };
  padding: {
    horizontal: number;
    vertical: number;
  };
  borderRadius: {
    container: number;
    centerButton: number;
  };
}

export interface TypographyConfig {
  fontSize: {
    small: number;
    medium: number;
    large: number;
  };
  fontWeight: {
    normal: string;
    bold: string;
  };
}

export interface NavigationButtonProps {
  icon: string | React.ReactNode;
  isActive: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}

export interface CenterButtonProps {
  currentRoute: string;
  onPress: () => void;
  testID?: string;
}