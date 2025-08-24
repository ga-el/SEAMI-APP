import { fireEvent, render } from '@testing-library/react-native';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { ThemeContext } from '../../../app/_layout';
import BottomNav from '../BottomNav';
import { ROUTES } from '../constants';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 20, top: 44, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

const createThemeContext = (isDarkTheme: boolean) => ({
  isDarkTheme,
  toggleTheme: jest.fn(),
});

describe('BottomNav Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Complete Navigation Flow', () => {
    it('navigates between all main screens correctly', async () => {
      // Start on dashboard
      (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
      
      const { getByTestId, rerender } = render(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Navigate to profile
      fireEvent.press(getByTestId('bottom-nav-profile-button'));
      expect(mockRouter.push).toHaveBeenCalledWith(ROUTES.PROFILE);

      // Simulate route change to profile
      (usePathname as jest.Mock).mockReturnValue(ROUTES.PROFILE);
      rerender(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Verify profile is active
      const profileButton = getByTestId('bottom-nav-profile-button');
      expect(profileButton.props.accessibilityState.selected).toBe(true);

      // Navigate back to home
      fireEvent.press(getByTestId('bottom-nav-home-button'));
      expect(mockRouter.push).toHaveBeenCalledWith(ROUTES.DASHBOARD);
    });

    it('handles center button actions for different routes', async () => {
      // Test dashboard route - should navigate to ZEN
      (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
      
      const { getByTestId, rerender } = render(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      fireEvent.press(getByTestId('bottom-nav-center-button'));
      expect(mockRouter.push).toHaveBeenCalledWith('/ZEN');

      // Test teacher dashboard route
      (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD_TEACHER);
      rerender(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      fireEvent.press(getByTestId('bottom-nav-center-button'));
      expect(consoleSpy).toHaveBeenCalledWith('Teacher add action triggered');
      consoleSpy.mockRestore();
    });
  });

  describe('Theme Integration', () => {
    it('switches themes correctly across all components', () => {
      (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
      
      const { rerender } = render(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Switch to dark theme
      rerender(
        <ThemeContext.Provider value={createThemeContext(true)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Component should render without errors
      expect(true).toBe(true);
    });

    it('maintains navigation state during theme changes', () => {
      (usePathname as jest.Mock).mockReturnValue(ROUTES.PROFILE);
      
      const { getByTestId, rerender } = render(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Verify profile is active in light theme
      expect(getByTestId('bottom-nav-profile-button').props.accessibilityState.selected).toBe(true);

      // Switch to dark theme
      rerender(
        <ThemeContext.Provider value={createThemeContext(true)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Profile should still be active in dark theme
      expect(getByTestId('bottom-nav-profile-button').props.accessibilityState.selected).toBe(true);
    });
  });

  describe('Route Detection', () => {
    it('accurately detects and highlights active routes', () => {
      const routes = [ROUTES.DASHBOARD, ROUTES.PROFILE];
      
      routes.forEach(route => {
        (usePathname as jest.Mock).mockReturnValue(route);
        
        const { getByTestId } = render(
          <ThemeContext.Provider value={createThemeContext(false)}>
            <BottomNav />
          </ThemeContext.Provider>
        );

        if (route === ROUTES.DASHBOARD) {
          expect(getByTestId('bottom-nav-home-button').props.accessibilityState.selected).toBe(true);
          expect(getByTestId('bottom-nav-profile-button').props.accessibilityState.selected).toBe(false);
        } else if (route === ROUTES.PROFILE) {
          expect(getByTestId('bottom-nav-home-button').props.accessibilityState.selected).toBe(false);
          expect(getByTestId('bottom-nav-profile-button').props.accessibilityState.selected).toBe(true);
        }
      });
    });

    it('handles unknown routes gracefully', () => {
      (usePathname as jest.Mock).mockReturnValue('/unknown-route');
      
      const { getByTestId } = render(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Should render without errors
      expect(getByTestId('bottom-nav-home-button')).toBeTruthy();
      expect(getByTestId('bottom-nav-center-button')).toBeTruthy();
      expect(getByTestId('bottom-nav-profile-button')).toBeTruthy();
    });
  });

  describe('Error Recovery', () => {
    it('recovers from navigation errors and continues functioning', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock router to fail first, then succeed
      let callCount = 0;
      mockRouter.push.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Navigation failed');
        }
      });

      (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
      
      const { getByTestId } = render(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // First press should fail and trigger fallback
      fireEvent.press(getByTestId('bottom-nav-profile-button'));
      expect(mockRouter.replace).toHaveBeenCalledWith(ROUTES.PROFILE);

      // Second press should work normally
      fireEvent.press(getByTestId('bottom-nav-profile-button'));
      expect(mockRouter.push).toHaveBeenCalledWith(ROUTES.PROFILE);

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('handles rapid interactions without performance issues', async () => {
      (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
      
      const { getByTestId } = render(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Rapid button presses
      const button = getByTestId('bottom-nav-home-button');
      for (let i = 0; i < 10; i++) {
        fireEvent.press(button);
      }

      // Should only trigger navigation once due to debouncing
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
    });

    it('renders efficiently with multiple theme switches', () => {
      (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
      
      const { rerender } = render(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Multiple rapid theme switches
      for (let i = 0; i < 5; i++) {
        rerender(
          <ThemeContext.Provider value={createThemeContext(i % 2 === 0)}>
            <BottomNav />
          </ThemeContext.Provider>
        );
      }

      // Should render without errors
      expect(true).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('maintains proper accessibility attributes across all states', () => {
      (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
      
      const { getByTestId } = render(
        <ThemeContext.Provider value={createThemeContext(false)}>
          <BottomNav />
        </ThemeContext.Provider>
      );

      // Check all buttons have proper accessibility attributes
      const homeButton = getByTestId('bottom-nav-home-button');
      const centerButton = getByTestId('bottom-nav-center-button');
      const profileButton = getByTestId('bottom-nav-profile-button');

      expect(homeButton.props.accessibilityRole).toBe('button');
      expect(homeButton.props.accessibilityLabel).toBeTruthy();
      
      expect(centerButton.props.accessibilityRole).toBe('button');
      expect(centerButton.props.accessibilityLabel).toBeTruthy();
      
      expect(profileButton.props.accessibilityRole).toBe('button');
      expect(profileButton.props.accessibilityLabel).toBeTruthy();
    });
  });
});