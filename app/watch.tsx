import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView, Image, SafeAreaView, Platform } from 'react-native';
import { Video } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, updateDoc, collection, query, getDocs, increment } from 'firebase/firestore';
import { db } from '../firebase-config';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from './_layout';

export default function WatchScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const videoId = route.params?.id;
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recs, setRecs] = useState<any[]>([]);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    console.log('[WATCH] videoId recibido:', videoId);
    if (!videoId) {
      setError('No video ID provisto.');
      setLoading(false);
      return;
    }
    const fetchVideo = async () => {
      try {
        const docRef = doc(db, 'videos', videoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('[WATCH] Documento Firestore:', data);
          setVideoData({ id: docSnap.id, ...data });
          // Incrementar vistas
          await updateDoc(docRef, { views: increment(1) });
        } else {
          setError(`Video no encontrado (ID: ${videoId})`);
        }
      } catch (e: any) {
        console.error('[WATCH] Error Firestore:', e);
        setError('Error cargando el video: ' + (e?.message || String(e)));
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId]);

  useEffect(() => {
    // Cargar recomendaciones (otros videos)
    const fetchRecs = async () => {
      try {
        const q = query(collection(db, 'videos'));
        const querySnap = await getDocs(q);
        const others = querySnap.docs
          .filter(docu => docu.id !== videoId)
          .map(docu => ({ id: docu.id, ...docu.data() }));
        setRecs(others.slice(0, 4));
      } catch {}
    };
    if (videoId) fetchRecs();
  }, [videoId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color="#8bc34a" />
        <Text style={{ color: isDarkTheme ? '#e2e8f0' : '#222', marginTop: 10 }}>Cargando video...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }
  if (!videoData) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkTheme ? '#11151b' : '#f5f7fa' }]}> 
      {/* Header con gradiente y logo */}
      <View style={[styles.header, { paddingTop: insets.top || 16 }]}> 
        <View style={styles.headerBg} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={26} color={isDarkTheme ? '#8bc34a' : '#0f172a'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={isDarkTheme ? styles.logoDark : styles.logoLight}>SEAMI</Text>
        </View>
        <TouchableOpacity
          style={styles.themeToggle}
          onPress={toggleTheme}
          accessibilityLabel="Cambiar tema"
        >
          <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Video Player */}
        <View style={styles.videoShadowWrap}>
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: videoData.videoUrl }}
              useNativeControls
              resizeMode="contain"
              style={styles.videoPlayer}
              posterSource={videoData.thumbnail ? { uri: videoData.thumbnail } : undefined}
              posterStyle={{ resizeMode: 'cover' }}
            />
          </View>
        </View>
        {/* Video Metadata */}
        <View style={[styles.metaBox, isDarkTheme ? styles.videoInfoDark : styles.videoInfoLight]}>
          <Text style={[styles.title, isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight]}>{videoData.title}</Text>
          <View style={styles.videoMetaRow}>
            <View style={styles.badgeInstructor}>
              <Ionicons name="person-circle" size={18} color="#8bc34a" style={{ marginRight: 3 }} />
              <Text style={[styles.badgeText, isDarkTheme ? styles.badgeTextDark : styles.badgeTextLight]}>{videoData.author || 'Desconocido'}</Text>
            </View>
            <View style={styles.badgeViews}>
              <Ionicons name="eye" size={16} color={isDarkTheme ? '#e2e8f0' : '#5c5c5c'} style={{ marginRight: 2 }} />
              <Text style={[styles.badgeText, isDarkTheme ? styles.badgeTextDark : styles.badgeTextLight]}>{videoData.views || 0} vistas</Text>
            </View>
          </View>
          <Text style={[styles.desc, isDarkTheme ? styles.videoDescriptionDark : styles.videoDescriptionLight]}>{videoData.description}</Text>
        </View>
        {/* Recomendaciones */}
        <Text style={[styles.recsTitle, { marginLeft: 16 }]}>{'Recomendados'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recsScroll}>
          {recs.map(rec => (
            <TouchableOpacity
              key={rec.id}
              style={styles.recCard}
              onPress={() => navigation.navigate('Watch', { id: rec.id })}
              activeOpacity={0.85}
            >
              <View style={styles.recThumbShadow}>
                {rec.thumbnail ? (
                  <Image source={{ uri: rec.thumbnail }} style={styles.recThumbRound} />
                ) : (
                  <View style={[styles.recThumbRound, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}> 
                    <Ionicons name="image" size={32} color="#8bc34a" />
                  </View>
                )}
              </View>
              <Text numberOfLines={2} style={styles.recTitle}>{rec.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 0,
    height: 64,
    justifyContent: 'space-between',
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'linear-gradient(90deg, #8bc34a 0%, #11151b 100%)',
    opacity: 0.10,
    zIndex: -1,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerBackBtn: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  logoDark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8bc34a',
    textShadowColor: 'rgba(139, 195, 74, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  logoLight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6aab3b',
    textShadowColor: 'rgba(139, 195, 74, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  themeToggleText: {
    fontSize: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 70 + (Platform.OS === 'ios' ? 0 : 20),
    paddingBottom: 20,
  },
  videoShadowWrap: {
    marginTop: 80,
    marginBottom: 28,
    paddingHorizontal: 18,
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 8,
  },
  videoContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#181a20',
    borderWidth: 2,
    borderColor: '#8bc34a',
  },
  videoPlayer: {
    width: '100%',
    height: 230,
    backgroundColor: '#000',
    borderRadius: 18,
  },
  metaBox: {
    padding: 18,
    marginHorizontal: 10,
    marginTop: 2,
    backgroundColor: 'rgba(139,195,74,0.09)',
    borderRadius: 16,
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  videoTitleDark: {
    color: '#e2e8f0',
  },
  videoTitleLight: {
    color: '#1e293b',
  },
  videoMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 10,
  },
  badgeInstructor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f6e3',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  badgeViews: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeTextDark: {
    color: '#8bc34a',
  },
  badgeTextLight: {
    color: '#1e293b',
  },
  author: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  videoInstructorDark: {
    color: '#e2e8f0',
  },
  videoInstructorLight: {
    color: '#1e293b',
  },
  views: {
    fontSize: 14,
  },
  videoViewsDark: {
    color: '#94a3b8',
  },
  videoViewsLight: {
    color: '#94a3b8',
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  videoDescriptionDark: {
    color: '#cbd5e1',
  },
  videoDescriptionLight: {
    color: '#475569',
  },
  recsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  recsScroll: {
    marginVertical: 8,
    paddingLeft: 8,
  },
  recCard: {
    width: 120,
    marginRight: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    padding: 8,
  },
  recThumbShadow: {
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 6,
  },
  recThumbRound: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 2,
    backgroundColor: '#e2e8f0',
    borderWidth: 2,
    borderColor: '#8bc34a',
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  videoInfoDark: {
    // para fondo oscuro
  },
  videoInfoLight: {
    // para fondo claro
  },
});
