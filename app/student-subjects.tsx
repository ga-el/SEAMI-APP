import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { initializeFirebase } from '../firebase-config';
import { ThemeContext } from './_layout';

const { auth, db } = initializeFirebase();

interface SubjectItem {
  id: string; // we'll use a combination of nombre+maestro
  nombre: string;
  maestro: string;
  semester?: string;
  videoCount: number;
  isFavorite: boolean;
}

export default function StudentSubjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.uid);
      await loadSubjects(user.uid);
    });
    return unsubscribe;
  }, []);

  const normalizeString = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const loadSubjects = async (uid: string) => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setLoading(false);
        return;
      }

      const data = userDoc.data();
      let rawSubjects: any[] = [];
      
      // Manejar la estructura según como esté guardada
      if (data.subjects && Array.isArray(data.subjects)) {
        rawSubjects = data.subjects.map((s: any) => ({
          nombre: s.subject || s.nombre || s.materia || '',
          maestro: s.teacher || s.profesor || s.maestro || ''
        }));
      } else if (data.materias && Array.isArray(data.materias)) {
        rawSubjects = data.materias.map((m: any) => {
            let maestro = m.profesor || m.teacher || m.maestro || '';
            if (typeof m.maestro === 'object' && m.maestro) {
                maestro = m.maestro.nombre || '';
            }
            return {
                nombre: m.nombre || m.materia || m.subject || '',
                maestro: maestro
            };
        });
      }

      const favs = data.favoriteSubjects || [];
      setFavoriteSubjects(favs);
      const userSemester = data.semester || data.semestre || 'N/A';

      // Para cada materia, calcular cantidad de videos
      const loadedSubjects: SubjectItem[] = [];
      
      for (const s of rawSubjects) {
        if (!s.nombre) continue;
        
        const subId = `${s.nombre}-${s.maestro}`;
        
        // Simular o buscar videos por título o profesor usando un acercamiento sencillo
        // En una app real podríamos hacer una query where('subject', '==', s.nombre)
        // Por ahora contaremos cuántos videos mencionan la materia en su títuloLowerCase
        let videoCount = 0;
        try {
            const vQuery = query(collection(db, 'videos'), limit(50));
            const vSnap = await getDocs(vQuery);
            const nSub = normalizeString(s.nombre);
            videoCount = vSnap.docs.filter(d => {
                const title = normalizeString(d.data().title || '');
                return title.includes(nSub);
            }).length;
        } catch(e) {
            console.log("No se pudieron contar videos", e);
        }

        loadedSubjects.push({
          id: subId,
          nombre: s.nombre,
          maestro: s.maestro,
          semester: userSemester,
          videoCount: videoCount,
          isFavorite: favs.includes(subId)
        });
      }

      setSubjects(loadedSubjects);
      setFilteredSubjects(loadedSubjects);
    } catch (error) {
      console.error("Error loading subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const norm = normalizeString(text);
    if (!norm) {
      setFilteredSubjects(subjects);
      return;
    }
    const filtered = subjects.filter(
      (s) =>
        normalizeString(s.nombre).includes(norm) ||
        normalizeString(s.maestro).includes(norm)
    );
    setFilteredSubjects(filtered);
  };

  const toggleFavorite = async (subjectId: string) => {
    if (!userId) return;
    try {
      const isFav = favoriteSubjects.includes(subjectId);
      const newFavs = isFav
        ? favoriteSubjects.filter((id) => id !== subjectId)
        : [...favoriteSubjects, subjectId];

      setFavoriteSubjects(newFavs);

      // Actualizar UI local inmediatamente
      const updated = subjects.map(s => 
          s.id === subjectId ? { ...s, isFavorite: !isFav } : s
      );
      setSubjects(updated);
      handleSearch(searchQuery); // re-aplicar filtro

      // Guardar en Firebase
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { favoriteSubjects: newFavs });
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const renderItem = ({ item }: { item: SubjectItem }) => (
    <View style={isDarkTheme ? styles.cardDark : styles.cardLight}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📚</Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={item.isFavorite ? 'star' : 'star-outline'}
            size={24}
            color={item.isFavorite ? '#fbbf24' : (isDarkTheme ? '#94a3b8' : '#cbd5e1')}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardContent}>
        <Text style={isDarkTheme ? styles.titleDark : styles.titleLight}>{item.nombre}</Text>
        <Text style={isDarkTheme ? styles.teacherDark : styles.teacherLight}>Prof. {item.maestro}</Text>
        <View style={styles.metaRow}>
          <Text style={isDarkTheme ? styles.metaDark : styles.metaLight}>Semestre: {item.semester}</Text>
          <Text style={isDarkTheme ? styles.metaDark : styles.metaLight}>•</Text>
          <Text style={isDarkTheme ? styles.metaDark : styles.metaLight}>{item.videoCount} videos</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
      {/* Header */}
      <View style={[isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#8bc34a' : '#0f172a'} />
            </TouchableOpacity>
            <Text style={isDarkTheme ? styles.appNameDark : styles.appNameLight}>Mis Materias</Text>
        </View>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={isDarkTheme ? styles.searchBarDark : styles.searchBarLight}>
        <Ionicons name="search" size={20} color={isDarkTheme ? '#aaa' : '#666'} style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar materia o profesor..."
          placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
          style={isDarkTheme ? styles.searchInputDark : styles.searchInputLight}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Lista de Materias */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8bc34a" />
          <Text style={isDarkTheme ? styles.loadingTextDark : styles.loadingTextLight}>Cargando materias...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSubjects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={isDarkTheme ? styles.emptyTextDark : styles.emptyTextLight}>
                No se encontraron materias asignadas.
              </Text>
            </View>
          }
        />
      )}
      
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerDark: { flex: 1, backgroundColor: '#0f172a' },
  containerLight: { flex: 1, backgroundColor: '#f5f7fa' },
  headerDark: {
    position: 'absolute', top: 0, width: '100%', zIndex: 1000,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(139, 195, 74, 0.2)',
  },
  headerLight: {
    position: 'absolute', top: 0, width: '100%', zIndex: 1000,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  appNameDark: { color: '#8bc34a', fontWeight: 'bold', fontSize: 22, letterSpacing: 1 },
  appNameLight: { color: '#6aab3b', fontWeight: 'bold', fontSize: 22, letterSpacing: 1 },
  themeToggle: {
    backgroundColor: 'rgba(139, 195, 74, 0.1)', borderRadius: 50,
    padding: 8, width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  themeToggleText: { fontSize: 20 },
  searchBarDark: {
    marginTop: 90, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', flexDirection: 'row', alignItems: 'center',
  },
  searchBarLight: {
    marginTop: 90, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)', flexDirection: 'row', alignItems: 'center',
  },
  searchIcon: { marginRight: 8 },
  searchInputDark: { flex: 1, color: '#fff', fontSize: 16, padding: 8, borderRadius: 8 },
  searchInputLight: { flex: 1, color: '#2d3748', fontSize: 16, padding: 8, borderRadius: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingTextDark: { color: '#8bc34a', marginTop: 12 },
  loadingTextLight: { color: '#6aab3b', marginTop: 12 },
  emptyTextDark: { color: '#94a3b8', fontSize: 16 },
  emptyTextLight: { color: '#64748b', fontSize: 16 },
  cardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#8bc34a', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(139, 195, 74, 0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconText: { fontSize: 24 },
  favoriteButton: { padding: 8 },
  cardContent: { gap: 4 },
  titleDark: { fontSize: 18, fontWeight: 'bold', color: '#e2e8f0' },
  titleLight: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  teacherDark: { fontSize: 15, color: '#94a3b8', marginBottom: 8 },
  teacherLight: { fontSize: 15, color: '#64748b', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  metaDark: { fontSize: 13, color: '#64748b' },
  metaLight: { fontSize: 13, color: '#94a3b8' },
});
