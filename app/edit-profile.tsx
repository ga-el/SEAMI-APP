// screens/EditProfileScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importaciones de Firebase
import { initializeFirebase } from '../firebase-config'; // <--- Ajusta esta ruta
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Constantes
const DEFAULT_PHOTO = 'https://i.pravatar.cc/150?img=32';

// Configuración para ocultar la barra superior
export const options = {
  headerShown: false,
};

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDarkTheme, toggleTheme] = useState(true);
  
  // Estados de Firebase
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Estados del formulario
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    second_last_name: '',
    semester: '',
    birthdate: '',
    subjects: [{ subject: '', teacher: '' }],
  });
  
  // Estados de UI
  const [profilePhoto, setProfilePhoto] = useState(DEFAULT_PHOTO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inicializar Firebase al cargar el componente
  useEffect(() => {
    let unsubscribeAuthState: (() => void) | null = null;

    (async () => {
      try {
        const firebase = await initializeFirebase();
        setAuth(firebase.auth);
        setDb(firebase.db);

        // Configurar listener de auth state
        unsubscribeAuthState = onAuthStateChanged(firebase.auth, async (user) => {
          if (!user) {
            console.log('Usuario no autenticado, redirigiendo a login');
            router.replace('/login');
            return;
          }

          console.log('Usuario autenticado:', user.uid, user.email);
          setUserId(user.uid);
          
          try {
            setLoading(true);
            console.log('Intentando cargar datos del usuario desde Firestore...');
            
            // Obtener datos del perfil de Firestore
            const userDocRef = doc(firebase.db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            console.log('Documento existe:', userDoc.exists());
            
            if (userDoc.exists()) {
              const data = userDoc.data();
              console.log('Datos completos cargados desde Firebase:', JSON.stringify(data, null, 2));
              
              // Pre-llenar formulario con datos existentes de Firestore
              const formData = {
                first_name: data.first_name || data.nombre || '',
                last_name: data.last_name || data.apellido_paterno || '',
                second_last_name: data.second_last_name || data.apellido_materno || '',
                semester: data.semester ? String(data.semester) : (data.semestre ? String(data.semestre) : ''),
                birthdate: data.birthdate || data.fecha_nacimiento || '',
                subjects: [] as Array<{subject: string, teacher: string}>
              };
              
              // Manejar materias/subjects
              if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
                formData.subjects = data.subjects.map(s => ({
                  subject: s.subject || s.materia || s.nombre || '',
                  teacher: s.teacher || s.profesor || ''
                }));
              } else if (data.materias && Array.isArray(data.materias) && data.materias.length > 0) {
                formData.subjects = data.materias.map(m => ({
                  subject: m.nombre || m.materia || '',
                  teacher: m.profesor || m.teacher || ''
                }));
              } else {
                formData.subjects = [{ subject: '', teacher: '' }];
              }
              
              console.log('Datos del formulario preparados:', formData);
              setForm(formData);
              
              // Pre-llenar foto de perfil
              const photoUrl = data.avatarUrl || data.photoURL || data.avatar || user.photoURL || DEFAULT_PHOTO;
              setProfilePhoto(photoUrl);
              
              console.log('Formulario actualizado exitosamente');
            } else {
              console.log('Documento de usuario no existe en Firestore');
              // Si no existe documento, usar datos básicos del auth
              const nameParts = (user.displayName || user.email || '').split(' ');
              const basicForm = {
                first_name: nameParts[0] || '',
                last_name: nameParts[1] || '',
                second_last_name: nameParts.slice(2).join(' ') || '',
                semester: '',
                birthdate: '',
                subjects: [{ subject: '', teacher: '' }],
              };
              
              console.log('Usando datos básicos:', basicForm);
              setForm(basicForm);
              setProfilePhoto(user.photoURL || DEFAULT_PHOTO);
              
              // Mostrar alerta informativa
              Alert.alert(
                'Perfil Nuevo', 
                'No se encontraron datos previos. Completa tu perfil para continuar.',
                [{ text: 'Entendido' }]
              );
            }
          } catch (error) {
            console.error("Error detallado cargando datos del perfil:", error);
            Alert.alert('Error', `No se pudieron cargar los datos del perfil: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            
            // En caso de error, usar datos básicos
            const nameParts = (user.displayName || user.email || '').split(' ');
            setForm({
              first_name: nameParts[0] || '',
              last_name: nameParts[1] || '',
              second_last_name: '',
              semester: '',
              birthdate: '',
              subjects: [{ subject: '', teacher: '' }],
            });
            setProfilePhoto(user.photoURL || DEFAULT_PHOTO);
          } finally {
            setLoading(false);
            console.log('Carga de datos completada');
          }
        });
      } catch (error) {
        console.error("Error inicializando Firebase:", error);
        Alert.alert('Error', 'Error al inicializar la aplicación.');
        setLoading(false);
      }
    })();

    // Cleanup function
    return () => {
      if (unsubscribeAuthState) {
        unsubscribeAuthState();
      }
    };
  }, []);

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (index: number, field: 'subject' | 'teacher', value: string) => {
    const updatedSubjects = [...form.subjects];
    updatedSubjects[index][field] = value;
    setForm(prev => ({ ...prev, subjects: updatedSubjects }));
  };

  const addSubjectRow = () => {
    setForm(prev => ({
      ...prev,
      subjects: [...prev.subjects, { subject: '', teacher: '' }]
    }));
  };

  const removeSubjectRow = (index: number) => {
    if (form.subjects.length > 1) {
      const updatedSubjects = form.subjects.filter((_, i) => i !== index);
      setForm(prev => ({ ...prev, subjects: updatedSubjects }));
    }
  };

  // Función para seleccionar y subir imagen
  const pickImage = async () => {
    if (saving) return;

    // Pedir permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la galería.');
      return;
    }

    // Abrir selector de imágenes
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      uploadImage(uri);
    }
  };

  // Función para subir imagen a ImgBB
  const uploadImage = async (uri) => {
    setSaving(true);
    
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob);

      const responseImgBB = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await responseImgBB.json();

      if (data.success) {
        setProfilePhoto(data.data.url);
      } else {
        throw new Error(data.error.message || 'Error al subir imagen');
      }
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // Guardar cambios en Firestore
  const handleSave = async () => {
    if (!auth || !db || !userId) {
      Alert.alert('Error', 'La app aún está inicializando.');
      return;
    }

    if (!form.first_name.trim() || !form.last_name.trim() || !form.semester.trim() || !form.birthdate.trim()) {
      Alert.alert('Error', 'Todos los campos marcados son obligatorios.');
      return;
    }

    setSaving(true);
    
    try {
      const userRef = doc(db, 'users', userId);
      
      // Preparar datos para guardar
      const updateData = {
        first_name: form.first_name,
        last_name: form.last_name,
        second_last_name: form.second_last_name,
        semester: form.semester,
        birthdate: form.birthdate,
        subjects: form.subjects.filter(s => s.subject.trim() || s.teacher.trim()),
        avatarUrl: profilePhoto !== DEFAULT_PHOTO ? profilePhoto : null,
        updatedAt: new Date(),
      };
      
      await updateDoc(userRef, updateData);
      
      Alert.alert('Éxito', 'Perfil actualizado correctamente.', [
        { text: 'OK', onPress: () => router.replace('/profile') }
      ]);
    } catch (error) {
      console.error("Error guardando perfil:", error);
      Alert.alert('Error', 'No se pudo guardar el perfil. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, isDarkTheme ? styles.containerDark : styles.containerLight]}>
        <View style={[styles.header, isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16 }]}>
          <Text style={isDarkTheme ? styles.logoDark : styles.logoLight}>SEAMI</Text>
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => toggleTheme(!isDarkTheme)}
            accessibilityLabel="Cambiar tema"
          >
            <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkTheme ? "#8bc34a" : "#6aab3b"} />
          <Text style={isDarkTheme ? styles.loadingTextDark : styles.loadingTextLight}>
            Cargando datos del perfil...
          </Text>
          <Text style={[isDarkTheme ? styles.textDark : styles.textLight, { marginTop: 8, fontSize: 14 }]}>
            Preparando formulario con tus datos actuales
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkTheme ? styles.containerDark : styles.containerLight]}>
      {/* Header */}
      <View style={[styles.header, isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16 }]}>
        <TouchableOpacity onPress={() => router.replace('/profile')} style={{ marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#8bc34a' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={isDarkTheme ? styles.logoDark : styles.logoLight}>SEAMI</Text>
        <TouchableOpacity
          style={styles.themeToggle}
          onPress={() => toggleTheme(!isDarkTheme)}
          accessibilityLabel="Cambiar tema"
        >
          <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido Principal */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.formContainer, isDarkTheme ? styles.formContainerDark : styles.formContainerLight]}>
          
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: profilePhoto }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
                <View style={styles.cameraButton}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
              </View>
            </TouchableOpacity>
            <Text style={[styles.imagePreviewText, isDarkTheme ? styles.textDark : styles.textLight]}>
              Haz clic en la imagen para cambiarla
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isDarkTheme ? styles.labelDark : styles.labelLight]}>
              Nombre(s)
            </Text>
            <TextInput
              style={[styles.input, isDarkTheme ? styles.inputDark : styles.inputLight]}
              value={form.first_name}
              onChangeText={(text) => handleChange('first_name', text)}
              placeholder="Nombre(s)"
              placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
            />
          </View>

          <View style={styles.nameRow}>
            <View style={styles.halfInputGroup}>
              <Text style={[styles.label, isDarkTheme ? styles.labelDark : styles.labelLight]}>
                Apellido Paterno
              </Text>
              <TextInput
                style={[styles.input, isDarkTheme ? styles.inputDark : styles.inputLight]}
                value={form.last_name}
                onChangeText={(text) => handleChange('last_name', text)}
                placeholder="Apellido Paterno"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
              />
            </View>
            
            <View style={styles.halfInputGroup}>
              <Text style={[styles.label, isDarkTheme ? styles.labelDark : styles.labelLight]}>
                Apellido Materno
              </Text>
              <TextInput
                style={[styles.input, isDarkTheme ? styles.inputDark : styles.inputLight]}
                value={form.second_last_name}
                onChangeText={(text) => handleChange('second_last_name', text)}
                placeholder="Apellido Materno"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDarkTheme ? styles.labelDark : styles.labelLight]}>
              Fecha de nacimiento
            </Text>
            <TextInput
              style={[styles.input, isDarkTheme ? styles.inputDark : styles.inputLight]}
              value={form.birthdate}
              onChangeText={(text) => handleChange('birthdate', text)}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDarkTheme ? styles.labelDark : styles.labelLight]}>
              Semestre actual
            </Text>
            <TextInput
              style={[styles.input, isDarkTheme ? styles.inputDark : styles.inputLight]}
              value={form.semester}
              onChangeText={(text) => handleChange('semester', text)}
              placeholder="Ej. 3"
              keyboardType="numeric"
              maxLength={2}
              placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
            />
          </View>

          {/* Materias (solo para alumnos en este ejemplo) */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, isDarkTheme ? styles.labelDark : styles.labelLight]}>
              Materias y Profesores
            </Text>
            
            {form.subjects.map((subject, index) => (
              <View key={index} style={styles.subjectRow}>
                <View style={styles.subjectInputs}>
                  <TextInput
                    style={[styles.subjectInput, isDarkTheme ? styles.inputDark : styles.inputLight]}
                    value={subject.subject}
                    onChangeText={(text) => handleSubjectChange(index, 'subject', text)}
                    placeholder="Materia"
                    placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                  />
                  <TextInput
                    style={[styles.subjectInput, isDarkTheme ? styles.inputDark : styles.inputLight]}
                    value={subject.teacher}
                    onChangeText={(text) => handleSubjectChange(index, 'teacher', text)}
                    placeholder="Profesor"
                    placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                  />
                </View>
                
                {form.subjects.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeSubjectRow(index)}
                  >
                    <Text style={styles.removeIcon}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addSubjectRow}
            >
              <Text style={styles.addButtonText}>+ Agregar materia</Text>
            </TouchableOpacity>
          </View>

          {/* Botón de guardar */}
          <TouchableOpacity
            style={[styles.saveButton, isDarkTheme ? styles.saveButtonDark : styles.saveButtonLight, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.saveButtonText}> Guardando...</Text>
              </>
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  containerLight: {
    backgroundColor: '#f5f7fa',
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
  },
  headerDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 195, 74, 0.2)',
  },
  headerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
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
    paddingTop: 100, // Espacio para el header fijo
    paddingBottom: 20,
  },
  formContainer: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
  },
  formContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(139, 195, 74, 0.3)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 8,
  },
  formContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#8bc34a',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8bc34a',
    borderRadius: 22.5,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraIcon: {
    fontSize: 20,
    color: 'white',
  },
  imagePreviewText: {
    fontSize: 14,
    textAlign: 'center',
  },
  textDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  textLight: {
    color: 'rgba(45, 55, 72, 0.7)',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelDark: {
    color: '#cbd5e1',
  },
  labelLight: {
    color: '#475569',
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  inputDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    color: '#fff',
  },
  inputLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    color: '#2d3748',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInputGroup: {
    flex: 1,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectInputs: {
    flex: 1,
    marginRight: 8,
  },
  subjectInput: {
    height: 45,
    marginBottom: 8,
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 20,
  },
  addButton: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#8bc34a',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonDark: {
    backgroundColor: '#8bc34a',
  },
  saveButtonLight: {
    backgroundColor: '#6aab3b',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  loadingTextDark: {
    marginTop: 12,
    color: '#8bc34a',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingTextLight: {
    marginTop: 12,
    color: '#6aab3b',
    fontSize: 16,
    fontWeight: '600',
  },
});