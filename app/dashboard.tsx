import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { initializeFirebase } from '../firebase-config';
import { ThemeContext } from './_layout';
import { formatTimeAgo } from '../utils/dateUtils';
const { auth, db } = initializeFirebase();

interface VideoItem {
  id: string;
  title: string;
  instructor: string;
  views: string;
  time: string;
  duration: string;
  thumbnailUrl?: string | null;
}

export const options = { headerShown: false };

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      // Validación de perfil y rol
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (!data.perfilCompleto) {
            router.replace('/complete-profile');
            return;
          }
          if (data.role === 'profesor') {
            router.replace('/dashboard-teacher');
            return;
          }
        } else {
          router.replace('/register');
          return;
        }
      } catch (e) {
        router.replace('/login');
        return;
      }
      // Cargar videos
      try {
        setLoading(true);
        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const videosData: VideoItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          videosData.push({
            id: doc.id,
            title: data.title || 'Sin título',
            instructor: data.profesor || data.autor?.nombre || data.instructor || 'Desconocido',
            views: `${data.views || 0} vistas`,
            time: formatTimeAgo(data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date()),
            duration: data.duration || '0:00',
            thumbnailUrl: data.thumbnailUrl || null,
          });
        });
        setVideos(videosData);
        setFilteredVideos(videosData);
      } catch (error) {
        console.error('Error cargando videos:', error);
        Alert.alert('Error', 'No se pudieron cargar los videos.');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false);
      setVideos([]);
      router.replace('/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión. Intenta de nuevo.');
    }
  };

  const renderItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={isDarkTheme ? styles.videoCardDark : styles.videoCardLight}
      onPress={() => router.push({ pathname: '/watch', params: { id: item.id } })}
    >
      <View style={styles.thumbnailContainer}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <Text style={styles.thumbnail}>🖼️ Miniatura</Text>
        )}
        <Text style={styles.duration}>{item.duration}</Text>
      </View>
      <View style={styles.videoDetails}>
        <Text numberOfLines={2} style={isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight}>
          {item.title}
        </Text>
        <Text style={isDarkTheme ? styles.videoInstructorDark : styles.videoInstructorLight}>
          {item.instructor}
        </Text>
        <View style={styles.videoMeta}>
          <Text style={isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight}>{item.views}</Text>
          <Text style={isDarkTheme ? styles.videoTimeDark : styles.videoTimeLight}> • {item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Filtrar videos cuando cambia la búsqueda o la lista de videos
  // Función para normalizar strings y quitar acentos/diacríticos
  function normalizeString(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar diacríticos
      .toLowerCase();
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVideos(videos);
    } else {
      const normQuery = normalizeString(searchQuery);
      setFilteredVideos(
        videos.filter(
          (v) =>
            normalizeString(v.title).includes(normQuery) ||
            normalizeString(v.instructor).includes(normQuery)
        )
      );
    }
  }, [searchQuery, videos]);

  return (
    <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
      {/* Header */}
      <View style={[isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        {/* App Name */}
        <Text style={isDarkTheme ? styles.appNameDark : styles.appNameLight}>SEAMI</Text>

        <TouchableOpacity
          style={styles.themeToggle}
          onPress={toggleTheme}
          accessibilityLabel="Cambiar tema"
        >
          <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={isDarkTheme ? styles.searchBarDark : styles.searchBarLight}>
        <TextInput
          placeholder="Buscar tema o profesor..."
          placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
          style={isDarkTheme ? styles.searchInputDark : styles.searchInputLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Grilla de videos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={isDarkTheme ? styles.loadingTextDark : styles.loadingTextLight}>
            Cargando videos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVideos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.videoGrid}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={isDarkTheme ? styles.emptyTextDark : styles.emptyTextLight}>
                No hay videos disponibles.
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appNameDark: {
    color: '#8bc34a',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  appNameLight: {
    color: '#6aab3b',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  containerLight: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerDark: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 195, 74, 0.2)',
  },
  headerLight: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  zenButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 195, 74, 0.15)',
    borderColor: 'rgba(139, 195, 74, 0.3)',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  zenButtonLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    borderColor: 'rgba(139, 195, 74, 0.2)',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  zenIcon: {
    fontSize: 18,
    marginRight: 4,
  },

  zenTextDark: {
    color: '#8bc34a',
    fontWeight: '700',
    letterSpacing: 1,
  },
  zenTextLight: {
    color: '#6aab3b',
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  profileContainer: {
    position: 'relative',
  },
  profileBtnDark: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBtnLight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarDark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 195, 74, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#8bc34a',
    fontWeight: '600',
    fontSize: 16,
  },
  dropdownDark: {
    position: 'absolute',
    right: 0,
    top: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownLight: {
    position: 'absolute',
    right: 0,
    top: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    minWidth: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownItemDark: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemLight: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownItemTextDark: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  dropdownItemTextLight: {
    color: '#475569',
    fontSize: 14,
  },
  searchBarDark: {
    marginTop: 90,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchBarLight: {
    marginTop: 90,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchInputDark: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: 14,
  },
  searchInputLight: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    color: '#2d3748',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  videoGrid: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for bottom navigation
  },
  videoCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoCardLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#8bc34a',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    height: 180,
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#8bc34a',
    fontSize: 16,
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  videoDetails: {
    padding: 12,
  },
  videoTitleDark: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  videoTitleLight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  videoInstructorDark: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  videoInstructorLight: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  videoMeta: {
    flexDirection: 'row',
  },
  videoViewsDark: {
    fontSize: 12,
    color: '#64748b',
  },
  videoViewsLight: {
    fontSize: 12,
    color: '#94a3b8',
  },
  videoTimeDark: {
    fontSize: 12,
    color: '#64748b',
  },
  videoTimeLight: {
    fontSize: 12,
    color: '#94a3b8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  loadingTextDark: {
    color: '#8bc34a',
    fontSize: 16,
  },
  loadingTextLight: {
    color: '#6aab3b',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyTextDark: {
    color: '#94a3b8',
    fontSize: 16,
  },
  emptyTextLight: {
    color: '#64748b',
    fontSize: 16,
  },
});