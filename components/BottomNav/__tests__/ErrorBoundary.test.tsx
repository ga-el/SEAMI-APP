import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import BottomNavErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text testID="success-component">Success</Text>;
};

describe('BottomNavErrorBoundary Component', () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    const { getByTestId } = render(
      <BottomNavErrorBoundary>
        <ThrowError shouldThrow={false} />
      </BottomNavErrorBoundary>
    );
    
    expect(getByTestId('success-component')).toBeTruthy();
  });

  it('renders error UI when child component throws', () => {
    const { getByText } = render(
      <BottomNavErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BottomNavErrorBoundary>
    );
    
    expect(getByText('Error en navegación')).toBeTruthy();
    expect(getByText('Reintentar')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <Text testID="custom-fallback">Custom Error</Text>;
    
    const { getByTestId } = render(
      <BottomNavErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </BottomNavErrorBoundary>
    );
    
    expect(getByTestId('custom-fallback')).toBeTruthy();
  });

  it('recovers from error when retry button is pressed', () => {
    const { getByText, getByTestId, rerender } = render(
      <BottomNavErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BottomNavErrorBoundary>
    );
    
    // Should show error UI
    expect(getByText('Error en navegación')).toBeTruthy();
    
    // Press retry button
    fireEvent.press(getByText('Reintentar'));
    
    // Re-render with non-throwing component
    rerender(
      <BottomNavErrorBoundary>
        <ThrowError shouldThrow={false} />
      </BottomNavErrorBoundary>
    );
    
    // Should show success component
    expect(getByTestId('success-component')).toBeTruthy();
  });

  it('logs error information', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <BottomNavErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BottomNavErrorBoundary>
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'BottomNav Error:',
      expect.any(Error),
      expect.any(Object)
    );
    
    consoleSpy.mockRestore();
  });

  it('handles multiple error recovery cycles', () => {
    const { getByText, getByTestId, rerender } = render(
      <BottomNavErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BottomNavErrorBoundary>
    );
    
    // First error
    expect(getByText('Error en navegación')).toBeTruthy();
    fireEvent.press(getByText('Reintentar'));
    
    // Recovery
    rerender(
      <BottomNavErrorBoundary>
        <ThrowError shouldThrow={false} />
      </BottomNavErrorBoundary>
    );
    expect(getByTestId('success-component')).toBeTruthy();
    
    // Second error
    rerender(
      <BottomNavErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BottomNavErrorBoundary>
    );
    expect(getByText('Error en navegación')).toBeTruthy();
    
    // Second recovery
    fireEvent.press(getByText('Reintentar'));
    rerender(
      <BottomNavErrorBoundary>
        <ThrowError shouldThrow={false} />
      </BottomNavErrorBoundary>
    );
    expect(getByTestId('success-component')).toBeTruthy();
  });
});