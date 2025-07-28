import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  avatarUrl?: string | null;
  nombre?: string | null;
  size?: number; // Permite personalizar el tamaño, por defecto 50
}

const Avatar: React.FC<AvatarProps> = ({ avatarUrl, nombre, size = 50 }) => {
  // Depuración: mostrar qué props llegan
  console.log('AvatarUrl prop:', avatarUrl);
  console.log('Nombre prop:', nombre);

  // Obtiene la inicial del nombre
  let initial = '--';
  if (nombre && nombre.trim().length > 0) {
    const parts = nombre.trim().split(' ');
    initial = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  }

  // Control de error de carga de imagen
  const [imgError, setImgError] = React.useState(false);

  if (avatarUrl && !imgError) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        resizeMode="cover"
        onError={() => {
          setImgError(true);
          console.warn('No se pudo cargar la imagen remota:', avatarUrl);
        }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.initial}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 25,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#8bc34a',
  },
  fallback: {
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8bc34a',
  },
  initial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default Avatar;
