// avatar-loader.js
// Script para cargar avatar de usuario desde Firebase y mostrarlo en el header
import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/login';
    return;
  }
  // Iniciales para fallback
  const initials = user.displayName ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : (user.email ? user.email[0].toUpperCase() : '--');
  document.getElementById('avatar-fallback').textContent = initials;
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Avatar personalizado si existe
      if (data.avatarUrl) {
        const avatarImg = document.getElementById('profile-avatar');
        avatarImg.src = data.avatarUrl;
        avatarImg.style.display = 'block';
        document.getElementById('avatar-fallback').style.display = 'none';
      } else {
        document.getElementById('profile-avatar').style.display = 'none';
        document.getElementById('avatar-fallback').style.display = 'flex';
      }
      // Validación de perfil y rol
      if (!data.perfilCompleto) {
        window.location.href = '/complete-profile';
        return;
      }
      if (data.role === 'profesor') {
        window.location.href = '/dashboard-profesor';
        return;
      }
    } else {
      window.location.href = '/register';
      return;
    }
  } catch (e) {
    window.location.href = '/login';
  }
});
