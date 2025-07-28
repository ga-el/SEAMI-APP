import { Stack, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from './_layout';
import { initializeFirebase } from '../firebase-config.js';
import { getDoc, doc } from 'firebase/firestore';
import Avatar from '../components/Avatar';
import { DEFAULT_PHOTO } from '../utils/imgdb';

export default function ProfileScreen() {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { auth, db } = initializeFirebase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError('No autenticado.');
          setLoading(false);
          router.replace('/login');
          return;
        }
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          setError('No existe información de usuario.');
          setLoading(false);
          return;
        }
        const data = userDoc.data();
        setUserData({
  name: data.name || data.nombre || user.displayName || '--',
  email: data.email || user.email || '--',
  semester: data.semester || data.semestre || '--',
  materias: Array.isArray(data.materias)
  ? data.materias.map((m: any) => {
      // Soporte para distintas variantes de estructura
      let nombre = '--';
      let maestro = '--';
      if (typeof m === 'object' && m !== null) {
        nombre = m.nombre || m.materia || m.subject || '--';
        // Maestro puede estar como string directo, objeto, o anidado
        if (typeof m.maestro === 'string') {
          maestro = m.maestro;
        } else if (typeof m.profesor === 'string') {
          maestro = m.profesor;
        } else if (m.maestro && typeof m.maestro === 'object') {
          // Si el maestro es objeto, buscar nombre
          maestro = m.maestro.nombre || m.maestro.name || '--';
        } else if (m.teacher) {
          maestro = m.teacher;
        }
      }
      return { nombre, maestro };
    })
  : [],
});
        setAvatarUrl(data.avatarUrl || DEFAULT_PHOTO);
      } catch (e) {
        setError('Error al cargar datos de perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: isDarkTheme ? '#8bc34a' : '#0f172a', fontSize: 18 }}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error || !userData) {
    return (
      <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#ef4444', fontSize: 16 }}>{error || 'No se pudo cargar el perfil.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
        {/* Header */}
        <View style={[isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' }]}>
          {/* Botón de regreso */}
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { position: 'absolute', left: 16, zIndex: 2 }]}> 
            <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#8bc34a' : '#0f172a'} />
          </TouchableOpacity>
          <Text style={[isDarkTheme ? styles.logoDark : styles.logoLight, { textAlign: 'center', flex: 1 }]}>SEAMI</Text>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggle, { position: 'absolute', right: 16, zIndex: 2 }]}> 
            <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Contenido principal */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={isDarkTheme ? styles.glassContainerDark : styles.glassContainerLight}>
            {/* Avatar y nombre */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
  <Avatar avatarUrl={avatarUrl} nombre={userData.name} size={80} />
</View>
              <View style={styles.profileTitle}>
                <Text style={styles.profileName}>{userData.name}</Text>
<Text style={styles.profileEmail}>{userData.email}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            {/* Información del usuario */}
            <View style={styles.userInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>
  <Text style={styles.infoLabelBold}>Semestre:</Text>
  <Text style={isDarkTheme ? styles.semesterNumberDark : styles.semesterNumberLight}> {userData.semester}</Text>
</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabelBold}>Materias Asignadas:</Text>
<View style={styles.profileTableContainer}>
  <View style={styles.profileTableHeader}>
    <Text style={styles.profileTableHeaderCell}>Materia</Text>
    <Text style={styles.profileTableHeaderCell}>Profesor</Text>
  </View>
  {userData.materias.map((mat: {nombre: string, maestro: string}, idx: number) => (
    <View key={idx} style={[styles.profileTableRow, idx % 2 === 0 ? styles.profileTableRowEven : styles.profileTableRowOdd]}>
      <Text style={styles.profileTableCell}>{mat.nombre}</Text>
      <Text style={styles.profileTableCell}>{mat.maestro}</Text>
    </View>
  ))}
</View>
              </View>
            </View>
            <View style={styles.divider} />
            {/* Botones adicionales */}
            <View style={styles.profileActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => router.push('/edit-profile')}>
                <Text style={styles.actionBtnText}>Editar Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={async () => {
                try {
                  await auth.signOut();
                  router.replace('/login');
                } catch (e) {
                  // Manejo de error opcional
                }
              }}>
                <Text style={styles.actionBtnText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  semesterNumberDark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  semesterNumberLight: {
    color: '#111',
    fontWeight: 'bold',
  },
  // --- Adaptación main perfil ---
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 18,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8bc34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#8bc34a',
    shadowColor: '#8bc34a',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarFallbackText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
  },
  profileTitle: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2,
  },
  profileName: {
    fontSize: 22,
    color: '#8bc34a',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 15,
    color: '#b0b0b0',
  },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(139,195,74,0.18)',
    marginVertical: 16,
  },
  userInfo: {
    marginBottom: 8,
  },
  // infoItem definido una sola vez para evitar duplicados
infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#2d3748',
  },
  infoLabelBold: {
    fontWeight: 'bold',
    color: '#8bc34a',
    fontSize: 16,
  },
  profileTableContainer: {
    width: '100%',
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(44,62,80,0.13)',
    shadowColor: '#8bc34a',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  profileTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#8bc34a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  profileTableHeaderCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  profileTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  profileTableRowEven: {
    backgroundColor: 'rgba(139,195,74,0.08)',
  },
  profileTableRowOdd: {
    backgroundColor: 'rgba(80,49,92,0.10)',
  },
  profileTableCell: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 18,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8bc34a',
    shadowColor: '#8bc34a',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  editBtn: {
    backgroundColor: '#8bc34a',
  },
  logoutBtn: {
    backgroundColor: '#50315c',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // --- Fin adaptación main perfil ---
  backButton: {
    padding: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  // infoItem definido una sola vez para evitar duplicados
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