import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { initializeFirebase } from '../firebase-config';
import { ThemeContext } from './_layout';
const { auth, db } = initializeFirebase();

interface VideoItem {
  id: string;
  title: string;
  instructor: string;
  views: string;
  time: string;
  duration: string;
}




export const options = { headerShown: false };


export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInitials, setUserInitials] = useState('--');
const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
const [userName, setUserName] = useState<string>('--');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      // Iniciales: nombre o correo
      let initials = '--';
      if (user.displayName) {
        setUserName(user.displayName);
        const parts = user.displayName.split(' ');
        initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
      } else if (user.email) {
        setUserName(user.email);
        initials = user.email.charAt(0).toUpperCase();
      } else {
        setUserName('--');
      }
      setUserInitials(initials);
      // Obtener avatarUrl desde Firestore
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.avatarUrl) {
            setUserAvatarUrl(data.avatarUrl);
          } else {
            setUserAvatarUrl(null);
          }
          // Validación de perfil y rol
          if (!data.perfilCompleto) {
            if (data.role === 'profesor') {
              router.replace('/complete-profile-teacher');
            } else {
              router.replace('/complete-profile');
            }
            return;
          }
          // Solo redirigir si definitivamente NO es profesor
          if (data.role && data.role !== 'profesor') {
            router.replace('/dashboard');
            return;
          }
        } else {
          router.replace('/register');
          return;
        }
      } catch (e) {
        setUserAvatarUrl(null);
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
            instructor: data.instructor || 'Desconocido',
            views: `${data.views || 0} vistas`,
            time: formatTimeAgo(data.createdAt?.toDate ? data.createdAt.toDate() : new Date()),
            duration: data.duration || '0:00',
          });
        });
        setVideos(videosData);
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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'ahora';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    if (diffHours < 24) return `hace ${diffHours} horas`;
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `hace ${months} mes${months > 1 ? 'es' : ''}`;
    }
    const years = Math.floor(diffDays / 365);
    return `hace ${years} año${years > 1 ? 's' : ''}`;
  };

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
      onPress={() => router.push(`/watch/${item.id}`)}
    >
      <View style={styles.thumbnailContainer}>
        <Text style={styles.thumbnail}>🖼️ Miniatura</Text>
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
          // Puedes agregar funcionalidad de búsqueda aquí
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
          data={videos}
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