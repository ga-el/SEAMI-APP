# BottomNav Component

A comprehensive bottom navigation component for React Native with Expo Router integration.

## Features

- ✅ **Three-button layout**: Home, Center (dynamic), Profile
- ✅ **Dynamic center button**: Changes icon and action based on current route
- ✅ **Theme integration**: Full dark/light mode support
- ✅ **Route detection**: Automatic active state highlighting
- ✅ **Error handling**: Graceful fallbacks for navigation and icon loading
- ✅ **Accessibility**: Full screen reader and keyboard navigation support
- ✅ **Performance optimized**: Memoized components with debounced interactions
- ✅ **Safe area support**: Proper handling of device notches and home indicators

## Usage

```tsx
import { BottomNav } from '../components/BottomNav';

export default function MyScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Your screen content */}
      
      <BottomNav />
    </SafeAreaView>
  );
}
```

## Button Configuration

### Left Button (Home)
- **Icon**: Home outline/filled
- **Route**: `/dashboard`
- **Action**: Navigate to dashboard screen

### Center Button (Dynamic)
- **Dashboard route**: ZEN logo image → Navigate to `/ZEN`
- **Teacher dashboard route**: + add icon → Trigger teacher actions
- **Other routes**: Home icon → Navigate to dashboard

### Right Button (Profile)
- **Component**: ProfileButton with user Avatar
- **Route**: `/profile`
- **Action**: Navigate to profile screen
- **Features**: 
  - Shows user's profile picture or initials
  - Automatically loads from Firebase Auth and Firestore
  - Responsive to theme changes

## Styling

The component automatically adapts to your app's theme context:

- **Dark theme**: Dark background with light borders and green accents
- **Light theme**: Light background with subtle shadows and green accents
- **Responsive**: Adjusts button sizes on smaller screens
- **Safe areas**: Respects device safe areas and notches

## Error Handling

- **Navigation failures**: Automatic retry with fallback navigation
- **Icon loading errors**: Fallback to emoji icons
- **Theme context missing**: Defaults to light theme
- **Component errors**: Error boundary with retry functionality

## Performance

- **Memoized components**: Prevents unnecessary re-renders
- **Debounced interactions**: Prevents rapid tap issues (300ms)
- **Optimized dependencies**: Minimal re-render triggers
- **Lazy evaluation**: Icons and styles computed only when needed

## Accessibility

- **Screen readers**: Full VoiceOver/TalkBack support
- **Keyboard navigation**: Proper focus management
- **Touch targets**: Minimum 44x44pt touch areas
- **State announcements**: Active states announced to assistive technology

## Testing

Comprehensive test suite included:

```bash
# Run all tests
npm test BottomNav

# Run specific test files
npm test NavigationButton.test.tsx
npm test CenterButton.test.tsx
npm test integration.test.tsx
```

## Integration Requirements

1. **Theme Context**: Must be wrapped in ThemeContext provider
2. **Safe Area Context**: Requires react-native-safe-area-context
3. **Expo Router**: Uses useRouter and usePathname hooks
4. **Content Padding**: Add 100px bottom padding to screen content

## File Structure

```
components/BottomNav/
├── index.ts                    # Main exports
├── BottomNav.tsx              # Main component
├── NavigationButton.tsx       # Side buttons
├── CenterButton.tsx           # Dynamic center button
├── ProfileButton.tsx          # Profile button with avatar
├── ErrorBoundary.tsx          # Error handling
├── types.ts                   # TypeScript definitions
├── constants.ts               # Configuration constants
├── styles.ts                  # Theme-aware styles
├── README.md                  # This documentation
└── __tests__/                 # Test suite
    ├── BottomNav.test.tsx
    ├── NavigationButton.test.tsx
    ├── CenterButton.test.tsx
    ├── ProfileButton.test.tsx
    ├── ErrorBoundary.test.tsx
    └── integration.test.tsx
```

## Customization

### Adding New Routes

1. Add route constant to `constants.ts`
2. Update center button logic in `CenterButton.tsx`
3. Add navigation handler in `BottomNav.tsx`
4. Update tests accordingly

### Styling Changes

Modify `styles.ts` to adjust:
- Colors and themes
- Button sizes and spacing
- Shadow and elevation effects
- Responsive breakpoints

### Icon Changes

Update icon names in:
- `NavigationButton.tsx` for side buttons
- `CenterButton.tsx` for center button variations
- Add fallback emojis for error cases

## Browser/Platform Support

- ✅ iOS (React Native)
- ✅ Android (React Native)
- ✅ Web (React Native Web)
- ✅ Expo managed workflow
- ✅ Expo bare workflow

## Dependencies

- `expo-router`: Navigation
- `@expo/vector-icons`: Icons
- `react-native-safe-area-context`: Safe areas
- `react-native`: Core components

## License

Part of the SEAMI app project.