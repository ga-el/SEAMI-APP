// screens/CompleteProfileTeacherScreen.jsx
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initializeFirebase } from '../firebase-config';
import { getDoc, setDoc, doc } from 'firebase/firestore';

// Inicialización centralizada de Firebase
const { auth, db } = initializeFirebase();

interface SubjectRow {
  subject: string;
  semester: string;
}

interface CompleteProfileForm {
  first_name: string;
  last_name: string;
  second_last_name: string;
  birthdate: string;
  subjects: SubjectRow[];
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  second_last_name?: string;
  birthdate?: string;
  subjects?: string;
}

const initialSubjects = [
  { subject: '', semester: '' },
  { subject: '', semester: '' },
  { subject: '', semester: '' },
  { subject: '', semester: '' },
  { subject: '', semester: '' },
];

export const options = {
  headerShown: false,
};

export default function CompleteProfileTeacherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [form, setForm] = useState<CompleteProfileForm>({
    first_name: '',
    last_name: '',
    second_last_name: '',
    birthdate: '',
    subjects: [...initialSubjects],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/login');
        return;
      }
      
      // Opcional: cargar datos existentes del perfil si ya existen
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().perfilCompleto) {
          // Si el perfil ya está completo, redirigir al dashboard
          router.replace('/dashboard-teacher');
        }
      } catch (error) {
        console.log("No se pudieron cargar datos del perfil:", error);
      }
    };

    checkAuth();
  }, []);

  const handleChange = (name: keyof CompleteProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubjectChange = (idx: number, field: keyof SubjectRow, value: string) => {
    setForm((prev) => {
      const newSubjects = prev.subjects.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      );
      return { ...prev, subjects: newSubjects };
    });
    if (errors.subjects) {
      setErrors((prev) => ({ ...prev, subjects: undefined }));
    }
  };

  const addSubjectRow = () => {
    setForm((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { subject: '', semester: '' }],
    }));
  };

  const removeSubjectRow = (idx: number) => {
    if (form.subjects.length > 1) {
      setForm((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((_, i) => i !== idx),
      }));
    }
  };

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = 'Por favor ingresa tu nombre.';
    if (!form.last_name.trim()) newErrors.last_name = 'Por favor ingresa tu apellido paterno.';
    
    // Validar que al menos una materia tenga ambos campos llenos
    const hasValidSubject = form.subjects.some(
      (s) => s.subject.trim() && s.semester.trim()
    );
    if (!hasValidSubject) newErrors.subjects = 'Agrega al menos una materia y su semestre.';
    
    return newErrors;
  };

  const handleSubmit = async () => {
    const validation = validate();
    setErrors(validation);
    
    if (Object.keys(validation).length === 0) {
      setIsSubmitting(true);
      
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('Usuario no autenticado');
        }
        
        // Filtrar materias vacías
        const validSubjects = form.subjects.filter(
          s => s.subject.trim() && s.semester.trim()
        );
        
        // Guardar datos en Firestore
        await setDoc(doc(db, "users", user.uid), {
          ...form,
          subjects: validSubjects,
          perfilCompleto: true,
          role: 'profesor', // Asegurarse de que el rol sea profesor
          updatedAt: new Date()
        }, { merge: true }); // merge: true para no sobreescribir otros datos
        
        // Redirigir al dashboard de profesor
        router.replace('/dashboard-teacher');
      } catch (error) {
        console.error("Error al completar el perfil:", error);
        Alert.alert(
          'Error',
          'No se pudo completar el perfil. Por favor, intenta de nuevo.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8bc34a" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8bc34a" />
        <Text style={styles.loadingText}>¡Perfil completado! Redirigiendo...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.scrollContainer, isDarkTheme ? styles.containerDark : styles.containerLight]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16 }]}>
          <Text style={isDarkTheme ? styles.logoDark : styles.logoLight}>SEAMI</Text>
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => setIsDarkTheme(!isDarkTheme)}
            accessibilityLabel="Cambiar tema"
          >
            <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
        </View>
        {/* Formulario */}
        <View style={isDarkTheme ? styles.formContainerDark : styles.formContainerLight}>
          <Text style={isDarkTheme ? styles.welcomeTextDark : styles.welcomeTextLight}>
            ¡Bienvenido!
          </Text>
          <Text style={isDarkTheme ? styles.titleDark : styles.titleLight}>
            Completa tu Perfil de Profesor
          </Text>
          {/* Nombre completo */}
          <View style={styles.formGroup}>
            <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Nombre(s)</Text>
            <TextInput
              placeholder="Nombre(s)"
              value={form.first_name}
              onChangeText={(text) => handleChange('first_name', text)}
              style={[
                isDarkTheme ? styles.inputDark : styles.inputLight,
                errors.first_name && styles.inputError,
              ]}
              placeholderTextColor={isDarkTheme ? '#aaa' : '#888'}
            />
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
          </View>
          <View style={styles.row}>
            <View style={styles.halfInputGroup}>
              <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                Apellido Paterno
              </Text>
              <TextInput
                placeholder="Apellido Paterno"
                value={form.last_name}
                onChangeText={(text) => handleChange('last_name', text)}
                style={[
                  isDarkTheme ? styles.inputDark : styles.inputLight,
                  errors.last_name && styles.inputError,
                ]}
                placeholderTextColor={isDarkTheme ? '#aaa' : '#888'}
              />
              {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
            </View>
            <View style={styles.halfInputGroup}>
              <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                Apellido Materno (opcional)
              </Text>
              <TextInput
                placeholder="Apellido Materno"
                value={form.second_last_name}
                onChangeText={(text) => handleChange('second_last_name', text)}
                style={isDarkTheme ? styles.inputDark : styles.inputLight}
                placeholderTextColor={isDarkTheme ? '#aaa' : '#888'}
              />
            </View>
          </View>
          <View style={styles.formGroup}>
            <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Fecha de nacimiento</Text>
            <TextInput
              placeholder="DD/MM/AAAA"
              value={form.birthdate}
              onChangeText={(text) => handleChange('birthdate', text)}
              style={isDarkTheme ? styles.inputDark : styles.inputLight}
              placeholderTextColor={isDarkTheme ? '#aaa' : '#888'}
            />
          </View>
          {/* Materias */}
          <Text style={isDarkTheme ? styles.subtitleDark : styles.subtitleLight}>
            Materias Asignadas
          </Text>
          <Text style={isDarkTheme ? styles.subtextDark : styles.subtextLight}>
            Escribe cada materia con su semestre:
          </Text>
          <View style={styles.subjectsContainer}>
            {form.subjects.map((row, idx) => (
              <View key={idx} style={styles.subjectRow}>
                <TextInput
                  placeholder={`Materia ${idx + 1}`}
                  value={row.subject}
                  onChangeText={(text) => handleSubjectChange(idx, 'subject', text)}
                  style={[
                    isDarkTheme ? styles.subjectInputDark : styles.subjectInputLight,
                    errors.subjects && !row.subject.trim() && !row.semester.trim() && styles.inputError,
                  ]}
                  placeholderTextColor={isDarkTheme ? '#aaa' : '#888'}
                />
                <TextInput
                  placeholder={`Semestre`}
                  value={row.semester}
                  onChangeText={(text) => handleSubjectChange(idx, 'semester', text)}
                  style={[
                    isDarkTheme ? styles.subjectInputDark : styles.subjectInputLight,
                    errors.subjects && !row.subject.trim() && !row.semester.trim() && styles.inputError,
                  ]}
                  placeholderTextColor={isDarkTheme ? '#aaa' : '#888'}
                />
                {form.subjects.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeRowBtn}
                    onPress={() => removeSubjectRow(idx)}
                  >
                    <Text style={styles.iconTrash}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {errors.subjects && <Text style={styles.errorText}>{errors.subjects}</Text>}
          </View>
          <TouchableOpacity style={styles.addRowBtn} onPress={addSubjectRow}>
            <Text style={styles.addRowText}>+ Agregar materia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={isDarkTheme ? styles.submitBtnDark : styles.submitBtnLight}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitText}> Completando...</Text>
              </>
            ) : (
              <Text style={styles.submitText}>Finalizar Registro</Text>
            )}
          </TouchableOpacity>
          <Text style={isDarkTheme ? styles.textCenterDark : styles.textCenterLight}>
            ¿Ya tienes cuenta?{' '}
            <Text
              style={isDarkTheme ? styles.linkDark : styles.linkLight}
              onPress={() => router.replace('/login')}
            >
              Inicia sesión aquí
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  containerLight: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
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
  formContainerDark: {
    flex: 1,
    marginTop: 100,
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  formContainerLight: {
    flex: 1,
    marginTop: 100,
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  welcomeTextDark: {
    fontSize: 16,
    color: '#8bc34a',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeTextLight: {
    fontSize: 16,
    color: '#6aab3b',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleDark: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#8bc34a',
  },
  titleLight: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#6aab3b',
  },
  formGroup: {
    marginBottom: 16,
  },
  labelDark: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    color: '#e2e8f0',
  },
  labelLight: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    color: '#475569',
  },
  inputDark: {
    height: 50,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
    fontSize: 14,
  },
  inputLight: {
    height: 50,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    color: '#1e293b',
    fontSize: 14,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInputGroup: {
    flex: 1,
    marginBottom: 12,
  },
  subtitleDark: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#cbd5e1',
  },
  subtitleLight: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#334155',
  },
  subtextDark: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  subtextLight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  subjectsContainer: {
    marginBottom: 16,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  subjectInputDark: {
    flex: 1,
    height: 50,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
  },
  subjectInputLight: {
    flex: 1,
    height: 50,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    color: '#1e293b',
    fontSize: 14,
  },
  removeRowBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
  },
  iconTrash: {
    fontSize: 20,
    color: '#ef4444',
  },
  addRowBtn: {
    backgroundColor: '#8bc34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addRowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtnDark: {
    backgroundColor: '#8bc34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnLight: {
    backgroundColor: '#8bc34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textCenterDark: {
    textAlign: 'center',
    marginTop: 16,
    color: '#cbd5e1',
  },
  textCenterLight: {
    textAlign: 'center',
    marginTop: 16,
    color: '#475569',
  },
  linkDark: {
    color: '#8bc34a',
    fontWeight: '500',
  },
  linkLight: {
    color: '#6aab3b',
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#8bc34a',
  },
});