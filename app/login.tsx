// components/LoginScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
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

// Importa la inicialización de Firebase centralizada
import { Auth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, Firestore, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '../firebase-config';

const LoginScreen = () => {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState(''); // Para errores de Firebase
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          router.replace('/dashboard');
        }
      });
      return unsubscribe;
    }
  }, [auth]);

  useEffect(() => {
    (async () => {
      const firebase = await initializeFirebase();
      setAuth(firebase.auth);
      setDb(firebase.db);
    })();
  }, []);

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

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Espera a que Firebase esté inicializado
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
    
    if (isValid) {
      setLoading(true);
      setFirebaseError(''); // Limpiar errores previos
      
      try {
        // Iniciar sesión con Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          email, 
          password
        );
        const user = userCredential.user;
        
        // Obtener datos del usuario desde Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Redirigir según el rol y si el perfil está completo
          if (userData.perfilCompleto) {
            if (userData.role === 'profesor') {
              router.replace('/dashboard-teacher');
            } else {
              router.replace('/dashboard');
            }
          } else {
            if (userData.role === 'profesor') {
              router.replace('/complete-profile-teacher');
            } else {
              router.replace('/complete-profile');
            }
          }
        } else {
          // Si no existe el documento, redirigir al registro
          router.replace('/register');
        }
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
        setLoading(false);
        
        // Manejo de errores específicos de Firebase
        if (error.code === 'auth/user-not-found') {
          setEmailError('No existe una cuenta con este correo.');
        } else if (error.code === 'auth/wrong-password') {
          setPasswordError('Contraseña incorrecta.');
        } else if (error.code === 'auth/invalid-email') {
          setEmailError('Correo electrónico inválido.');
        } else {
          setFirebaseError('Error al iniciar sesión. Intenta de nuevo.');
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
          <Text style={isDarkTheme ? styles.welcomeTextDark : styles.welcomeTextLight}>¡Bienvenido de nuevo!</Text>
          
          {/* Mostrar errores generales de Firebase */}
          {firebaseError ? <Text style={styles.firebaseErrorText}>{firebaseError}</Text> : null}
          
          <View style={styles.formGroup}>
            <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Correo electrónico</Text>
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
            <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>Contraseña</Text>
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
                secureTextEntry={true}
                editable={!loading} // Deshabilitar durante la carga
              />
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
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
                <Text style={styles.buttonText}> Entrando...</Text>
              </>
            ) : (
              <>
                <Text style={styles.buttonText}>Entrar</Text>
                <Text style={styles.buttonIcon}>→</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={isDarkTheme ? styles.textCenterDark : styles.textCenterLight}>
            ¿No tienes cuenta?{' '}
            <Text
              style={isDarkTheme ? styles.linkDark : styles.linkLight}
              onPress={() => !loading && router.replace('/register')} // Evitar navegación durante carga
            >
              Regístrate aquí
            </Text>
          </Text>
          
          <Text style={[isDarkTheme ? styles.textCenterDark : styles.textCenterLight, styles.forgotPassword]}>
            <Text
              style={isDarkTheme ? styles.linkDark : styles.linkLight}
              onPress={() => !loading && router.replace('/forgot-password')} // Enlace a recuperación de contraseña
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
      
      {/* Loading screen - Ya no es necesario ya que usamos ActivityIndicator en el botón */}
    </SafeAreaView>
  );
};

export default LoginScreen;

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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(139, 195, 74, 0.3)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glassContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
  formGroup: {
    marginBottom: 16,
  },
  labelDark: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  labelLight: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    fontSize: 18,
    color: '#8bc34a',
  },
  inputDark: {
    flex: 1,
    height: 50,
    paddingLeft: 40,
    paddingRight: 12,
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
    paddingRight: 12,
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
  forgotPassword: {
    marginTop: 8,
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