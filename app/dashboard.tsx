import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from './_layout';

interface VideoItem {
  id: string;
  title: string;
  instructor: string;
  views: string;
  time: string;
  duration: string;
}

const DashboardScreen = () => {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const videos = [
    {
      id: '1',
      title: 'Ecuaciones Diferenciales Básicas',
      instructor: 'Prof. Carlos Pérez',
      views: '20k vistas',
      time: 'hace 1 día',
      duration: '44:29',
    },
    {
      id: '2',
      title: 'Física Cuántica Introductoria',
      instructor: 'Dra. Ana Martínez',
      views: '14k vistas',
      time: 'hace 1 mes',
      duration: '8:55',
    },
    {
      id: '3',
      title: 'Química Orgánica Avanzada',
      instructor: 'Prof. Luis González',
      views: '52k vistas',
      time: 'hace 5 meses',
      duration: '16:43',
    },
    {
      id: '4',
      title: 'Mecánica Clásica Fundamental',
      instructor: 'Prof. Roberto Ramírez',
      views: '10k vistas',
      time: 'hace 2 semanas',
      duration: '20:15',
    },
  ];

  const renderItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity style={isDarkTheme ? styles.videoCardDark : styles.videoCardLight}>
      <View style={styles.thumbnailContainer}>
        <Text style={styles.thumbnail}>🖼️ Miniatura</Text>
        <Text style={styles.duration}>{item.duration}</Text>
      </View>
      <View style={styles.videoDetails}>
        <Text numberOfLines={2} style={isDarkTheme ? styles.videoTitleDark : styles.videoTitleLight}>
          {item.title}
        </Text>
        <Text style={isDarkTheme ? styles.videoMetaDark : styles.videoMetaLight}>
          {item.instructor} • {item.views} • {item.time}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={isDarkTheme ? styles.containerDark : styles.containerLight}>
      {/* Header */}
      <View style={[isDarkTheme ? styles.headerDark : styles.headerLight, { paddingTop: insets.top || 16 }]}> 
        <Text style={isDarkTheme ? styles.logoDark : styles.logoLight}>SEAMI</Text>
        <View style={styles.actions}>
          {/* Botón tema oscuro/claro */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
            accessibilityLabel="Cambiar tema"
          >
            <Text style={styles.themeToggleText}>{isDarkTheme ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
          {/* Menú de perfil */}
          <TouchableOpacity style={styles.profileBtn} onPress={toggleDropdown}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
          {/* Dropdown menu */}
          {showDropdown && (
            <View style={isDarkTheme ? styles.dropdownDark : styles.dropdownLight}>
              <TouchableOpacity
                onPress={() => router.push('/profile')}
                style={styles.dropdownItem}
              >
                <Text style={isDarkTheme ? styles.dropdownItemTextDark : styles.dropdownItemTextLight}>
                  Ver Perfil
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/ZEN' })}
                style={styles.dropdownItem}
              >
                <Text style={isDarkTheme ? styles.dropdownItemTextDark : styles.dropdownItemTextLight}>
                  <Text style={styles.zenIcon}>🧘</Text> <Text style={styles.zenText}>SEAMI ZEN</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.replace('/login')}
                style={styles.dropdownItem}
              >
                <Text style={isDarkTheme ? styles.dropdownItemTextDark : styles.dropdownItemTextLight}>
                  Cerrar Sesión
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      {/* Barra de búsqueda */}
      <View style={isDarkTheme ? styles.searchBarDark : styles.searchBarLight}>
        <TextInput
          placeholder="Buscar tema o profesor..."
          placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
          style={isDarkTheme ? styles.searchInputDark : styles.searchInputLight}
        />
      </View>
      {/* Grilla de videos */}
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.videoGrid}
      />
    </SafeAreaView>
  );
};

export default DashboardScreen;

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
  dropdownDark: {
    position: 'absolute',
    right: 0,
    top: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownLight: {
    position: 'absolute',
    right: 0,
    top: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    minWidth: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemTextDark: {
    color: '#fff',
    fontSize: 14,
  },
  dropdownItemTextLight: {
    color: '#2d3748',
    fontSize: 14,
  },
  searchBarDark: {
    marginTop: 90,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
  },
  searchBarLight: {
    marginTop: 90,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchInputDark: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: 14,
  },
  searchInputLight: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    color: '#2d3748',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  videoGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  videoCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  videoCardLight: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    color: '#888',
    textAlign: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#fff',
    fontSize: 12,
    padding: 4,
    borderRadius: 4,
  },
  videoDetails: {
    padding: 12,
  },
  videoTitleDark: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  videoTitleLight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  videoMetaDark: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  videoMetaLight: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  zenIcon: {
    fontSize: 20,
    color: '#8bc34a',
  },
  zenText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#8bc34a',
  },
}); 