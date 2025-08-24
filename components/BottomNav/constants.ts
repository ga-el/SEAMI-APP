import { ColorPalette, SpacingConfig, TypographyConfig } from './types';

export const COLORS: ColorPalette = {
  primary: '#8bc34a',
  primaryDark: '#6aab3b',
  background: {
    dark: 'rgba(15, 23, 42, 0.95)',
    light: 'rgba(255, 255, 255, 0.95)'
  },
  border: {
    dark: 'rgba(139, 195, 74, 0.2)',
    light: 'rgba(0, 0, 0, 0.05)'
  },
  text: {
    active: '#8bc34a',
    inactive: {
      dark: '#64748b',
      light: '#94a3b8'
    }
  }
};

export const SPACING: SpacingConfig = {
  containerHeight: 80,
  buttonSize: {
    lateral: 48,
    center: 60
  },
  padding: {
    horizontal: 16,
    vertical: 12
  },
  borderRadius: {
    container: 16,
    centerButton: 30
  }
};

export const TYPOGRAPHY: TypographyConfig = {
  fontSize: {
    small: 12,
    medium: 16,
    large: 20
  },
  fontWeight: {
    normal: '400',
    bold: '600'
  }
};

export const ROUTES = {
  DASHBOARD: '/dashboard',
  DASHBOARD_TEACHER: '/dashboard-teacher',
  PROFILE: '/profile',
  SUBIR_VIDEOS: '/subirvideos'
} as const;

export const DEBOUNCE_DELAY = 300; // milliseconds

export const ANIMATION_DURATION = 200; // milliseconds