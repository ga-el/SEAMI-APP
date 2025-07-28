// utils/imgdb.ts
// Utilidad para subir imágenes a ImgBB y obtener foto de perfil por defecto

export const DEFAULT_PHOTO = 'https://i.pravatar.cc/150?img=32';
export const IMGBB_API_KEY = '10be477c62336a10f1d1151961458302';

/**
 * Sube una imagen a ImgBB y retorna la URL pública.
 * @param base64Image Imagen en base64 (sin encabezado data:image/...)
 * @returns URL de la imagen subida
 */
export async function uploadToImgBB(base64Image: string): Promise<string> {
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Image);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (data.success && data.data && data.data.url) {
    return data.data.url;
  } else {
    throw new Error('No se pudo subir la imagen a ImgBB');
  }
}
