import { render } from '@testing-library/react-native';
import React from 'react';
import { ThemeContext } from '../../../app/_layout';
import ProfileButton from '../ProfileButton';

// Mock Firebase
jest.mock('../../../firebase-config', () => ({
  initializeFirebase: () => ({
    auth: {
      onAuthStateChanged: jest.fn(() => jest.fn()),
    },
    db: {},
  }),
}));

// Mock Avatar component
jest.mock('../../Avatar', () => {
  return function MockAvatar({ nombre, size }: { nombre: string; size: number }) {
    return `Avatar-${nombre}-${size}`;
  };
});

const mockThemeContext = {
  isDarkTheme: false,
  toggleTheme: jest.fn(),
};

const renderWithTheme = (component: React.ReactElement, isDarkTheme = false) => {
  const themeContext = { ...mockThemeContext, isDarkTheme };
  return render(
    <ThemeContext.Provider value={themeContext}>
      {component}
    </ThemeContext.Provider>
  );
};

describe('ProfileButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByTestId } = renderWithTheme(
      <ProfileButton
        isActive={false}
        onPress={mockOnPress}
        testID="profile-button"
      />
    );
    
    expect(getByTestId('profile-button')).toBeTruthy();
  });

  it('shows active state when isActive is true', () => {
    const { getByTestId } = renderWithTheme(
      <ProfileButton
        isActive={true}
        onPress={mockOnPress}
        testID="profile-button"
      />
    );
    
    const button = getByTestId('profile-button');
    expect(button).toBeTruthy();
  });

  it('handles press events', () => {
    const { getByTestId } = renderWithTheme(
      <ProfileButton
        isActive={false}
        onPress={mockOnPress}
        testID="profile-button"
      />
    );
    
    const button = getByTestId('profile-button');
    button.props.onPress();
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('applies correct accessibility label', () => {
    const { getByTestId } = renderWithTheme(
      <ProfileButton
        isActive={false}
        onPress={mockOnPress}
        accessibilityLabel="Go to profile"
        testID="profile-button"
      />
    );
    
    const button = getByTestId('profile-button');
    expect(button.props.accessibilityLabel).toBe('Go to profile');
  });
});