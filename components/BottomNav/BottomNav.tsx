import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useContext } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../app/_layout';
import CenterButton from './CenterButton';
import { ROUTES } from './constants';
import BottomNavErrorBoundary from './ErrorBoundary';
import NavigationButton from './NavigationButton';
import ProfileButton from './ProfileButton';
import { createStyles } from './styles';
import { BottomNavProps } from './types';

const BottomNav: React.FC<BottomNavProps> = ({ style, testID }) => {
  // Fallback theme context
  const themeContext = useContext(ThemeContext);
  const isDarkTheme = themeContext?.isDarkTheme ?? false; // Fallback to light theme
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const styles = createStyles(isDarkTheme);
  
  // Detect any teacher-related route (dashboard OR profile)
  const isTeacherRoute =
    pathname === ROUTES.DASHBOARD_TEACHER ||
    pathname === ROUTES.PROFILE_TEACHER;

  // Navigation handlers with error handling
  const handleHomePress = useCallback(() => {
    try {
      const targetRoute = isTeacherRoute ? ROUTES.DASHBOARD_TEACHER : ROUTES.DASHBOARD;
      router.push(targetRoute);
    } catch (error) {
      console.error('Navigation error to dashboard:', error);
      const targetRoute = isTeacherRoute ? ROUTES.DASHBOARD_TEACHER : ROUTES.DASHBOARD;
      router.replace(targetRoute);
    }
  }, [router, isTeacherRoute]);

  const handleProfilePress = useCallback(() => {
    try {
      // Teachers always go to their own profile screen
      const targetRoute = isTeacherRoute ? ROUTES.PROFILE_TEACHER : ROUTES.PROFILE;
      router.push(targetRoute);
    } catch (error) {
      console.error('Navigation error to profile:', error);
      const targetRoute = isTeacherRoute ? ROUTES.PROFILE_TEACHER : ROUTES.PROFILE;
      router.replace(targetRoute);
    }
  }, [router, isTeacherRoute]);

  // Route detection with fallback
  const isHomeActive = pathname === ROUTES.DASHBOARD || pathname === ROUTES.DASHBOARD_TEACHER || pathname === '/';
  const isProfileActive = pathname === ROUTES.PROFILE || pathname === ROUTES.PROFILE_TEACHER;

  return (
    <BottomNavErrorBoundary>
      {/* Safe area background extension */}
      <View 
        style={[
          styles.safeAreaContainer,
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: insets.bottom,
          }
        ]} 
      />
      
      {/* Main navigation container */}
      <View
        style={[
          styles.container,
          {
            paddingBottom: insets.bottom,
            height: styles.container.height + insets.bottom,
          },
          style,
        ]}
        testID={testID}
      >
        {/* Left Button Container - Home */}
        <View style={styles.buttonContainer}>
          <NavigationButton
            icon="home-outline"
            isActive={isHomeActive}
            onPress={handleHomePress}
            accessibilityLabel="Ir a inicio"
            testID="bottom-nav-home-button"
          />
        </View>

        {/* Center Button Container */}
        <View style={styles.centerButtonContainer}>
          <CenterButton
            currentRoute={pathname}
            onPress={() => {}}
            testID="bottom-nav-center-button"
          />
        </View>

        {/* Right Button Container - Profile */}
        <View style={styles.buttonContainer}>
          <ProfileButton
            isActive={isProfileActive}
            onPress={handleProfilePress}
            accessibilityLabel="Ir a perfil"
            testID="bottom-nav-profile-button"
          />
        </View>
      </View>
    </BottomNavErrorBoundary>
  );
};

export default React.memo(BottomNav, (prevProps, nextProps) => {
  return (
    prevProps.style === nextProps.style &&
    prevProps.testID === nextProps.testID
  );
});