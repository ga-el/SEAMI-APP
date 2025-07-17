import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
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

const RegisterScreen = () => {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolKey, setSchoolKey] = useState('');
  const [role, setRole] = useState('alumno');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [schoolKeyError, setSchoolKeyError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.trim() === '') {
      setEmailError('Este campo es requerido.');
    } else if (!isValidEmail(text)) {
      setEmailError('Por favor, ingresa un correo electrónico válido.');
    } else {
      setEmailError('');
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
    }
  };

  const handleSchoolKeyChange = (text) => {
    setSchoolKey(text);
    if (text.trim() === '') {
      setSchoolKeyError('La clave escolar es requerida.');
    } else {
      setSchoolKeyError('');
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = () => {
    let isValid = true;

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
      setTimeout(() => {
        setLoading(false);
        // Simular redirección según el rol
        if (role === 'alumno') {
          router.replace('/complete-profile');
        } else if (role === 'profesor') {
          router.replace('/complete-profile-teacher');
        }
      }, 2000);
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

          <View style={styles.formGroup}>
            <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
              Correo electrónico
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.icon}>📧</Text>
              <TextInput
                style={isDarkTheme ? styles.inputDark : styles.inputLight}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
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
                style={isDarkTheme ? styles.inputDark : styles.inputLight}
                placeholder="••••••••"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
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
                style={isDarkTheme ? styles.inputDark : styles.inputLight}
                placeholder="Ingresa tu clave"
                placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
                value={schoolKey}
                onChangeText={handleSchoolKeyChange}
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
                  role === 'alumno' && styles.roleOptionSelected,
                ]}
                onPress={() => setRole('alumno')}
              >
                <Text style={styles.roleIcon}>👨‍🎓</Text>
                <Text style={styles.roleText}>Alumno</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === 'profesor' && styles.roleOptionSelected,
                ]}
                onPress={() => setRole('profesor')}
              >
                <Text style={styles.roleIcon}>👨‍🏫</Text>
                <Text style={styles.roleText}>Profesor</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={isDarkTheme ? styles.submitButtonDark : styles.submitButtonLight}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Text>
            <Text style={styles.buttonIcon}>→</Text>
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
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Loading screen */}
      {loading && (
        <View style={styles.loadingContainer}>
          <View style={styles.spinner}></View>
          <Text style={isDarkTheme ? styles.loadingTextDark : styles.loadingTextLight}>
            Creando tu cuenta...
          </Text>
        </View>
      )}
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
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
}); 