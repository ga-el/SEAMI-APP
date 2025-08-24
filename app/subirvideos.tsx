import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initializeFirebase } from '../firebase-config';
import { ThemeContext } from './_layout';

const { auth, db } = initializeFirebase();

interface VideoFormData {
  title: string;
  description: string;
  subject: string;
  semester: string;
}

interface FileData {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export const options = { headerShown: false };

export default function SubirVideosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  
  // Form state
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    subject: '',
    semester: '',
  });
  
  // File state
  const [videoFile, setVideoFile] = useState<FileData | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<FileData | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [errors, setErrors] = useState<Partial<VideoFormData>>({});

  // Authentication and role verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role !== 'profesor') {
            Alert.alert('Acceso denegado', 'Solo los profesores pueden subir videos.');
            router.replace('/dashboard');
            return;
          }
        }
      } catch (e) {
        console.log('Error al verificar rol:', e);
        router.replace('/login');
      }
    });
    
    return unsubscribe;
  }, []);

  const updateFormData = (field: keyof VideoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (1GB limit)
        if (asset.size && asset.size > 1024 * 1024 * 1024) {
          Alert.alert('Archivo muy grande', 'El video no puede pesar más de 1 GB.');
          return;
        }

        setVideoFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'video/mp4',
          size: asset.size,
        });
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'No se pudo seleccionar el video.');
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setThumbnailFile({
          uri: asset.uri,
          name: `thumbnail_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error picking thumbnail:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VideoFormData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'La materia es requerida';
    }
    
    if (!formData.semester) {
      newErrors.semester = 'El semestre es requerido';
    }
    
    if (!videoFile) {
      Alert.alert('Video requerido', 'Debes seleccionar un archivo de video.');
      return false;
    }
    
    if (!thumbnailFile) {
      Alert.alert('Portada requerida', 'Debes seleccionar una imagen para la portada.');
      return false;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadThumbnailToImgbb = async (file: FileData): Promise<string> => {
    const formData = new FormData();
    formData.append('image', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await fetch('https://api.imgbb.com/1/upload?key=10be477c62336a10f1d1151961458302', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (!data.success || !data.data?.url) {
      throw new Error('Failed to upload thumbnail');
    }

    return data.data.url;
  };

  const uploadVideoToServer = async (file: FileData): Promise<string> => {
    const formData = new FormData();
    formData.append('video', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await fetch('https://server-de-ulpoads.onrender.com/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (!data.success || !data.videoUrl) {
      throw new Error('Failed to upload and compress video');
    }

    return data.videoUrl;
  };

  const getVideoDuration = (file: FileData): Promise<string> => {
    // For mobile, we'll use a placeholder duration
    // In a real implementation, you might use a library like react-native-video-info
    return Promise.resolve('0:00');
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setUploadProgress('Preparando subida...');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Get user data
      setUploadProgress('Obteniendo datos del usuario...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let profesor = 'Usuario SEAMI';
      let avatarUrl = 'https://i.ibb.co/VqKJ8M8/default-avatar.png';

      if (userDoc.exists()) {
        const userData = userDoc.data();
        profesor = userData.nombre || user.displayName || user.email || 'Usuario SEAMI';
        avatarUrl = userData.avatarUrl || user.photoURL || 'https://i.ibb.co/VqKJ8M8/default-avatar.png';
      }

      // Upload thumbnail
      setUploadProgress('Subiendo portada...');
      const thumbnailUrl = await uploadThumbnailToImgbb(thumbnailFile!);

      // Upload and compress video
      setUploadProgress('Subiendo y comprimiendo video...');
      const videoUrl = await uploadVideoToServer(videoFile!);

      // Get video duration
      setUploadProgress('Procesando información del video...');
      const duration = await getVideoDuration(videoFile!);

      // Save to Firestore
      setUploadProgress('Guardando información...');
      const videoData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        semester: formData.semester,
        videoUrl,
        thumbnailUrl,
        duration,
        autor: {
          uid: user.uid,
          nombre: profesor,
          avatarUrl: avatarUrl,
        },
        uid: user.uid,
        profesor: profesor,
        avatarUrl: avatarUrl,
        views: 0,
        likes: 0,
        dislikes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'videos'), videoData);

      setUploadProgress('¡Video subido con éxito!');
      
      Alert.alert(
        'Éxito',
        'El video se ha subido correctamente.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/dashboard-teacher'),
          },
        ]
      );

    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'No se pudo subir el video. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const subjects = [
    'Matemáticas',
    'Física',
    'Química',
    'Biología',
    'Historia',
    'Literatura',
    'Inglés',
    'Filosofía',
  ];

  const semesters = [
    { label: '1er Semestre', value: '1' },
    { label: '2do Semestre', value: '2' },
    { label: '3er Semestre', value: '3' },
    { label: '4to Semestre', value: '4' },
    { label: '5to Semestre', value: '5' },
    { label: '6to Semestre', value: '6' },
  ];

  return (
    <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
      {/* Header */}
      <View style={[isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#8bc34a' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={isDarkTheme ? styles.headerTitleDark : styles.headerTitleLight}>Subir Video</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={isDarkTheme ? styles.formContainerDark : styles.formContainerLight}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                🎬 Título del Video
              </Text>
              <TextInput
                style={[
                  isDarkTheme ? styles.inputDark : styles.inputLight,
                  errors.title ? styles.inputError : null,
                ]}
                placeholder="Ejemplo: Introducción a las ecuaciones diferenciales"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                editable={!loading}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                📝 Descripción del Video
              </Text>
              <TextInput
                style={[
                  isDarkTheme ? styles.textAreaDark : styles.textAreaLight,
                ]}
                placeholder="Agrega una descripción clara..."
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Subject Input */}
            <View style={styles.formGroup}>
              <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                📚 Materia
              </Text>
              <TextInput
                style={[
                  isDarkTheme ? styles.inputDark : styles.inputLight,
                  errors.subject ? styles.inputError : null,
                ]}
                placeholder="Selecciona la materia"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                value={formData.subject}
                onChangeText={(text) => updateFormData('subject', text)}
                editable={!loading}
              />
              {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
            </View>

            {/* Semester Picker */}
            <View style={styles.formGroup}>
              <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                🏫 Semestre
              </Text>
              <View style={styles.semesterContainer}>
                {semesters.map((semester) => (
                  <TouchableOpacity
                    key={semester.value}
                    style={[
                      isDarkTheme ? styles.semesterButtonDark : styles.semesterButtonLight,
                      formData.semester === semester.value ? styles.semesterButtonSelected : null,
                    ]}
                    onPress={() => updateFormData('semester', semester.value)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        isDarkTheme ? styles.semesterTextDark : styles.semesterTextLight,
                        formData.semester === semester.value ? styles.semesterTextSelected : null,
                      ]}
                    >
                      {semester.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.semester && <Text style={styles.errorText}>{errors.semester}</Text>}
            </View>

            {/* File Uploads */}
            <View style={styles.fileSection}>
              {/* Thumbnail Upload */}
              <View style={styles.formGroup}>
                <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                  🖼️ Portada del Video
                </Text>
                <TouchableOpacity
                  style={isDarkTheme ? styles.fileButtonDark : styles.fileButtonLight}
                  onPress={pickThumbnail}
                  disabled={loading}
                >
                  <Text style={styles.fileButtonIcon}>🖼️</Text>
                  <Text style={isDarkTheme ? styles.fileButtonTextDark : styles.fileButtonTextLight}>
                    {thumbnailFile ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Text>
                </TouchableOpacity>
                {thumbnailFile && (
                  <View style={styles.filePreview}>
                    <Image source={{ uri: thumbnailFile.uri }} style={styles.thumbnailPreview} />
                    <Text style={isDarkTheme ? styles.fileNameDark : styles.fileNameLight}>
                      {thumbnailFile.name}
                    </Text>
                  </View>
                )}
              </View>

              {/* Video Upload */}
              <View style={styles.formGroup}>
                <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                  🎥 Archivo de Video
                </Text>
                <TouchableOpacity
                  style={isDarkTheme ? styles.fileButtonDark : styles.fileButtonLight}
                  onPress={pickVideo}
                  disabled={loading}
                >
                  <Text style={styles.fileButtonIcon}>🎥</Text>
                  <Text style={isDarkTheme ? styles.fileButtonTextDark : styles.fileButtonTextLight}>
                    {videoFile ? 'Cambiar video' : 'Seleccionar video'}
                  </Text>
                </TouchableOpacity>
                {videoFile && (
                  <View style={styles.filePreview}>
                    <Text style={isDarkTheme ? styles.fileNameDark : styles.fileNameLight}>
                      📹 {videoFile.name}
                    </Text>
                    {videoFile.size && (
                      <Text style={isDarkTheme ? styles.fileSizeDark : styles.fileSizeLight}>
                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                isDarkTheme ? styles.submitButtonDark : styles.submitButtonLight,
                loading ? styles.submitButtonDisabled : null,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Subiendo...</Text>
                </>
              ) : (
                <Text style={styles.submitButtonText}>Subir Video</Text>
              )}
            </TouchableOpacity>

            {/* Progress Text */}
            {uploadProgress && (
              <Text style={isDarkTheme ? styles.progressTextDark : styles.progressTextLight}>
                {uploadProgress}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitleDark: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8bc34a',
    letterSpacing: 0.5,
  },
  headerTitleLight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6aab3b',
    letterSpacing: 0.5,
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 40,
  },
  formContainerDark: {
    margin: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formContainerLight: {
    margin: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#8bc34a',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelDark: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8bc34a',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  labelLight: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6aab3b',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  inputLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#1e293b',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textAreaDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
  },
  textAreaLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#1e293b',
    fontSize: 16,
    minHeight: 100,
  },
  semesterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  semesterButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  semesterButtonLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  semesterButtonSelected: {
    backgroundColor: '#8bc34a',
    borderColor: '#8bc34a',
  },
  semesterTextDark: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  semesterTextLight: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  semesterTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  fileSection: {
    gap: 16,
  },
  fileButtonDark: {
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(139, 195, 74, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  fileButtonLight: {
    backgroundColor: 'rgba(139, 195, 74, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(139, 195, 74, 0.2)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  fileButtonIcon: {
    fontSize: 24,
  },
  fileButtonTextDark: {
    color: '#8bc34a',
    fontSize: 16,
    fontWeight: '500',
  },
  fileButtonTextLight: {
    color: '#6aab3b',
    fontSize: 16,
    fontWeight: '500',
  },
  filePreview: {
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
  },
  thumbnailPreview: {
    width: 200,
    height: 112,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
  },
  fileNameDark: {
    color: '#e2e8f0',
    fontSize: 14,
    textAlign: 'center',
  },
  fileNameLight: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
  },
  fileSizeDark: {
    color: '#94a3b8',
    fontSize: 12,
  },
  fileSizeLight: {
    color: '#64748b',
    fontSize: 12,
  },
  submitButtonDark: {
    backgroundColor: '#8bc34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  submitButtonLight: {
    backgroundColor: '#8bc34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressTextDark: {
    color: '#8bc34a',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  progressTextLight: {
    color: '#6aab3b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});