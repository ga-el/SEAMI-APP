import { Stack, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
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
import { ThemeContext } from './_layout';

interface FormData {
  profilePhoto: string;
  nombre: string;
  username: string;
  bio: string;
  escuela: string;
  grado: string;
  materias: string;
  email: string;
}

interface Errors {
  [key: string]: string | undefined;
}

export default function EditProfileStudentScreen() {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const lottieRef = useRef<LottieView>(null);

  // Datos simulados del usuario
  const [formData, setFormData] = useState<FormData>({
    profilePhoto: 'https://i.pravatar.cc/150?img=32',
    nombre: 'Ana Sofía Rodríguez',
    username: 'ana_sofia',
    bio: 'Estudiante de prepa apasionada por la ciencia y la tecnología. 🚀',
    escuela: 'Preparatoria No. 5',
    grado: '5to Semestre',
    materias: 'Cálculo, Física, Química',
    email: 'ana.sofia@email.com',
  });

  const [errors, setErrors] = useState<Errors>({});

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleLottieFinish = () => {
    router.push('/dashboard');
  };

  useEffect(() => {
    if (showSuccess) {
      const timeout = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [router, showSuccess]);

  if (showSuccess) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={isDarkTheme ? styles.successContainerDark : styles.successContainerLight}>
          <LottieView
            ref={lottieRef}
            source={require('../assets/lottie/success-confetti-green.json')}
            autoPlay
            loop={false}
            style={{ width: 300, height: 300 }}
            onAnimationFinish={handleLottieFinish}
          />
          <Text style={styles.successTitle}>¡Perfil Actualizado!</Text>
          <Text style={isDarkTheme ? styles.successMessageDark : styles.successMessageLight}>
            Redirigiendo al dashboard...
          </Text>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
          <Text style={styles.logo}>SEAMI</Text>

          <View style={styles.actions}>
            {/* Botón tema oscuro/claro */}
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
            </TouchableOpacity>

            {/* Menú de perfil */}
            <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)} style={styles.profileBtn}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>

            {/* Dropdown menu */}
            {showDropdown && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => router.push('/profile')}
                >
                  <Text style={styles.dropdownItemText}>Ver Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => router.push('/edit-profile')}
                >
                  <Text style={styles.dropdownItemText}>Editar Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => router.replace('/login')}
                >
                  <Text style={styles.dropdownItemText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Contenido principal */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header del formulario */}
            <View style={styles.formHeader}>
              <Text style={styles.title}>Editar Perfil</Text>
              <Text style={isDarkTheme ? styles.subtitleDark : styles.subtitleLight}>
                Personaliza tu perfil de estudiante
              </Text>
            </View>

            {/* Sección de foto de perfil */}
            <View style={isDarkTheme ? styles.sectionDark : styles.sectionLight}>
              <View style={styles.profileSection}>
                <View style={styles.profilePicContainer}>
                  <View style={styles.profilePic} />
                  <View style={styles.profilePicOverlay}>
                    <Text style={styles.changePicButton}>📷</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Sección de información básica */}
            <View style={isDarkTheme ? styles.sectionDark : styles.sectionLight}>
              <Text style={styles.sectionTitle}>Información Básica</Text>
              <View style={styles.formGrid}>
                <View style={styles.formGroup}>
                  <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Nombre Completo</Text>
                  <TextInput
                    value={formData.nombre}
                    onChangeText={(text) => handleInputChange('nombre', text)}
                    style={isDarkTheme ? styles.inputDark : styles.inputLight}
                    placeholder="Tu nombre completo"
                    placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Username</Text>
                  <TextInput
                    value={formData.username}
                    onChangeText={(text) => handleInputChange('username', text)}
                    style={isDarkTheme ? styles.inputDark : styles.inputLight}
                    placeholder="Tu nombre de usuario"
                    placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                  />
                </View>
              </View>
            </View>

            {/* Sección sobre mí */}
            <View style={isDarkTheme ? styles.sectionDark : styles.sectionLight}>
              <Text style={styles.sectionTitle}>Sobre mí</Text>
              <View style={styles.formGroup}>
                <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Biografía</Text>
                <TextInput
                  value={formData.bio}
                  onChangeText={(text) => handleInputChange('bio', text)}
                  style={[isDarkTheme ? styles.textareaDark : styles.textareaLight, { height: 100 }]}
                  placeholder="Cuéntanos algo sobre ti, tus intereses y metas..."
                  placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Sección de información académica */}
            <View style={isDarkTheme ? styles.sectionDark : styles.sectionLight}>
              <Text style={styles.sectionTitle}>Información Académica</Text>
              <View style={styles.formGrid}>
                <View style={styles.formGroup}>
                  <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Escuela</Text>
                  <TextInput
                    value={formData.escuela}
                    onChangeText={(text) => handleInputChange('escuela', text)}
                    style={isDarkTheme ? styles.inputDark : styles.inputLight}
                    placeholder="Nombre de tu escuela"
                    placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Grado/Semestre</Text>
                  <TextInput
                    value={formData.grado}
                    onChangeText={(text) => handleInputChange('grado', text)}
                    style={isDarkTheme ? styles.inputDark : styles.inputLight}
                    placeholder="Ej: 5to Semestre"
                    placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Materias de Interés</Text>
                  <TextInput
                    value={formData.materias}
                    onChangeText={(text) => handleInputChange('materias', text)}
                    style={isDarkTheme ? styles.inputDark : styles.inputLight}
                    placeholder="Cálculo, Física, etc."
                    placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                  />
                </View>
              </View>
            </View>

            {/* Acciones del formulario */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={isDarkTheme ? styles.cancelButtonDark : styles.cancelButtonLight}
                onPress={() => router.back()}
              >
                <Text style={isDarkTheme ? styles.cancelButtonTextDark : styles.cancelButtonTextLight}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <View style={styles.spinner} />
                    <Text style={styles.submitButtonText}>Guardando...</Text>
                  </>
                ) : (
                  <Text style={styles.submitButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Containers
  containerDark: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  containerLight: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  successContainerDark: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainerLight: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
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
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8bc34a',
    textShadowColor: 'rgba(139, 195, 74, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    position: 'relative',
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
  profileBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 45,
    minWidth: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 14,
  },

  // Form Container
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 80,
    paddingBottom: 20,
  },

  // Form Header
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8bc34a',
    marginBottom: 8,
  },
  subtitleDark: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  subtitleLight: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.7)',
    fontWeight: '400',
  },

  // Sections
  sectionDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    elevation: 8,
  },
  sectionLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 4,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
  },
  profilePicContainer: {
    position: 'relative',
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8bc34a',
    borderWidth: 4,
    borderColor: '#8bc34a',
  },
  profilePicOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8bc34a',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePicButton: {
    fontSize: 20,
    color: 'white',
  },

  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8bc34a',
    marginBottom: 16,
  },

  // Form Grid
  formGrid: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 16,
  },

  // Labels
  labelDark: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  labelLight: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 8,
  },

  // Inputs
  inputDark: {
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    fontSize: 16,
  },
  inputLight: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#1e293b',
    fontSize: 16,
  },
  textareaDark: {
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  textareaLight: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#1e293b',
    fontSize: 16,
    textAlignVertical: 'top',
  },

  // Form Actions
  formActions: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  cancelButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonTextDark: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonTextLight: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#8bc34a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: 8,
  },

  // Success Animation Styles
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8bc34a',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessageDark: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 32,
    textAlign: 'center',
  },
  successMessageLight: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
  },
}); 