import { useLocalSearchParams, useRouter } from 'expo-router';
import { ResizeMode, Video, VideoFullscreenUpdate } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { collection, doc, getDoc, getDocs, increment, query, updateDoc, setDoc, deleteDoc, where, onSnapshot } from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Asumo que tu configuración de firebase está en '../firebase-config'
import { Ionicons } from '@expo/vector-icons';
import CommentsSection from '../components/CommentsSection';
import { db, auth } from '../firebase-config';
import { ThemeContext } from './_layout';
import { formatTimeAgo } from '../utils/dateUtils';

// --- Componente Principal del Reproductor ---
export default function WatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkTheme } = useContext(ThemeContext);

  const { id } = useLocalSearchParams<{ id: string }>();
  const videoId = id;

  // --- Estados del Componente ---
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [selection, setSelection] = useState<'like' | 'dislike' | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  // --- Efecto para Cargar los Datos del Video ---
  useEffect(() => {
    if (!videoId) {
      setError('No se proporcionó un ID de video.');
      setLoading(false);
      return;
    }

    const fetchVideoData = async () => {
      setLoading(true);
      setError('');
      setVideoData(null);
      try {
        const docRef = doc(db, 'videos', videoId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setVideoData({ id: docSnap.id, ...data });
          // Incrementar las vistas del video en Firestore
          await updateDoc(docRef, { views: increment(1) });
        } else {
          setError(`Video no encontrado (ID: ${videoId})`);
        }
      } catch (e: any) {
        console.error('[WATCH] Error al cargar video:', e);
        setError('No se pudo cargar el video. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]); // Se ejecuta cada vez que el videoId cambia

  // --- Efecto para Cargar Votos de Firestore ---
  useEffect(() => {
    if (!videoId) return;

    // 1. Cargar contadores totales
    const loadVoteCounts = async () => {
      const votesRef = collection(db, 'videolikes');
      
      const likesQuery = query(votesRef, where('videoId', '==', videoId), where('voteType', '==', 'like'));
      const dislikesQuery = query(votesRef, where('videoId', '==', videoId), where('voteType', '==', 'dislike'));
      
      try {
        const [likesSnap, dislikesSnap] = await Promise.all([
          getDocs(likesQuery),
          getDocs(dislikesQuery)
        ]);
        
        setLikeCount(likesSnap.size);
        setDislikeCount(dislikesSnap.size);
      } catch (error) {
        console.error("Error cargando contadores de votos:", error);
      }
    };

    // 2. Cargar voto del usuario actual
    const loadUserVote = async (userId: string) => {
      try {
        const voteRef = doc(db, 'videolikes', `${userId}_${videoId}`);
        const voteSnap = await getDoc(voteRef);
        
        if (voteSnap.exists()) {
          const voteData = voteSnap.data();
          setSelection(voteData.voteType as 'like' | 'dislike');
        } else {
          setSelection(null);
        }
      } catch (error) {
        console.error("Error cargando voto del usuario:", error);
      }
    };

    loadVoteCounts();

    const currentUser = auth.currentUser;
    if (currentUser) {
      loadUserVote(currentUser.uid);
      // Cargar el rol del usuario para el botón de regresar
      getDoc(doc(db, 'users', currentUser.uid))
        .then(docSnap => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          }
        })
        .catch(err => console.error("Error cargando rol del usuario:", err));
    }
  }, [videoId]);

  // --- Navegación Segura al Dashboard ---
  const handleGoBack = () => {
    // Para salir de la pila de videos amontonados y volver a la raíz absoluta
    if (router.canGoBack()) {
      router.dismissAll();
    }
    
    if (userRole === 'profesor') {
      router.replace('/dashboard-teacher');
    } else {
      router.replace('/dashboard');
    }
  };

  // --- Efecto para Cargar Videos Recomendados ---
  useEffect(() => {
    if (!videoId) return;

    const fetchRecommendations = async () => {
      try {
        const q = query(collection(db, 'videos'));
        const querySnap = await getDocs(q);
        const otherVideos = querySnap.docs
          .filter(docu => docu.id !== videoId) // Excluir el video actual
          .map(docu => {
            const data = docu.data();
            return {
              id: docu.id,
              ...data,
              time: formatTimeAgo(data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date())
            };
          });
        setRecommendations(otherVideos.slice(0, 5)); // Limitar a 5 recomendaciones
      } catch (e) {
        console.error("Error al cargar recomendaciones:", e);
      }
    };

    fetchRecommendations();
  }, [videoId]);  // --- Función principal para Votar ---
  const handleVote = async (voteType: 'like' | 'dislike') => {
    const currentUser = auth.currentUser;
    if (!currentUser || !videoId) {
       alert("Debes iniciar sesión para votar");
       return;
    }

    try {
      const voteRef = doc(db, 'videolikes', `${currentUser.uid}_${videoId}`);
      
      // CASO 1: El usuario YA votó esto (quiere desvotar)
      if (selection === voteType) {
        await deleteDoc(voteRef); 
        setSelection(null);       
        
        if (voteType === 'like') {
          setLikeCount(prev => Math.max(0, prev - 1));
        } else {
          setDislikeCount(prev => Math.max(0, prev - 1));
        }
      }
      // CASO 2: El usuario NO votó, o votó lo contrario
      else {
        // Si ya había votado diferente, restar del contador anterior
        if (selection) {
          if (selection === 'like') {
            setLikeCount(prev => Math.max(0, prev - 1));
          } else {
            setDislikeCount(prev => Math.max(0, prev - 1));
          }
        }
        
        // Guardar el nuevo voto
        await setDoc(voteRef, {
          userId: currentUser.uid,
          videoId: videoId,
          voteType: voteType, 
          timestamp: new Date().toISOString()
        });
        
        setSelection(voteType);
        
        // Sumar al nuevo contador
        if (voteType === 'like') {
          setLikeCount(prev => prev + 1);
        } else {
          setDislikeCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error handling vote:', error);
      alert('Error al procesar tu voto');
    }
  };

  // --- Renderizado Condicional: Carga, Error y Contenido ---
  if (loading) {
    return (
      <View style={[styles.centeredContainer, isDarkTheme ? styles.containerDark : styles.containerLight]}>
        <ActivityIndicator size="large" color="#8bc34a" />
        <Text style={[styles.loadingText, isDarkTheme ? styles.loadingTextDark : styles.loadingTextLight]}>Cargando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centeredContainer, isDarkTheme ? styles.containerDark : styles.containerLight]}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Regresar al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!videoData) return null;

  return (
    <SafeAreaView style={[styles.flexContainer, isDarkTheme ? styles.containerDark : styles.containerLight]}>
      {/* --- HEADER --- */}
      <View style={[isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16 }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#8bc34a' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={isDarkTheme ? styles.appNameDark : styles.appNameLight}>SEAMI</Text>
      </View>

      {/* --- REPRODUCTOR DE VIDEO --- */}
      {/* Ocupa todo el ancho y tiene una altura de aspecto 16:9 */}
      <View style={styles.videoPlayerContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoData.videoUrl }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN} // Clave para que videos verticales y horizontales se vean bien
          style={styles.videoPlayer}
          posterSource={{
            uri: videoData.thumbnailUrl || 'https://via.placeholder.com/320x180/2a2742/8bc34a?text=SEAMI+Video'
          }}
          posterStyle={styles.videoPoster}
          onFullscreenUpdate={async (e) => {
            if (e.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_PRESENT) {
              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            } else if (e.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_DISMISS) {
              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
            }
          }}
        />
      </View>

      <ScrollView style={styles.flexContainer}>
        <View style={styles.contentPadding}>
          {/* --- INFORMACIÓN DEL VIDEO --- */}
          <Text style={[styles.videoTitle, isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight]}>{videoData.title}</Text>
          <View style={styles.metadataRow}>
            <Text style={isDarkTheme ? styles.videoInstructorDark : styles.videoInstructorLight}>{videoData.profesor || videoData.autor?.nombre || 'Anónimo'}</Text>
            <Text style={isDarkTheme ? styles.videoInstructorDark : styles.videoInstructorLight}>•</Text>
            <Text style={isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight}>{videoData.views || 0} vistas</Text>
          </View>
          <Text style={[styles.videoDescription, isDarkTheme ? styles.videoInstructorDark : styles.videoInstructorLight]}>
            {videoData.description}
          </Text>

          {/* --- BARRA DE ACCIONES (LIKES, DISLIKES, COMENTARIOS) --- */}
          <View style={[styles.actionsRow, isDarkTheme ? styles.actionsRowDark : styles.actionsRowLight]}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleVote('like')}>
              <Ionicons name={selection === 'like' ? "thumbs-up" : "thumbs-up-outline"} size={24} color={selection === 'like' ? '#8bc34a' : (isDarkTheme ? '#94a3b8' : '#64748b')} />
              <Text style={[styles.actionText, isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight, selection === 'like' && { color: '#8bc34a', fontWeight: 'bold' }]}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleVote('dislike')}>
              <Ionicons name={selection === 'dislike' ? "thumbs-down" : "thumbs-down-outline"} size={24} color={selection === 'dislike' ? '#e53935' : (isDarkTheme ? '#94a3b8' : '#64748b')} />
              <Text style={[styles.actionText, isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight, selection === 'dislike' && { color: '#e53935', fontWeight: 'bold' }]}>{dislikeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={isDarkTheme ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.actionText, isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight]}>Comentar</Text>
            </TouchableOpacity>
          </View>

          {/* --- SECCIÓN DE COMENTARIOS --- */}
          <View style={styles.commentsSection}>
            <CommentsSection videoId={videoId} />
          </View>

          {/* --- VIDEOS RECOMENDADOS --- */}
          <View style={styles.recommendationsSection}>
            <Text style={[styles.sectionTitle, isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight]}>Recomendados</Text>
            {recommendations.map(rec => (
              <TouchableOpacity
                key={rec.id}
                style={[styles.recommendationCard, isDarkTheme ? styles.videoCardDark : styles.videoCardLight]}
                onPress={() => router.push({ pathname: '/watch', params: { id: rec.id } })}
              >
                <View style={styles.thumbnailContainer}>
                  {rec.thumbnailUrl ? (
                    <Image source={{ uri: rec.thumbnailUrl }} style={styles.thumbnail} />
                  ) : (
                    <Text style={styles.thumbnail}>🖼️ Miniatura</Text>
                  )}
                  <Text style={styles.duration}>{rec.duration || '0:00'}</Text>
                </View>
                <View style={styles.videoDetails}>
                  <Text numberOfLines={2} style={isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight}>
                    {rec.title}
                  </Text>
                  <Text style={isDarkTheme ? styles.videoInstructorDark : styles.videoInstructorLight}>
                    {rec.profesor || rec.autor?.nombre || 'Anónimo'}
                  </Text>
                  <View style={styles.videoMeta}>
                    <Text style={isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight}>{rec.views || 0} vistas</Text>
                    <Text style={isDarkTheme ? styles.videoTimeDark : styles.videoTimeLight}> • {rec.time || 'reciente'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- HOJA DE ESTILOS ---
const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Contenedores y Layout
  flexContainer: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentPadding: {
    padding: 16,
  },

  // Colores de Fondo y Texto (usando la paleta de dashboard.tsx)
  containerDark: {
    backgroundColor: '#0f172a',
  },
  containerLight: {
    backgroundColor: '#f5f7fa',
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
  videoViewsDark: {
    fontSize: 12,
    color: '#64748b',
  },
  videoViewsLight: {
    fontSize: 12,
    color: '#94a3b8',
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

  // Estados de Carga y Error
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  loadingTextDark: {
    color: '#8bc34a',
    fontSize: 16,
  },
  loadingTextLight: {
    color: '#6aab3b',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#8bc34a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Header
  headerDark: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerLight: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  appNameDark: {
    color: '#8bc34a',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 1.5,
  },
  appNameLight: {
    color: '#6aab3b',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 1.5,
  },

  // Reproductor de Video
  videoPlayerContainer: {
    width: screenWidth,
    height: screenWidth * (9 / 16), // Aspect ratio 16:9
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoPoster: {
    resizeMode: 'cover',
    borderRadius: 12,
  },

  // Metadatos del Video
  videoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  videoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Barra de Acciones
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  actionsRowDark: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionsRowLight: {
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
  },

  // Secciones
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  // Comentarios
  commentsSection: {
    marginTop: 16,
  },
  commentCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAuthor: {
    fontWeight: 'bold',
    marginBottom: 2,
  },

  // Recomendaciones
  recommendationsSection: {
    marginTop: 24,
  },
  recommendationCard: {
    marginBottom: 16,
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
  videoMeta: {
    flexDirection: 'row',
  },
  videoTimeDark: {
    fontSize: 12,
    color: '#64748b',
  },
  videoTimeLight: {
    fontSize: 12,
    color: '#94a3b8',
  }
});
