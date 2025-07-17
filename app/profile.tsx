import { Stack, useRouter } from 'expo-router';
import React, { useContext } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from './_layout';

export default function ProfileScreen() {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Datos simulados del usuario
  const user = {
    name: 'Juan Pérez',
    email: 'juan.perez@escuela.edu',
    semester: '5to Semestre',
    subjects: [
      'Matemáticas Avanzadas - Prof. Carlos',
      'Física II - Prof. Laura',
      'Química Orgánica - Prof. Luis',
    ],
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
        {/* Header */}
        <View style={[isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16 }]}>
          <Text style={isDarkTheme ? styles.logoDark : styles.logoLight}>SEAMI</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Contenido principal */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={isDarkTheme ? styles.glassContainerDark : styles.glassContainerLight}>
            <Text style={isDarkTheme ? styles.titleDark : styles.titleLight}>Mi Perfil</Text>

            {/* Información del usuario */}
            <View style={styles.userInfoContainer}>
              <View style={styles.infoItem}>
                <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                  <Text style={styles.boldLabel}>Nombre:</Text> {user.name}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                  <Text style={styles.boldLabel}>Correo:</Text> {user.email}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                  <Text style={styles.boldLabel}>Semestre:</Text> {user.semester}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={isDarkTheme ? styles.labelDark : styles.labelLight}>
                  <Text style={styles.boldLabel}>Materias Asignadas:</Text>
                </Text>
                <View style={styles.subjectsList}>
                  {user.subjects.map((subject, index) => (
                    <Text key={index} style={isDarkTheme ? styles.subjectDark : styles.subjectLight}>
                      {subject}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Acciones */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={isDarkTheme ? styles.editBtnDark : styles.editBtnLight}
                onPress={() => router.push('/edit-profile')}
              >
                <Text style={isDarkTheme ? styles.actionTextDark : styles.actionTextLight}>Editar Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={isDarkTheme ? styles.logoutBtnDark : styles.logoutBtnLight}
                onPress={() => router.replace('/login')}
              >
                <Text style={isDarkTheme ? styles.actionTextDark : styles.actionTextLight}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  containerDark: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  containerLight: {
    flex: 1,
    backgroundColor: '#e0e0e0',
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
    paddingTop: 16,
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
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoDark: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8bc34a',
    textShadowColor: 'rgba(139, 195, 74, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  logoLight: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6aab3b',
    textShadowColor: 'rgba(139, 195, 74, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    padding: 16,
    marginTop: 80,
  },
  glassContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 16,
  },
  glassContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    marginHorizontal: 16,
  },
  titleDark: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#ffffffcc',
  },
  titleLight: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#222',
  },
  userInfoContainer: {
    marginBottom: 24,
  },
  infoItem: {
    marginBottom: 16,
  },
  labelDark: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  labelLight: {
    fontSize: 16,
    color: '#333',
  },
  boldLabel: {
    fontWeight: '600',
  },
  subjectsList: {
    paddingLeft: 16,
  },
  subjectDark: {
    fontSize: 14,
    color: '#ccc',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  subjectLight: {
    fontSize: 14,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginTop: 16,
  },
  editBtnDark: {
    backgroundColor: 'rgba(139, 195, 74, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  editBtnLight: {
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  logoutBtnDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  logoutBtnLight: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  actionTextDark: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffffcc',
  },
  actionTextLight: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
}); 