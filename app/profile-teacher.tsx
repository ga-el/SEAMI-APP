import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import BottomNav from '../components/BottomNav';
import { initializeFirebase } from '../firebase-config.js';
import { ThemeContext } from './_layout';

interface VideoItem {
  id: string;
  title: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: string | number | null;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getDurationLabel(duration?: string | number | null): string {
  if (!duration) return '';
  if (typeof duration === 'string' && duration.includes(':')) return duration;
  if (typeof duration === 'number') return formatDuration(duration);
  return String(duration);
}

export default function ProfileTeacherScreen() {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { auth, db } = initializeFirebase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/login');
    } catch (e) {
      console.error('Error cerrando sesión:', e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError('No autenticado.');
          setLoading(false);
          setTimeout(() => {
            try { router.replace('/login'); } catch (e) { console.error(e); }
          }, 100);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          setError('No existe información de usuario.');
          setLoading(false);
          return;
        }

        const data = userDoc.data();

        // Role & profile checks
        if (!data.perfilCompleto) {
          router.replace('/complete-profile-teacher');
          return;
        }
        if (data.role !== 'profesor') {
          router.replace('/profile');
          return;
        }

        setUserData({
          name: data.nombre || data.name || user.displayName || 'Sin nombre',
          email: data.email || user.email || '-',
        });
        setAvatarUrl(data.avatarUrl || null);
        setLoading(false);

        // Load teacher's own videos
        setVideosLoading(true);
        try {
          const q = query(collection(db, 'videos'), where('uid', '==', user.uid));
          const snapshot = await getDocs(q);
          const list: VideoItem[] = [];
          snapshot.forEach((d) => {
            const v = d.data();
            list.push({
              id: d.id,
              title: v.title || 'Sin título',
              videoUrl: v.videoUrl || null,
              thumbnailUrl: v.thumbnailUrl || null,
              duration: v.duration || null,
            });
          });
          setVideos(list);
        } catch (e) {
          console.error('Error cargando videos:', e);
        } finally {
          setVideosLoading(false);
        }
      } catch (e) {
        setError('Error al cargar datos de perfil');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#8bc34a" />
          <Text style={{ color: isDarkTheme ? '#8bc34a' : '#0f172a', marginTop: 12, fontSize: 16 }}>
            Cargando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !userData) {
    return (
      <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#ef4444', fontSize: 16, textAlign: 'center' }}>
            {error || 'No se pudo cargar el perfil.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────
  const renderVideoCard = ({ item }: { item: VideoItem }) => {
    const durationLabel = getDurationLabel(item.duration);
    return (
      <View style={isDarkTheme ? styles.videoCardDark : styles.videoCardLight}>
        {/* Thumbnail / video preview */}
        <View style={styles.videoThumbContainer}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.videoThumb, styles.videoThumbPlaceholder]}>
              <Ionicons name="play-circle-outline" size={40} color="#8bc34a" />
            </View>
          )}
          {durationLabel ? (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{durationLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
        {/* ── Header ── */}
        <View
          style={[
            isDarkTheme ? styles.headerDark : styles.headerLight,
            { paddingTop: insets.top || 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.headerBtn, { position: 'absolute', left: 16, zIndex: 2 }]}
          >
            <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#8bc34a' : '#0f172a'} />
          </TouchableOpacity>

          <Text style={[isDarkTheme ? styles.logoDark : styles.logoLight, { textAlign: 'center', flex: 1 }]}>
            SEAMI
          </Text>

          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.headerBtn, styles.themeToggle, { position: 'absolute', right: 16, zIndex: 2 }]}
          >
            <Text style={{ fontSize: 20 }}>{isDarkTheme ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profile card ── */}
          <View style={isDarkTheme ? styles.profileCardDark : styles.profileCardLight}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <Avatar avatarUrl={avatarUrl} nombre={userData.name} size={110} />
            </View>

            {/* Name */}
            <Text style={styles.profileName}>{userData.name}</Text>

            {/* Email */}
            <View style={styles.emailRow}>
              <Ionicons name="mail-outline" size={16} color={isDarkTheme ? 'rgba(255,255,255,0.6)' : '#64748b'} />
              <Text style={isDarkTheme ? styles.profileEmailDark : styles.profileEmailLight}>
                {userData.email}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => router.push('/edit-profile-teacher')}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color="#0f172a" style={{ marginRight: 6 }} />
                <Text style={styles.editBtnText}>Editar perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.uploadBtn]}
                onPress={() => router.push('/subirvideos')}
                activeOpacity={0.85}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.uploadBtnText}>Subir videos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.logoutBtn]}
                onPress={handleLogout}
                activeOpacity={0.85}
              >
                <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Mis Videos ── */}
          <View style={styles.videosSectionHeader}>
            <Text style={styles.videosSectionTitle}>Mis Videos</Text>
            <View style={styles.videosSectionUnderline} />
          </View>

          {videosLoading ? (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <ActivityIndicator color="#8bc34a" size="large" />
              <Text style={{ color: '#8bc34a', marginTop: 8 }}>Cargando videos...</Text>
            </View>
          ) : videos.length === 0 ? (
            <View style={styles.emptyVideos}>
              <Ionicons name="videocam-outline" size={48} color={isDarkTheme ? '#4a5568' : '#94a3b8'} />
              <Text style={isDarkTheme ? styles.emptyTextDark : styles.emptyTextLight}>
                No has subido videos aún.
              </Text>
            </View>
          ) : (
            <FlatList
              data={videos}
              keyExtractor={(item) => item.id}
              renderItem={renderVideoCard}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              style={{ marginHorizontal: 16 }}
            />
          )}
        </ScrollView>

        {/* ── Bottom Nav ── */}
        <BottomNav />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Containers ───────────────────────────────────────────────────────
  containerDark: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  containerLight: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  // ── Header ───────────────────────────────────────────────────────────
  headerDark: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggle: {
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    borderRadius: 50,
    width: 40,
    height: 40,
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
    color: '#6aab3b',
  },

  // ── Scroll ────────────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    paddingTop: 96,
  },

  // ── Profile card ─────────────────────────────────────────────────────
  profileCardDark: {
    margin: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  profileCardLight: {
    margin: 16,
    backgroundColor: '#fff',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#8bc34a',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarWrapper: {
    marginBottom: 16,
    shadowColor: '#8bc34a',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8bc34a',
    marginBottom: 6,
    textAlign: 'center',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  profileEmailDark: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  profileEmailLight: {
    fontSize: 14,
    color: '#64748b',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    minWidth: 150,
    justifyContent: 'center',
  },
  editBtn: {
    backgroundColor: '#8bc34a',
    shadowColor: '#8bc34a',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  editBtnText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 15,
  },
  uploadBtn: {
    backgroundColor: '#42a5f5',
    shadowColor: '#42a5f5',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Videos section ───────────────────────────────────────────────────
  videosSectionHeader: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  videosSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8bc34a',
    marginBottom: 8,
  },
  videosSectionUnderline: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8bc34a',
    opacity: 0.6,
  },
  emptyVideos: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTextDark: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyTextLight: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
  },

  // ── Video card ────────────────────────────────────────────────────────
  videoCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoCardLight: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#8bc34a',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  videoThumbContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#181c24',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  videoThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 195, 74, 0.08)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationText: {
    color: '#8bc34a',
    fontSize: 12,
    fontWeight: '700',
  },
  videoTitleDark: {
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: 15,
    padding: 12,
  },
  videoTitleLight: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: 15,
    padding: 12,
  },
});
