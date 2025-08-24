# Requirements Document

## Introduction

Este documento define los requisitos para un componente de barra de navegación inferior (BottomNav) en React Native con Expo. El componente proporcionará navegación principal entre las pantallas clave de la aplicación con un diseño intuitivo que incluye un botón central dinámico que cambia según el contexto de la pantalla actual.

## Requirements

### Requirement 1

**User Story:** Como usuario de la aplicación, quiero una barra de navegación inferior siempre visible, para poder navegar fácilmente entre las pantallas principales sin tener que usar gestos complejos o menús ocultos.

#### Acceptance Criteria

1. WHEN el usuario esté en cualquier pantalla principal THEN el sistema SHALL mostrar la barra de navegación inferior en la parte inferior de la pantalla
2. WHEN el usuario toque cualquier botón de navegación THEN el sistema SHALL mantener la barra visible durante la transición
3. IF la pantalla actual es una pantalla principal THEN el sistema SHALL resaltar visualmente el botón correspondiente

### Requirement 2

**User Story:** Como usuario, quiero un botón de Home en la barra de navegación, para poder regresar rápidamente a la pantalla principal desde cualquier lugar de la aplicación.

#### Acceptance Criteria

1. WHEN el usuario toque el botón de Home THEN el sistema SHALL navegar a dashboard.tsx
2. WHEN el usuario esté en dashboard.tsx THEN el sistema SHALL mostrar el botón de Home en estado activo/resaltado
3. IF el usuario está en dashboard.tsx THEN el sistema SHALL mostrar un indicador visual que confirme que está en la pantalla de inicio

### Requirement 3

**User Story:** Como usuario, quiero un botón de perfil en la barra de navegación, para poder acceder rápidamente a mi información personal y configuraciones.

#### Acceptance Criteria

1. WHEN el usuario toque el botón de perfil THEN el sistema SHALL navegar a profile.tsx
2. WHEN el usuario esté en profile.tsx THEN el sistema SHALL mostrar el botón de perfil en estado activo/resaltado
3. IF el usuario está en cualquier pantalla THEN el sistema SHALL mostrar un icono de perfil claramente identificable

### Requirement 4

**User Story:** Como usuario, quiero un botón central dinámico en la barra de navegación, para poder acceder a la acción principal contextual según la pantalla en la que me encuentre.

#### Acceptance Criteria

1. WHEN el usuario esté en dashboard.tsx THEN el sistema SHALL mostrar un icono de meditación en el botón central
2. WHEN el usuario esté en dashboard-teacher.tsx THEN el sistema SHALL mostrar un icono de "+" (subir/agregar) en el botón central
3. WHEN el usuario toque el botón central THEN el sistema SHALL ejecutar la acción contextual apropiada para la pantalla actual
4. IF el usuario está en una pantalla no definida THEN el sistema SHALL mostrar un icono por defecto en el botón central

### Requirement 5

**User Story:** Como usuario, quiero que el botón central tenga un diseño distintivo, para que sea fácil de identificar como la acción principal de cada pantalla.

#### Acceptance Criteria

1. WHEN la barra de navegación se renderice THEN el sistema SHALL mostrar el botón central más grande que los botones laterales
2. WHEN la barra de navegación se renderice THEN el sistema SHALL mostrar el botón central con forma circular
3. IF el botón central está visible THEN el sistema SHALL aplicar un estilo visual que lo destaque del resto de botones

### Requirement 6

**User Story:** Como desarrollador, quiero que el componente sea reutilizable y configurable, para poder integrarlo fácilmente en diferentes pantallas sin duplicar código.

#### Acceptance Criteria

1. WHEN se importe el componente BottomNav THEN el sistema SHALL permitir su uso en cualquier pantalla sin configuración adicional
2. WHEN el componente se renderice THEN el sistema SHALL detectar automáticamente la pantalla actual para mostrar el estado correcto
3. IF se necesita agregar una nueva pantalla THEN el sistema SHALL permitir la extensión del componente sin modificar el código existente

### Requirement 7

**User Story:** Como usuario, quiero que la navegación sea fluida y responsiva, para tener una experiencia de uso agradable y sin interrupciones.

#### Acceptance Criteria

1. WHEN el usuario toque cualquier botón THEN el sistema SHALL responder inmediatamente con feedback visual
2. WHEN ocurra una navegación THEN el sistema SHALL completar la transición en menos de 300ms
3. IF hay una navegación en progreso THEN el sistema SHALL prevenir múltiples toques accidentales