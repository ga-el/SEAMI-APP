import React, { useState, useEffect } from 'react';
import styles from './EditProfileForm.module.css';
import { auth, db } from '../lib/firebase.js';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const initialSubjects = [
  { subject: '', semester: '', teacherName: '' },
];

const DEFAULT_PHOTO = 'https://i.pravatar.cc/150?img=32';
const IMGBB_API_KEY = '10be477c62336a10f1d1151961458302';

const EditProfileForm = () => {
  const [form, setForm] = useState({
    first_name: '',
    semester: '',
    subjects: initialSubjects,
    avatarUrl: DEFAULT_PHOTO,
  });
  const [profilePhoto, setProfilePhoto] = useState(DEFAULT_PHOTO);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const loadTeacherSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'profesor'));
      const querySnapshot = await getDocs(q);
      
      const subjects = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.materias && Array.isArray(userData.materias)) {
          userData.materias.forEach(materia => {
            if (materia.nombre && materia.semestre) {
              const subjectKey = `${materia.nombre}-${materia.semestre}`;
              if (!subjects.find(s => s.key === subjectKey)) {
                subjects.push({
                  key: subjectKey,
                  nombre: materia.nombre,
                  semestre: materia.semestre,
                  profesor: `${userData.nombre || ''} ${userData.apellidoPaterno || ''}`.trim() || 'Profesor'
                });
              }
            }
          });
        }
      });
      
      subjects.sort((a, b) => {
        const nameCompare = a.nombre.localeCompare(b.nombre);
        if (nameCompare !== 0) return nameCompare;
        return a.semestre.localeCompare(b.semestre);
      });
      
      setAvailableSubjects(subjects);
    } catch (error) {
      console.error('Error al cargar materias:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        window.location.href = '/login';
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          
          // Construir subjects con la estructura correcta
          let subjects = initialSubjects;
          if (Array.isArray(data.materias) && data.materias.length > 0) {
            subjects = data.materias.map(m => {
              // Intentar encontrar la materia en availableSubjects para obtener el key
              const matchingSubject = availableSubjects.find(
                sub => sub.nombre === m.nombre && sub.semestre === m.semestre
              );
              return {
                subject: matchingSubject ? matchingSubject.key : '',
                semester: m.semestre || '',
                teacherName: m.profesor || ''
              };
            });
          }
          
          setForm({
            first_name: data.nombre || '',
            semester: data.semestre || '',
            subjects: subjects,
            avatarUrl: data.avatarUrl || DEFAULT_PHOTO,
          });
          setProfilePhoto(data.avatarUrl || DEFAULT_PHOTO);
        } else {
          setForm({
            first_name: '',
            semester: '',
            subjects: initialSubjects,
            avatarUrl: DEFAULT_PHOTO,
          });
          setProfilePhoto(DEFAULT_PHOTO);
        }
      } catch (err) {
        setForm({
          first_name: '',
          semester: '',
          subjects: initialSubjects,
          avatarUrl: DEFAULT_PHOTO,
        });
        setProfilePhoto(DEFAULT_PHOTO);
      }
    };
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadTeacherSubjects();
        await fetchUserData();
      } else {
        window.location.href = '/login';
      }
    });
    return () => unsubscribe();
  }, []);  // Solo ejecutar una vez al montar

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubjectChange = (idx, field, value) => {
    setForm((prev) => {
      const newSubjects = prev.subjects.map((s, i) => {
        if (i === idx) {
          if (field === 'subject') {
            const selectedSubject = availableSubjects.find(sub => sub.key === value);
            if (selectedSubject) {
              return {
                ...s,
                subject: value,
                semester: selectedSubject.semestre,
                teacherName: selectedSubject.profesor
              };
            }
            return { ...s, subject: value, semester: '', teacherName: '' };
          }
          return { ...s, [field]: value };
        }
        return s;
      });
      return { ...prev, subjects: newSubjects };
    });
    if (errors.subjects) {
      setErrors((prev) => ({ ...prev, subjects: undefined }));
    }
  };

  const addSubjectRow = () => {
    setForm((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { subject: '', semester: '', teacherName: '' }],
    }));
  };

  const removeSubjectRow = (idx) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== idx),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = 'Por favor ingresa tu nombre.';
    if (!form.semester || form.semester < 1 || form.semester > 6)
      newErrors.semester = 'El semestre debe ser entre 1 y 6.';
    const hasSubject = form.subjects.some(
      (s) => s.subject.trim() && s.semester.trim()
    );
    if (!hasSubject) newErrors.subjects = 'Agrega al menos una materia.';
    return newErrors;
  };

  // Subir imagen a imgbb y guardar la URL en el estado
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo y tamaño de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona una imagen válida (JPG, PNG, WEBP).');
        return;
      }
      
      if (file.size > maxSize) {
        alert('La imagen debe ser menor a 10MB.');
        return;
      }

      setIsUploading(true);
      
      // Mostrar preview inmediato
      const reader = new FileReader();
      reader.onload = (event) => {
        // Mostrar preview temporal mientras se sube
        setProfilePhoto(event.target.result);
      };
      reader.readAsDataURL(file);

      // Subir a imgbb
      const uploadReader = new FileReader();
      uploadReader.onload = async (event) => {
        const base64 = event.target.result.split(',')[1];
        const formData = new FormData();
        formData.append('image', base64);
        try {
          const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (data && data.data && data.data.url) {
            setProfilePhoto(data.data.url);
            setForm((prev) => ({ ...prev, avatarUrl: data.data.url }));
            setSuccessMessage('Imagen subida exitosamente');
            setTimeout(() => setSuccessMessage(''), 3000);
          } else {
            alert('Error al subir la imagen. Por favor intenta de nuevo.');
            // Restaurar imagen anterior
            setProfilePhoto(form.avatarUrl);
          }
        } catch (err) {
          alert('Error al subir la imagen. Por favor intenta de nuevo.');
          // Restaurar imagen anterior
          setProfilePhoto(form.avatarUrl);
        }
        setIsUploading(false);
      };
      uploadReader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length === 0) {
      setIsSubmitting(true);
      // Guardar en Firestore (Firebase)
      const user = auth.currentUser;
      if (!user) {
        window.location.href = '/login';
        return;
      }
      try {
        // Adaptar materias al formato de Firestore
        const materiasCompletas = form.subjects
          .filter(s => s.subject.trim() && s.semester.trim())
          .map(s => {
            const selectedSubject = availableSubjects.find(sub => sub.key === s.subject);
            return {
              nombre: selectedSubject ? selectedSubject.nombre : s.subject,
              semestre: s.semester,
              profesor: s.teacherName || (selectedSubject ? selectedSubject.profesor : '')
            };
          });
        const userData = {
          nombre: form.first_name.trim(),
          semestre: parseInt(form.semester),
          materias: materiasCompletas,
          avatarUrl: form.avatarUrl,
          perfilCompleto: true,
          updatedAt: new Date()
        };
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, userData);
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } catch (error) {
        setIsSubmitting(false);
        alert('Error al guardar en Firebase: ' + error.message);
      }
    }
  };

  if (showSuccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8bc34a, #6aab3b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 4px 24px rgba(139,195,74,0.18)'
        }}>
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="28" fill="none" stroke="#fff" strokeWidth="4" />
            <polyline points="18,32 28,42 44,22" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ color: '#8bc34a', fontWeight: 700, fontSize: '1.6rem', marginBottom: 8 }}>¡Perfil actualizado!</h2>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Redirigiendo al dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Editar Perfil</h2>
        <p className={styles.subtitle}>Mantén tu información actualizada</p>
      </div>

      {/* Foto de perfil con preview mejorado */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
          <label htmlFor="profile-photo-input" style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={profilePhoto}
                alt="Foto de perfil"
                style={{ 
                  width: 140, 
                  height: 140, 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '4px solid #8bc34a', 
                  boxShadow: '0 8px 32px rgba(139, 195, 74, 0.3)', 
                  opacity: isUploading ? 0.7 : 1, 
                  transition: 'all 0.3s ease',
                  filter: isUploading ? 'blur(1px)' : 'none'
                }}
              />
              
              {/* Overlay de carga */}
              {isUploading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(2px)'
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTop: '3px solid #8bc34a',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
              )}
              
              {/* Botón de cámara */}
              <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                background: '#8bc34a', 
                borderRadius: '50%', 
                width: 45, 
                height: 45, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)', 
                transition: 'all 0.3s ease',
                transform: isUploading ? 'scale(0.8)' : 'scale(1)',
                opacity: isUploading ? 0.5 : 1
              }}>
                <span style={{ fontSize: '1.3rem', color: 'white', margin: 0 }}>
                  {isUploading ? '⏳' : '📷'}
                </span>
              </div>
            </div>
          </label>
          
          <input
            id="profile-photo-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </div>
        
        {/* Información de la imagen */}
        <div style={{ textAlign: 'center' }}>
          <p className="image-preview-text" style={{ 
            fontSize: '0.9rem', 
            marginBottom: '0.5rem',
            fontWeight: 500
          }}>
            {isUploading ? 'Subiendo imagen...' : 'Haz clic para cambiar tu foto'}
          </p>
          <p className="image-preview-hint" style={{ 
            fontSize: '0.8rem',
            fontStyle: 'italic'
          }}>
          </p>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✓</span>
          {successMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información Personal</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="first_name" className={styles.label}>Nombre(s) *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className={`${styles.input} ${errors.first_name ? styles.error : ''}`}
                placeholder="Nombre(s)"
              />
              <span className={`${styles.errorMessage} ${errors.first_name ? styles.show : ''}`}>{errors.first_name || ''}</span>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="semester" className={styles.label}>Semestre *</label>
              <input
                type="number"
                id="semester"
                name="semester"
                min={1}
                max={6}
                value={form.semester}
                onChange={handleChange}
                className={`${styles.input} ${errors.semester ? styles.error : ''}`}
                placeholder="Semestre (1-6)"
              />
              <span className={`${styles.errorMessage} ${errors.semester ? styles.show : ''}`}>{errors.semester || ''}</span>
            </div>
          </div>
        </div>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Materias y Profesores</h3>
          <div>
            {loadingSubjects ? (
              <p style={{ textAlign: 'center', color: '#8bc34a', padding: '1rem' }}>Cargando materias disponibles...</p>
            ) : availableSubjects.length === 0 ? (
              <div className={styles.warningBox}>
                <p className={styles.warningBoxText}>⚠️ No hay materias disponibles. Los profesores deben registrar materias primero.</p>
              </div>
            ) : null}
            {form.subjects.map((row, idx) => (
              <div key={idx} className={styles.subjectRow}>
                <select
                  value={row.subject}
                  onChange={e => handleSubjectChange(idx, 'subject', e.target.value)}
                  className={`${styles.input} ${styles.subjectRowSelect}`}
                  disabled={availableSubjects.length === 0}
                >
                  <option value="">Selecciona una materia</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.key} value={subject.key}>
                      {subject.nombre} - Semestre {subject.semestre} (Prof. {subject.profesor})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Semestre (autocompletado)"
                  value={row.semester}
                  readOnly
                  className={`${styles.input} ${styles.subjectRowSemester}`}
                  title="El semestre se autocompleta al seleccionar la materia"
                />
                <button
                  type="button"
                  onClick={() => removeSubjectRow(idx)}
                  className={styles.subjectRowButton}
                  style={{ display: form.subjects.length > 1 ? 'flex' : 'none' }}
                  aria-label="Eliminar fila"
                >
                  –
                </button>
              </div>
            ))}
            <span className={`${styles.errorMessage} ${errors.subjects ? styles.show : ''}`}>{errors.subjects || ''}</span>
            <button 
              type="button" 
              onClick={addSubjectRow} 
              disabled={availableSubjects.length === 0}
              style={{ 
                background: '#8bc34a', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 12, 
                fontSize: '1.1rem', 
                fontWeight: 700, 
                cursor: availableSubjects.length === 0 ? 'not-allowed' : 'pointer', 
                marginTop: '1.2rem', 
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)', 
                padding: '0.8rem 1.2rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                opacity: availableSubjects.length === 0 ? 0.5 : 1
              }}>
              <span style={{ fontWeight: 700, fontSize: '1.3rem', marginRight: 8 }}>+</span> Agregar materia
            </button>
          </div>
        </div>
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => window.history.back()}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm; 