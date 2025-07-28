// components/RegisterScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState, useEffect } from 'react';
import {
  ActivityIndicator, // Para el spinner de carga
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from './_layout';

// Importaciones de Firebase centralizadas
import { initializeFirebase } from '../firebase-config';
import { createUserWithEmailAndPassword, Auth } from 'firebase/auth';
import { doc, setDoc, Firestore } from 'firebase/firestore';

const RegisterScreen = () => {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);

  useEffect(() => {
    const { auth, db } = initializeFirebase();
    setAuth(auth);
    setDb(db);
  }, []);

  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolKey, setSchoolKey] = useState('');
  const [role, setRole] = useState('alumno'); // Valor por defecto como en Astro
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [schoolKeyError, setSchoolKeyError] = useState('');
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState(''); // Para errores de Firebase

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.trim() === '') {
      setEmailError('Este campo es requerido.');
    } else if (!isValidEmail(text)) {
      setEmailError('Por favor, ingresa un correo electrónico válido.');
    } else {
      setEmailError('');
      setFirebaseError(''); // Limpiar errores de Firebase al escribir
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (text.trim() === '') {
      setPasswordError('La contraseña es requerida.');
    } else if (text.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
    } else {
      setPasswordError('');
      setFirebaseError(''); // Limpiar errores de Firebase al escribir
    }
  };

  const handleSchoolKeyChange = (text) => {
    setSchoolKey(text);
    if (text.trim() === '') {
      setSchoolKeyError('La clave escolar es requerida.');
    } else {
      setSchoolKeyError('');
      setFirebaseError(''); // Limpiar errores de Firebase al escribir
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!auth || !db) {
      setFirebaseError('La app aún está inicializando. Intenta de nuevo en unos segundos.');
      return;
    }
    let isValid = true;
    
    // Validaciones locales
    if (email.trim() === '') {
      setEmailError('Este campo es requerido.');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Por favor, ingresa un correo electrónico válido.');
      isValid = false;
    }
    
    if (password.trim() === '') {
      setPasswordError('La contraseña es requerida.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      isValid = false;
    }
    
    if (schoolKey.trim() === '') {
      setSchoolKeyError('La clave escolar es requerida.');
      isValid = false;
    }
    
    if (isValid) {
      setLoading(true);
      setFirebaseError(''); // Limpiar errores previos
      
      try {
        // Crear usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          email, 
          password
        );
        const user = userCredential.user;
        
        // Guardar datos iniciales en Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: email,
          schoolKey: schoolKey,
          role: role,
          perfilCompleto: false,
          createdAt: new Date()
        });
        
        // Redirigir según el rol (igual que en Astro)
        if (role === "alumno") {
          router.replace("/complete-profile");
        } else if (role === "profesor") {
          router.replace("/complete-profile-teacher"); // Asumo que es este el path en RN
        }
      } catch (error) {
        console.error("Error al crear usuario:", error);
        setLoading(false);
        
        // Manejo de errores específicos de Firebase
        if (error.code === 'auth/email-already-in-use') {
          setEmailError('Este correo ya está registrado.');
        } else if (error.code === 'auth/weak-password') {
          setPasswordError('La contraseña es muy débil.');
        } else if (error.code === 'auth/invalid-email') {
          setEmailError('Correo electrónico inválido.');
        } else {
          setFirebaseError('Error al crear la cuenta. Intenta de nuevo.');
        }
      }
    }
  };

  return (
    <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
      {/* Header */}
      <View style={[isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16 }]}> 
        <TouchableOpacity onPress={() => router.replace('/welcome')} style={{ marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#8bc34a' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={isDarkTheme ? styles.logoDark : styles.logoLight}>SEAMI</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Contenido principal */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <Animated.View style={isDarkTheme ? styles.glassContainerDark : styles.glassContainerLight}>
          <View style={styles.titleWrapper}>
            <Text style={isDarkTheme ? styles.welcomeTextDark : styles.welcomeTextLight}>
              ¡Bienvenido a SEAMI!
            </Text>
            <Text style={isDarkTheme ? styles.titleDark : styles.titleLight}>
              Crear una cuenta
            </Text>
          </View>
          
          {/* Mostrar errores generales de Firebase */}
          {firebaseError ? <Text style={styles.firebaseErrorText}>{firebaseError}</Text> : null}
          
          <View style={styles.formGroup}>
            <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
              Correo electrónico
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.icon}>📧</Text>
              <TextInput
                style={[
                  isDarkTheme ? styles.inputDark : styles.inputLight,
                  emailError ? styles.inputError : null
                ]}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading} // Deshabilitar durante la carga
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
              Contraseña
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.icon}>🔒</Text>
              <TextInput
                style={[
                  isDarkTheme ? styles.inputDark : styles.inputLight,
                  passwordError ? styles.inputError : null
                ]}
                placeholder="••••••••"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                editable={!loading} // Deshabilitar durante la carga
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading} // Deshabilitar durante la carga
              >
                <Text>{showPassword ? '👁️‍🗨️' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
              Clave escolar
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.icon}>🎯</Text>
              <TextInput
                style={[
                  isDarkTheme ? styles.inputDark : styles.inputLight,
                  schoolKeyError ? styles.inputError : null
                ]}
                placeholder="Ingresa tu clave"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                value={schoolKey}
                onChangeText={handleSchoolKeyChange}
                editable={!loading} // Deshabilitar durante la carga
              />
            </View>
            {schoolKeyError ? <Text style={styles.errorText}>{schoolKeyError}</Text> : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
              Tipo de cuenta
            </Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  isDarkTheme ? styles.roleOptionDark : styles.roleOptionLight,
                  role === 'alumno' && styles.roleOptionSelected,
                ]}
                onPress={() => !loading && setRole('alumno')} // Evitar cambio durante carga
                disabled={loading}
              >
                <Text style={styles.roleIcon}>👨‍🎓</Text>
                <Text style={styles.roleText}>Alumno</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  isDarkTheme ? styles.roleOptionDark : styles.roleOptionLight,
                  role === 'profesor' && styles.roleOptionSelected,
                ]}
                onPress={() => !loading && setRole('profesor')} // Evitar cambio durante carga
                disabled={loading}
              >
                <Text style={styles.roleIcon}>👨‍🏫</Text>
                <Text style={styles.roleText}>Profesor</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              isDarkTheme ? styles.submitButtonDark : styles.submitButtonLight,
              loading || !auth || !db ? styles.submitButtonDisabled : null
            ]}
            onPress={handleSubmit}
            disabled={loading || !auth || !db}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}> Creando cuenta...</Text>
              </>
            ) : (
              <>
                <Text style={styles.buttonText}>Crear cuenta</Text>
                <Text style={styles.buttonIcon}>→</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={isDarkTheme ? styles.textCenterDark : styles.textCenterLight}>
            ¿Ya tienes cuenta?{' '}
            <Text
              style={isDarkTheme ? styles.linkDark : styles.linkLight}
              onPress={() => !loading && router.replace('/login')} // Evitar navegación durante carga
            >
              Inicia sesión aquí
            </Text>
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
      
      {/* Loading screen - Ya no es necesario ya que usamos ActivityIndicator en el botón */}
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  containerBase: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  containerLight: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerDark: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
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
    padding: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 195, 74, 0.2)',
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
    color: '#8bc34a',
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
  formContainer: {
    flex: 1,
    marginTop: 80,
    padding: 16,
    justifyContent: 'center',
  },
  glassContainerDark: {
    borderRadius: 25,
    padding: 32,
    margin: 16,
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassContainerLight: {
    borderRadius: 25,
    padding: 32,
    margin: 16,
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8bc34a',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  titleWrapper: {
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeTextDark: {
    fontSize: 16,
    color: '#8bc34a',
    marginBottom: 8,
  },
  welcomeTextLight: {
    fontSize: 16,
    color: '#6aab3b',
    marginBottom: 8,
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
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: 12,
    fontSize: 18,
    color: '#8bc34a',
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    fontSize: 18,
    color: '#8bc34a',
  },
  inputDark: {
    flex: 1,
    height: 50,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    color: '#fff',
    fontSize: 14,
  },
  inputLight: {
    flex: 1,
    height: 50,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    color: '#1e293b',
    fontSize: 14,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  submitButtonDark: {
    backgroundColor: '#8bc34a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  submitButtonLight: {
    backgroundColor: '#8bc34a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    color: '#fff',
    fontSize: 16,
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
  // Estilos para el spinner de carga (ya no se usan)
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  spinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#8bc34a',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  loadingTextDark: {
    color: '#8bc34a',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  loadingTextLight: {
    color: '#6aab3b',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    marginTop: 8,
  },
  roleOption: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionDark: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  roleOptionLight: {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  roleOptionSelected: {
    borderColor: '#8bc34a',
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Nuevos estilos para errores de Firebase
  firebaseErrorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
});