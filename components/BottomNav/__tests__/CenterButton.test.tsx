import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { ThemeContext } from '../../../app/_layout';
import CenterButton from '../CenterButton';
import { ROUTES } from '../constants';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock Image component
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Image: 'Image',
  };
});

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

describe('CenterButton Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders with correct accessibility label for dashboard route', () => {
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD}
        onPress={mockOnPress}
        testID="center-button"
      />
    );
    
    const button = getByTestId('center-button');
    expect(button.props.accessibilityLabel).toBe('Abrir modo ZEN');
  });

  it('renders with correct accessibility label for teacher dashboard route', () => {
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD_TEACHER}
        onPress={mockOnPress}
        testID="center-button"
      />
    );
    
    const button = getByTestId('center-button');
    expect(button.props.accessibilityLabel).toBe('Agregar contenido');
  });

  it('navigates to ZEN when pressed on dashboard route', () => {
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD}
        onPress={mockOnPress}
        testID="center-button"
      />
    );
    
    fireEvent.press(getByTestId('center-button'));
    expect(mockRouter.push).toHaveBeenCalledWith('/ZEN');
  });

  it('handles teacher action when pressed on teacher dashboard route', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD_TEACHER}
        onPress={mockOnPress}
        testID="center-button"
      />
    );
    
    fireEvent.press(getByTestId('center-button'));
    expect(consoleSpy).toHaveBeenCalledWith('Teacher add action triggered');
    
    consoleSpy.mockRestore();
  });

  it('navigates to dashboard for unknown routes', () => {
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute="/unknown-route"
        onPress={mockOnPress}
        testID="center-button"
      />
    );
    
    fireEvent.press(getByTestId('center-button'));
    expect(mockRouter.push).toHaveBeenCalledWith(ROUTES.DASHBOARD);
  });

  it('calls custom onPress callback', () => {
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD}
        onPress={mockOnPress}
        testID="center-button"
      />
    );
    
    fireEvent.press(getByTestId('center-button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('prevents rapid taps (debouncing)', () => {
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD}
        onPress={mockOnPress}
        testID="center-button"
      />
    );
    
    const button = getByTestId('center-button');
    
    // Rapid taps
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);
    
    // Should only call router.push once due to debouncing
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });

  it('handles navigation errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockRouter.push.mockImplementation(() => {
      throw new Error('Navigation failed');
    });
    
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD}
        onPress={mockOnPress}
        testID="center-button"
      />
    );
    
    fireEvent.press(getByTestId('center-button'));
    
    expect(consoleSpy).toHaveBeenCalledWith('Center button navigation error:', expect.any(Error));
    expect(mockRouter.replace).toHaveBeenCalledWith(ROUTES.DASHBOARD);
    
    consoleSpy.mockRestore();
  });

  it('handles icon rendering errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock Ionicons to throw an error
    jest.doMock('@expo/vector-icons', () => ({
      Ionicons: () => {
        throw new Error('Icon rendering failed');
      },
    }));
    
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD_TEACHER}
        onPress={mockOnPress}
        testID="center-button"
      />
    );
    
    expect(getByTestId('center-button')).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('handles onPress callback errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const errorOnPress = () => {
      throw new Error('OnPress callback failed');
    };
    
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD}
        onPress={errorOnPress}
        testID="center-button"
      />
    );
    
    fireEvent.press(getByTestId('center-button'));
    
    expect(consoleSpy).toHaveBeenCalledWith('Custom onPress error:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('applies correct styles for dark theme', () => {
    const { getByTestId } = renderWithTheme(
      <CenterButton
        currentRoute={ROUTES.DASHBOARD}
        onPress={mockOnPress}
        testID="center-button"
      />,
      true // Dark theme
    );
    
    expect(getByTestId('center-button')).toBeTruthy();
  });
});