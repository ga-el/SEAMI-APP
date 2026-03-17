import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase-config';
import { ThemeContext } from '../app/_layout';

interface CommentsSectionProps {
  videoId: string;
}

export default function CommentsSection({ videoId }: CommentsSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkTheme } = useContext(ThemeContext);

  useEffect(() => {
    // Escuchar cambios de autenticación
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              uid: user.uid,
              displayName: userData.nombre || user.displayName,
              photoURL: userData.avatarUrl || user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.nombre || user.displayName || 'U')
            });
          } else {
             setCurrentUser({
              uid: user.uid,
              displayName: user.displayName || user.email,
              photoURL: user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.email || 'U')
            });
          }
        } catch (e) {
          console.error('Error getting user data:', e);
          setCurrentUser({
            uid: user.uid,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.email || 'U')
          });
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!videoId) return;
    
    setLoading(true);
    // Usar onSnapshot para tiempo real
    const q = query(
      collection(db, 'comentarios'),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribeComments = onSnapshot(q, (querySnapshot) => {
      const loadedComments: any[] = [];
      querySnapshot.forEach((doc) => {
        const comment = doc.data();
        if (comment.videoId === videoId) {
          loadedComments.push({
            id: doc.id,
            ...comment
          });
        }
      });
      setComments(loadedComments);
      setLoading(false);
    }, (error) => {
      console.error('Error loading comments:', error);
      setLoading(false);
    });

    return () => unsubscribeComments();
  }, [videoId]);

  const handlePublishComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      const commentData = {
        videoId: videoId,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userAvatar: currentUser.photoURL,
        text: newComment,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'comentarios'), commentData);
      setNewComment('');
    } catch (error) {
      console.error('Error publishing comment:', error);
      alert('Error al publicar el comentario');
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Hace poco';
    
    const date = new Date(timestamp.seconds * 1000);
    const diffSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'Hace unos segundos';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  };

  const topComment = comments.length > 0 ? comments[0] : null;

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
         <ActivityIndicator size="small" color="#8bc34a" />
         <Text style={{ color: isDarkTheme ? '#8bc34a' : '#6aab3b', marginTop: 10 }}>Cargando comentarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- PREVIEW BUTTON (YOUTUBE STYLE) --- */}
      <TouchableOpacity 
        style={[styles.previewContainer, isDarkTheme ? styles.previewDark : styles.previewLight]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.previewHeader}>
          <Text style={[styles.previewTitle, isDarkTheme ? styles.textDark : styles.textLight]}>
            Comentarios <Text style={styles.previewCount}>{comments.length}</Text>
          </Text>
          <Ionicons name="chevron-expand" size={16} color={isDarkTheme ? '#e2e8f0' : '#1e293b'} />
        </View>

        {topComment ? (
          <View style={styles.previewContent}>
            <Image
              source={{ uri: topComment.userAvatar || 'https://via.placeholder.com/24' }}
              style={styles.previewAvatar}
            />
            <Text 
              style={[styles.previewText, isDarkTheme ? styles.textDark : styles.textLight]} 
              numberOfLines={2}
            >
              <Text style={styles.previewAuthor}>{topComment.userName} </Text>
              {topComment.text}
            </Text>
          </View>
        ) : (
          <Text style={[styles.previewEmpty, isDarkTheme ? styles.textMutedDark : styles.textMutedLight]}>
            Sé el primero en comentar...
          </Text>
        )}
      </TouchableOpacity>

      {/* --- BOTTOM SHEET MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          {/* Touchable overlay to dismiss modal when tapping outside */}
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)} 
          />
          
          <View style={[styles.modalContent, isDarkTheme ? styles.modalDark : styles.modalLight]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkTheme ? styles.textDark : styles.textLight]}>
                Comentarios
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={isDarkTheme ? '#e2e8f0' : '#1e293b'} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
              {comments.length > 0 ? (
                comments.map(comment => (
                  <View key={comment.id} style={styles.commentCard}>
                    <Image
                      source={{ uri: comment.userAvatar || 'https://via.placeholder.com/40' }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeader}>
                        <Text style={[styles.commentAuthor, isDarkTheme ? styles.textDark : styles.textLight]}>
                          {comment.userName}
                        </Text>
                        <Text style={styles.commentTime}>
                          {getTimeAgo(comment.timestamp)}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, isDarkTheme ? styles.textDark : styles.textLight]}>
                        {comment.text}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, isDarkTheme ? styles.textMutedDark : styles.textMutedLight]}>
                    No hay comentarios aún. ¡Sé el primero en comentar!
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer / Input Area */}
            <View style={[styles.modalFooter, isDarkTheme ? styles.footerDark : styles.footerLight]}>
              {currentUser ? (
                <View style={styles.inputContainer}>
                  <Image
                    source={{ uri: currentUser.photoURL }}
                    style={styles.inputAvatar}
                  />
                  <View style={[styles.inputWrapper, isDarkTheme ? styles.inputWrapperDark : styles.inputWrapperLight]}>
                    <TextInput
                      value={newComment}
                      onChangeText={setNewComment}
                      placeholder="Añade un comentario..."
                      placeholderTextColor={isDarkTheme ? '#94a3b8' : '#64748b'}
                      style={[styles.input, isDarkTheme ? styles.textDark : styles.textLight]}
                      multiline
                    />
                    <TouchableOpacity 
                      onPress={handlePublishComment} 
                      style={styles.sendButton}
                      disabled={!newComment.trim()}
                    >
                      <Ionicons 
                        name="send" 
                        size={20} 
                        color={newComment.trim() ? '#8bc34a' : (isDarkTheme ? '#475569' : '#cbd5e1')} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.loginCard}>
                  <Text style={styles.loginText}>Inicia sesión para poder comentar</Text>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  // --- Preview Style ---
  previewContainer: {
    padding: 12,
    borderRadius: 12,
  },
  previewDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginRight: 6,
  },
  previewCount: {
    color: '#8bc34a', // Acent color
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
  },
  previewText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  previewAuthor: {
    fontWeight: '600',
  },
  previewEmpty: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  
  // --- Modal Overlay ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    height: '75%', // Taker up 75% of screen
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalDark: {
    backgroundColor: '#0f172a', // Background dark dashboard
  },
  modalLight: {
    backgroundColor: '#f8fafc',
  },
  
  // --- Modal Header ---
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  
  // --- Comments List ---
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentCard: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 4,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  
  // --- Modal Footer / Input ---
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  footerDark: {
    backgroundColor: '#1e293b',
  },
  footerLight: {
    backgroundColor: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginBottom: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputWrapperDark: {
    backgroundColor: '#334155',
  },
  inputWrapperLight: {
    backgroundColor: '#f1f5f9',
  },
  input: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
    maxHeight: 100,
    paddingVertical: 0,
  },
  sendButton: {
    padding: 4,
  },
  loginCard: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    borderRadius: 8,
  },
  loginText: {
    color: '#8bc34a',
    fontWeight: '500',
    fontSize: 14,
  },
  
  // --- Shared Texts ---
  textDark: {
    color: '#f8fafc',
  },
  textLight: {
    color: '#0f172a',
  },
  textMutedDark: {
    color: '#94a3b8',
  },
  textMutedLight: {
    color: '#64748b',
  },
});
