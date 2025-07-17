import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import LinearGradient from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function ZenModeScreen() {
  const router = useRouter();
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [volume, setVolume] = useState(70);

  // Animación de respiración (breathing)
  const breathingAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const interpolateScale = breathingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['1', '1.05'],
  });

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fondo animado */}
      <LinearGradient
        colors={isDarkTheme ? ['#0f172a', '#1e293b'] : ['#f8fafc', '#e4e8f0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      {/* Partículas decorativas */}
      {[...Array(30)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.particle,
            {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              opacity: 0.6,
              backgroundColor: isDarkTheme ? '#8bc34a' : '#6aab3b',
            },
          ]}
        />
      ))}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>SEAMI</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Text style={styles.themeIcon}>{isDarkTheme ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Contenedor principal */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.zenContainer}>
          {/* Título */}
          <View style={styles.zenTitle}>
            <Text style={[styles.zenHeaderText, isDarkTheme ? styles.zenHeaderTextDark : styles.zenHeaderTextLight]}>
              Modo Zen
            </Text>
          </View>

          {/* Breathing text */}
          <Animated.View style={{ transform: [{ scale: interpolateScale }] }}>
            <Text style={isDarkTheme ? styles.breathingTextDark : styles.breathingTextLight}>
              Respira profundamente. Todo está bien.
            </Text>
          </Animated.View>

          {/* Playlist */}
          <View style={styles.playlistContainer}>
            <Text style={styles.playlistTitle}>Música Relajante</Text>
            <View style={styles.playlist}>
              <TouchableOpacity style={styles.playlistItem}>
                <Text style={styles.playlistSong}>🎵 Piano & Rain</Text>
                <Text style={styles.playlistArtist}>Ambiente natural</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.playlistItem}>
                <Text style={styles.playlistSong}>🎵 Lo-Fi Chill</Text>
                <Text style={styles.playlistArtist}>Estudio tranquilo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pomodoro Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerTitle}>Pomodoro</Text>
            <View style={styles.phaseInfo}>
              <Text style={styles.phaseIcon}>⏳</Text>
              <Text style={styles.phaseText}>Foco: 25 min</Text>
              <Text style={styles.cycleInfo}>Ciclo 1/4</Text>
            </View>
          </View>

          {/* Volumen */}
          <View style={styles.volumeControl}>
            <Text style={styles.volumeLabel}>🔊</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.volumeMin}>0%</Text>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    { width: `${volume}%` },
                  ]}
                />
              </View>
              <Text style={styles.volumeMax}>100%</Text>
            </View>
          </View>

          {/* Acciones */}
          <View style={styles.zenActions}>
            <TouchableOpacity style={styles.zenBtn} onPress={() => router.back()}>
              <Text style={styles.zenBtnText}>← Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Círculos decorativos */}
      <View style={styles.decorativeCircles}>
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeCircle} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.6,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.2)',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8bc34a',
    textShadowColor: 'rgba(139, 195, 74, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  themeToggle: {
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    borderRadius: 50,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 80,
  },
  zenContainer: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
  },
  zenTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  zenHeaderTextDark: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#8bc34a',
    textShadowColor: 'rgba(139, 195, 74, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  zenHeaderTextLight: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#6aab3b',
    textShadowColor: 'rgba(139, 195, 74, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  breathingTextDark: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#cbd5e1',
  },
  breathingTextLight: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#334155',
  },
  playlistContainer: {
    marginBottom: 24,
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#ccc',
  },
  playlist: {
    gap: 12,
  },
  playlistItem: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  playlistSong: {
    fontSize: 16,
    color: '#fff',
  },
  playlistArtist: {
    fontSize: 12,
    color: '#aaa',
  },
  timerContainer: {
    marginBottom: 24,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#ccc',
  },
  phaseInfo: {
    padding: 16,
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseIcon: {
    fontSize: 20,
  },
  phaseText: {
    fontSize: 14,
    color: '#fff',
  },
  cycleInfo: {
    marginLeft: 'auto',
    fontSize: 12,
    backgroundColor: '#a3c9e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  volumeLabel: {
    fontSize: 20,
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#8bc34a',
  },
  volumeMin: {
    color: '#aaa',
    fontSize: 12,
  },
  volumeMax: {
    color: '#aaa',
    fontSize: 12,
  },
  zenActions: {
    marginTop: 24,
    alignItems: 'center',
  },
  zenBtn: {
    backgroundColor: '#8bc34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  zenBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  decorativeCircles: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -150 }],
    width: 300,
    height: 300,
    pointerEvents: 'none',
  },
  decorativeCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.2)',
    borderRadius: 50,
    opacity: 0.3,
  },
}); 