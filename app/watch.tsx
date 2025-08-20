import { useNavigation, useRoute } from '@react-navigation/native';
import { Video } from 'expo-av';
import { collection, doc, getDoc, getDocs, increment, query, updateDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Asumo que tu configuración de firebase está en '../firebase-config'
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase-config';
import { ThemeContext } from './_layout';

// --- Componente Principal del Reproductor ---
export default function WatchScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { isDarkTheme } = useContext(ThemeContext);

  const videoId = route.params?.id;
  
  // --- Estados del Componente ---
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
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

  // --- Efecto para Cargar Videos Recomendados ---
  useEffect(() => {
    if (!videoId) return;

    const fetchRecommendations = async () => {
      try {
        const q = query(collection(db, 'videos'));
        const querySnap = await getDocs(q);
        const otherVideos = querySnap.docs
          .filter(docu => docu.id !== videoId) // Excluir el video actual
          .map(docu => ({ id: docu.id, ...docu.data() }));
        setRecommendations(otherVideos.slice(0, 5)); // Limitar a 5 recomendaciones
      } catch (e) {
        console.error("Error al cargar recomendaciones:", e);
      }
    };

    fetchRecommendations();
  }, [videoId]);
  
  // --- Función para dar "Me Gusta" ---
  const handleLike = async () => {
      if (!videoData) return;
      const docRef = doc(db, 'videos', videoId);
      // Actualiza el estado local inmediatamente para una respuesta visual rápida
      setVideoData((prev: any) => ({...prev, likes: (prev.likes || 0) + 1}));
      // Actualiza en Firestore
      await updateDoc(docRef, {
          likes: increment(1)
      });
  };

  // --- Función para dar "No Me Gusta" ---
  const handleDislike = async () => {
      if (!videoData) return;
      const docRef = doc(db, 'videos', videoId);
      // Actualiza el estado local inmediatamente para una respuesta visual rápida
      setVideoData((prev: any) => ({...prev, dislikes: (prev.dislikes || 0) + 1}));
      // Actualiza en Firestore
      await updateDoc(docRef, {
          dislikes: increment(1)
      });
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!videoData) return null;

  return (
    <SafeAreaView style={[styles.flexContainer, isDarkTheme ? styles.containerDark : styles.containerLight]}>
      {/* --- REPRODUCTOR DE VIDEO --- */}
      {/* Ocupa todo el ancho y tiene una altura de aspecto 16:9 */}
      <View style={styles.videoPlayerContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoData.videoUrl }}
          useNativeControls
          resizeMode="contain" // Clave para que videos verticales y horizontales se vean bien
          style={styles.videoPlayer}
          posterSource={{ 
            uri: videoData.thumbnailUrl || 'https://via.placeholder.com/320x180/2a2742/8bc34a?text=SEAMI+Video' 
          }}
          posterStyle={styles.videoPoster}
        />
        {/* Botón para regresar, superpuesto en el video */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flexContainer}>
        <View style={styles.contentPadding}>
          {/* --- INFORMACIÓN DEL VIDEO --- */}
          <Text style={[styles.videoTitle, isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight]}>{videoData.title}</Text>
          <View style={styles.metadataRow}>
            <Text style={isDarkTheme ? styles.videoInstructorDark : styles.videoInstructorLight}>{videoData.author || 'Anónimo'}</Text>
            <Text style={isDarkTheme ? styles.videoInstructorDark : styles.videoInstructorLight}>•</Text>
            <Text style={isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight}>{videoData.views || 0} vistas</Text>
          </View>
          <Text style={[styles.videoDescription, isDarkTheme ? styles.videoInstructorDark : styles.videoInstructorLight]}>
            {videoData.description}
          </Text>

          {/* --- BARRA DE ACCIONES (LIKES, DISLIKES, COMENTARIOS) --- */}
          <View style={[styles.actionsRow, isDarkTheme ? styles.actionsRowDark : styles.actionsRowLight]}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons name="thumbs-up-outline" size={24} color={isDarkTheme ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.actionText, isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight]}>{videoData.likes || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDislike}>
              <Ionicons name="thumbs-down-outline" size={24} color={isDarkTheme ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.actionText, isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight]}>{videoData.dislikes || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={isDarkTheme ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.actionText, isDarkTheme ? styles.videoViewsDark : styles.videoViewsLight]}>Comentar</Text>
            </TouchableOpacity>
          </View>
          
          {/* --- SECCIÓN DE COMENTARIOS --- */}
          <View style={styles.commentsSection}>
            <Text style={[styles.sectionTitle, isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight]}>Comentarios</Text>
            {/* Aquí iría un componente de lista de comentarios */}
            <View style={[styles.commentCard, isDarkTheme ? styles.videoCardDark : styles.videoCardLight]}>
                <Ionicons name="person-circle-outline" size={32} color={isDarkTheme ? '#94a3b8' : '#64748b'} style={{marginRight: 8}}/>
                <View style={styles.flexContainer}>
                    <Text style={[styles.commentAuthor, isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight]}>juanitopistolas</Text>
                    <Text style={isDarkTheme ? styles.videoInstructorDark : styles.videoInstructorLight}>Muy Util!</Text>
                </View>
            </View>
          </View>

          {/* --- VIDEOS RECOMENDADOS --- */}
          <View style={styles.recommendationsSection}>
             <Text style={[styles.sectionTitle, isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight]}>Recomendados</Text>
             {recommendations.map(rec => (
                 <TouchableOpacity 
                    key={rec.id} 
                    style={[styles.recommendationCard, isDarkTheme ? styles.videoCardDark : styles.videoCardLight]}
                    onPress={() => navigation.push('Watch', { id: rec.id })}
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
                        {rec.author || 'Anónimo'}
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
  goBackButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 40 : 20,
      left: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
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
