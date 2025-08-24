# Design Document

## Overview

El componente BottomNav será una barra de navegación inferior reutilizable para React Native con Expo que proporcionará navegación principal entre las pantallas clave de la aplicación. El diseño se integra con el sistema de navegación existente de Expo Router y mantiene consistencia visual con el tema actual de la aplicación (modo claro/oscuro).

## Architecture

### Component Structure
```
BottomNav/
├── BottomNav.tsx          # Componente principal
├── types.ts               # Definiciones de tipos TypeScript
└── styles.ts              # Estilos separados por tema
```

### Navigation Integration
- **Expo Router**: Utiliza `useRouter()` para navegación programática
- **Route Detection**: Usa `usePathname()` para detectar la ruta actual
- **Theme Integration**: Se integra con el `ThemeContext` existente para soporte de tema claro/oscuro

### State Management
- **Local State**: Manejo del estado de presión de botones para feedback visual
- **Context Integration**: Consume el `ThemeContext` para aplicar estilos apropiados
- **Route Awareness**: Detecta automáticamente la pantalla actual para mostrar estados activos

## Components and Interfaces

### Main Component: BottomNav

```typescript
interface BottomNavProps {
  style?: ViewStyle;
  testID?: string;
}

interface NavigationButton {
  id: string;
  icon: string | React.ReactNode;
  route: string;
  position: 'left' | 'center' | 'right';
  isActive: boolean;
  onPress: () => void;
}
```

### Button Configuration

#### Left Button (Home)
- **Icon**: Ionicons "home" / "home-outline"
- **Route**: "/dashboard"
- **Active State**: Cuando la ruta actual es "/dashboard"
- **Action**: Navegar a dashboard.tsx

#### Center Button (Dynamic)
- **Size**: 60x60px (más grande que botones laterales)
- **Shape**: Circular con elevación
- **Icons**:
  - Dashboard: Logo ZEN (imagen logo zen.webp) 
  - Teacher Dashboard: Ionicons "add" (símbolo +)
- **Routes**: 
  - "/dashboard" → Acción de meditación
  - "/dashboard-teacher" → Acción de agregar contenido
- **Styling**: Fondo destacado con gradiente sutil

#### Right Button (Profile)
- **Icon**: Ionicons "person" / "person-outline"
- **Route**: "/profile"
- **Active State**: Cuando la ruta actual es "/profile"
- **Action**: Navegar a profile.tsx

### Visual Design System

#### Color Palette
```typescript
const colors = {
  primary: '#8bc34a',      // Verde principal de la app
  primaryDark: '#6aab3b',  // Verde oscuro
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
}
```

#### Layout Specifications
- **Height**: 80px + safe area bottom inset
- **Button Size**: 48x48px (lateral), 60x60px (central)
- **Spacing**: 16px padding horizontal, 12px padding vertical
- **Border Radius**: 16px para la barra, 30px para botón central
- **Shadow**: Elevación sutil para separación visual del contenido

## Data Models

### Navigation State
```typescript
interface NavigationState {
  currentRoute: string;
  isTransitioning: boolean;
  lastActiveRoute: string;
}

interface ButtonState {
  isPressed: boolean;
  isActive: boolean;
  isDisabled: boolean;
}
```

### Theme Configuration
```typescript
interface ThemeConfig {
  isDarkTheme: boolean;
  colors: ColorPalette;
  spacing: SpacingConfig;
  typography: TypographyConfig;
}
```

## Error Handling

### Navigation Errors
- **Invalid Routes**: Fallback a dashboard si la ruta no existe
- **Navigation Failures**: Retry automático con feedback visual
- **Permission Issues**: Manejo graceful con mensajes informativos

### Component Errors
- **Theme Context Missing**: Fallback a tema claro por defecto
- **Icon Loading Failures**: Fallback a iconos de texto simples
- **Render Errors**: Error boundary con componente de recuperación

### Performance Considerations
- **Memoization**: Uso de `React.memo` para evitar re-renders innecesarios
- **Debouncing**: Prevención de múltiples toques rápidos (300ms)
- **Lazy Loading**: Carga diferida de iconos no críticos

## Testing Strategy

### Unit Tests
```typescript
describe('BottomNav Component', () => {
  test('renders all navigation buttons correctly')
  test('highlights active route button')
  test('handles theme switching properly')
  test('navigates to correct routes on button press')
  test('shows correct center button icon based on route')
  test('applies correct accessibility labels')
})
```

### Integration Tests
- **Navigation Flow**: Verificar navegación completa entre pantallas
- **Theme Integration**: Confirmar cambios de tema se reflejan correctamente
- **Route Detection**: Validar detección precisa de rutas activas
- **Safe Area**: Comprobar adaptación a diferentes dispositivos

### Accessibility Tests
- **Screen Reader**: Compatibilidad con lectores de pantalla
- **Focus Management**: Navegación por teclado apropiada
- **Color Contrast**: Cumplimiento de estándares WCAG
- **Touch Targets**: Tamaños mínimos de 44x44px

### Performance Tests
- **Render Performance**: Medición de tiempos de renderizado
- **Memory Usage**: Monitoreo de uso de memoria
- **Animation Smoothness**: Verificación de 60fps en transiciones
- **Bundle Size**: Impacto en el tamaño final de la aplicación

## Implementation Details

### File Structure
```
components/
└── BottomNav/
    ├── index.ts              # Export principal
    ├── BottomNav.tsx         # Componente principal
    ├── NavigationButton.tsx  # Botón individual
    ├── CenterButton.tsx      # Botón central especializado
    ├── types.ts              # Definiciones TypeScript
    ├── styles.ts             # Estilos por tema
    ├── constants.ts          # Constantes de configuración
    └── __tests__/            # Tests unitarios
        ├── BottomNav.test.tsx
        ├── NavigationButton.test.tsx
        └── CenterButton.test.tsx
```

### Dependencies
- **@expo/vector-icons**: Para iconos de navegación
- **expo-router**: Para navegación programática
- **react-native-safe-area-context**: Para manejo de safe areas
- **react-native-reanimated**: Para animaciones suaves (opcional)

### Integration Points
- **ThemeContext**: Consumo del contexto de tema existente
- **Navigation Stack**: Integración con el stack de navegación de Expo Router
- **Screen Components**: Importación y uso en pantallas principales

### Responsive Design
- **Device Adaptation**: Ajuste automático a diferentes tamaños de pantalla
- **Orientation Support**: Soporte para orientación portrait (principal)
- **Safe Area Handling**: Respeto de áreas seguras en dispositivos con notch
- **Accessibility Scaling**: Soporte para tamaños de texto aumentados