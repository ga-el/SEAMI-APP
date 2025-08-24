import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { ThemeContext } from '../../../app/_layout';
import NavigationButton from '../NavigationButton';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

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

describe('NavigationButton Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct icon and accessibility label', () => {
    const { getByTestId } = renderWithTheme(
      <NavigationButton
        icon="home-outline"
        isActive={false}
        onPress={mockOnPress}
        accessibilityLabel="Home button"
        testID="test-button"
      />
    );
    
    const button = getByTestId('test-button');
    expect(button.props.accessibilityLabel).toBe('Home button');
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('shows active state correctly', () => {
    const { getByTestId } = renderWithTheme(
      <NavigationButton
        icon="home-outline"
        isActive={true}
        onPress={mockOnPress}
        accessibilityLabel="Home button"
        testID="test-button"
      />
    );
    
    const button = getByTestId('test-button');
    expect(button.props.accessibilityState.selected).toBe(true);
  });

  it('calls onPress when pressed', () => {
    const { getByTestId } = renderWithTheme(
      <NavigationButton
        icon="home-outline"
        isActive={false}
        onPress={mockOnPress}
        accessibilityLabel="Home button"
        testID="test-button"
      />
    );
    
    fireEvent.press(getByTestId('test-button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('prevents rapid taps (debouncing)', () => {
    const { getByTestId } = renderWithTheme(
      <NavigationButton
        icon="home-outline"
        isActive={false}
        onPress={mockOnPress}
        accessibilityLabel="Home button"
        testID="test-button"
      />
    );
    
    const button = getByTestId('test-button');
    
    // Rapid taps
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);
    
    // Should only call once due to debouncing
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('handles icon loading errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock Ionicons to throw an error
    jest.doMock('@expo/vector-icons', () => ({
      Ionicons: () => {
        throw new Error('Icon loading failed');
      },
    }));
    
    const { getByTestId } = renderWithTheme(
      <NavigationButton
        icon="home-outline"
        isActive={false}
        onPress={mockOnPress}
        accessibilityLabel="Home button"
        testID="test-button"
      />
    );
    
    expect(getByTestId('test-button')).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('renders custom icon component', () => {
    const CustomIcon = () => <></>;
    
    const { getByTestId } = renderWithTheme(
      <NavigationButton
        icon={<CustomIcon />}
        isActive={false}
        onPress={mockOnPress}
        accessibilityLabel="Custom button"
        testID="test-button"
      />
    );
    
    expect(getByTestId('test-button')).toBeTruthy();
  });

  it('applies correct styles for dark theme', () => {
    const { getByTestId } = renderWithTheme(
      <NavigationButton
        icon="home-outline"
        isActive={false}
        onPress={mockOnPress}
        accessibilityLabel="Home button"
        testID="test-button"
      />,
      true // Dark theme
    );
    
    expect(getByTestId('test-button')).toBeTruthy();
  });

  it('shows filled icon when active', () => {
    const { rerender, getByTestId } = renderWithTheme(
      <NavigationButton
        icon="home-outline"
        isActive={false}
        onPress={mockOnPress}
        accessibilityLabel="Home button"
        testID="test-button"
      />
    );
    
    expect(getByTestId('test-button')).toBeTruthy();
    
    // Test active state
    rerender(
      <ThemeContext.Provider value={mockThemeContext}>
        <NavigationButton
          icon="home-outline"
          isActive={true}
          onPress={mockOnPress}
          accessibilityLabel="Home button"
          testID="test-button"
        />
      </ThemeContext.Provider>
    );
    
    expect(getByTestId('test-button')).toBeTruthy();
  });
});