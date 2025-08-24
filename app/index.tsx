import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const IndexScreen = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Animación título
  useEffect(() => {
    const titleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(titleAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    titleLoop.start();
    return () => titleLoop.stop();
  }, [titleAnim]);

  // Animación subtítulo
  useEffect(() => {
    const subtitleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    subtitleLoop.start();
    return () => subtitleLoop.stop();
  }, [subtitleAnim]);

  useEffect(() => {
    // Add a small delay to ensure router is fully initialized
    const timer = setTimeout(() => {
      try {
        router.replace('/welcome');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [router]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const interpolateTitleTransform = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const interpolateSubtitleOpacity = subtitleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const interpolateSubtitleScale = subtitleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
      {/* Header */}
      <View style={isDarkTheme ? styles.headerDark : styles.headerLight}>
        <Text style={isDarkTheme ? styles.logoDark : styles.logoLight}>SEAMI</Text>
        <TouchableOpacity
          style={styles.themeToggle}
          onPress={toggleTheme}
          accessibilityLabel="Toggle theme"
        >
          <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <View style={isDarkTheme ? styles.mainContentDark : styles.mainContentLight}>
        <Animated.View
          style={[
            isDarkTheme ? styles.glassContainerDark : styles.glassContainerLight,
            { transform: [{ translateY: interpolateTitleTransform }] },
          ]}
        >
          <View style={styles.contentWrapper}>
            <Animated.Text
              style={[
                isDarkTheme ? styles.titleAnimationDark : styles.titleAnimationLight,
                { opacity: titleAnim },
              ]}
            >
              Bienvenido a SEAMI
            </Animated.Text>

            <Animated.View
              style={{
                opacity: interpolateSubtitleOpacity,
                transform: [{ scale: interpolateSubtitleScale }],
              }}
            >
              <Text style={isDarkTheme ? styles.subtitleDark : styles.subtitleLight}>
                Tus maestros, tus temas, a tu ritmo. Porque nadie explica como ellos.
              </Text>
            </Animated.View>

            <View style={styles.authLinks}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => console.log('Iniciar Sesión')}
              >
                <Text style={styles.btnText}>Iniciar Sesión</Text>
              </TouchableOpacity>

              <View style={isDarkTheme ? styles.separatorDark : styles.separatorLight} />

              <TouchableOpacity
                style={styles.registerBtn}
                onPress={() => console.log('Registrarse')}
              >
                <Text style={styles.btnText}>Registrarse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  containerBase: {
    flex: 1,
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  containerLight: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerDark: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 195, 74, 0.2)',
  },
  headerLight: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 195, 74, 0.2)',
  },
  logoDark: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8bc34a',
    textShadowColor: 'rgba(139, 195, 74, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  logoLight: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8bc34a',
    textShadowColor: 'rgba(139, 195, 74, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  mainContentDark: {
    flex: 1,
    marginTop: 80,
    padding: 16,
  },
  mainContentLight: {
    flex: 1,
    marginTop: 80,
    padding: 16,
  },
  glassContainerDark: {
    borderRadius: 25,
    padding: 32,
    margin: 16,
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassContainerLight: {
    borderRadius: 25,
    padding: 32,
    margin: 16,
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  contentWrapper: {
    padding: 16,
    alignItems: 'center',
  },
  titleAnimationDark: {
    fontSize: 28,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: -1,
    color: '#8bc34a',
    textShadowColor: 'rgba(139, 195, 74, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  titleAnimationLight: {
    fontSize: 28,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: -1,
    color: '#0f172a',
    textShadowColor: 'rgba(139, 195, 74, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitleDark: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    color: 'white',
    opacity: 0.9,
  },
  subtitleLight: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    color: '#334155',
  },
  authLinks: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  loginBtn: {
    backgroundColor: '#8bc34a',
    padding: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  registerBtn: {
    backgroundColor: '#8bc34a',
    padding: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  separatorDark: {
    height: 2,
    marginVertical: 8,
    backgroundColor: 'rgba(139, 195, 74, 0.5)',
    borderRadius: 1,
  },
  separatorLight: {
    height: 2,
    marginVertical: 8,
    backgroundColor: 'rgba(139, 195, 74, 0.2)',
    borderRadius: 1,
  },
  themeToggle: {
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    borderRadius: 50,
    padding: 8,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 20,
  },
}); 