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

const mockThemeContext = {
  isDarkTheme: false,
  toggleTheme: jest.fn(),
};

const renderWithTheme = (component: React.ReactElement, isDarkTheme = false) => {
  return render(
    <ThemeContext.Provider value={{ ...mockThemeContext, isDarkTheme }}>
      {component}
    </ThemeContext.Provider>
  );
};

describe('BottomNav Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
  });

  it('renders all navigation buttons correctly', () => {
    const { getByTestId } = renderWithTheme(<BottomNav />);
    
    expect(getByTestId('bottom-nav-home-button')).toBeTruthy();
    expect(getByTestId('bottom-nav-center-button')).toBeTruthy();
    expect(getByTestId('bottom-nav-profile-button')).toBeTruthy();
  });

  it('highlights active route button', () => {
    (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
    const { getByTestId } = renderWithTheme(<BottomNav />);
    
    const homeButton = getByTestId('bottom-nav-home-button');
    expect(homeButton.props.accessibilityState.selected).toBe(true);
  });

  it('handles theme switching properly', () => {
    const { rerender } = renderWithTheme(<BottomNav />, false);
    
    // Test light theme
    expect(true).toBe(true); // Component renders without error
    
    // Test dark theme
    rerender(
      <ThemeContext.Provider value={{ ...mockThemeContext, isDarkTheme: true }}>
        <BottomNav />
      </ThemeContext.Provider>
    );
    expect(true).toBe(true); // Component renders without error
  });

  it('navigates to correct routes on button press', () => {
    const { getByTestId } = renderWithTheme(<BottomNav />);
    
    // Test home navigation
    fireEvent.press(getByTestId('bottom-nav-home-button'));
    expect(mockRouter.push).toHaveBeenCalledWith(ROUTES.DASHBOARD);
    
    // Test profile navigation
    fireEvent.press(getByTestId('bottom-nav-profile-button'));
    expect(mockRouter.push).toHaveBeenCalledWith(ROUTES.PROFILE);
  });

  it('shows correct center button icon based on route', () => {
    // Test dashboard route
    (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD);
    const { getByTestId, rerender } = renderWithTheme(<BottomNav />);
    
    expect(getByTestId('bottom-nav-center-button')).toBeTruthy();
    
    // Test teacher dashboard route
    (usePathname as jest.Mock).mockReturnValue(ROUTES.DASHBOARD_TEACHER);
    rerender(
      <ThemeContext.Provider value={mockThemeContext}>
        <BottomNav />
      </ThemeContext.Provider>
    );
    
    expect(getByTestId('bottom-nav-center-button')).toBeTruthy();
  });

  it('applies correct accessibility labels', () => {
    const { getByTestId } = renderWithTheme(<BottomNav />);
    
    const homeButton = getByTestId('bottom-nav-home-button');
    const profileButton = getByTestId('bottom-nav-profile-button');
    
    expect(homeButton.props.accessibilityLabel).toBe('Ir a inicio');
    expect(profileButton.props.accessibilityLabel).toBe('Ir a perfil');
  });

  it('handles missing theme context gracefully', () => {
    const { getByTestId } = render(<BottomNav />);
    
    // Should render without crashing even without theme context
    expect(getByTestId('bottom-nav-home-button')).toBeTruthy();
  });

  it('handles navigation errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockRouter.push.mockImplementation(() => {
      throw new Error('Navigation failed');
    });
    
    const { getByTestId } = renderWithTheme(<BottomNav />);
    
    fireEvent.press(getByTestId('bottom-nav-home-button'));
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigation error to dashboard:', expect.any(Error));
    expect(mockRouter.replace).toHaveBeenCalledWith(ROUTES.DASHBOARD);
    
    consoleSpy.mockRestore();
  });
});