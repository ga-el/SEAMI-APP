import React, { useState } from 'react';
import styles from './EditProfileFormStudent.module.css';

const EditProfileFormStudent = () => {
  const [formData, setFormData] = useState({
    profilePhoto: 'https://i.pravatar.cc/150?img=32',
    nombre: 'Ana Sofía Rodríguez',
    username: 'ana_sofia',
    bio: 'Estudiante de prepa apasionada por la ciencia y la tecnología. 🚀',
    escuela: 'Preparatoria No. 5',
    grado: '5to Semestre',
    materias: 'Cálculo, Física, Química',
    email: 'ana.sofia@email.com',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, profilePhoto: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Mostrar animación de éxito por 2 segundos y luego redirigir
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className={styles.successContainer}>
        {/* Partículas de fondo */}
        <div className={styles.particles}>
          {[...Array(20)].map((_, i) => (
            <div key={i} className={styles.particle} style={{
              '--delay': `${i * 0.1}s`,
              '--position': `${Math.random() * 100}%`
            }}></div>
          ))}
        </div>
        
        {/* Confeti */}
        <div className={styles.confetti}>
          {[...Array(15)].map((_, i) => (
            <div key={i} className={styles.confettiPiece} style={{
              '--delay': `${i * 0.2}s`,
              '--left': `${Math.random() * 100}%`,
              '--color': ['#8bc34a', '#6aab3b', '#4caf50', '#45a049'][Math.floor(Math.random() * 4)]
            }}></div>
          ))}
        </div>

        <div className={styles.successAnimation}>
          {/* Círculo de fondo animado */}
          <div className={styles.backgroundCircle}></div>
          
          {/* Checkmark principal */}
          <div className={styles.checkmark}>
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" className={styles.checkmarkCircle}></circle>
              <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" className={styles.checkmarkCheck}></path>
            </svg>
          </div>

          {/* Círculos decorativos */}
          <div className={styles.decorativeCircles}>
            <div className={styles.decorativeCircle}></div>
            <div className={styles.decorativeCircle}></div>
            <div className={styles.decorativeCircle}></div>
          </div>

          <h2 className={styles.successTitle}>¡Perfil Actualizado!</h2>
          <p className={styles.successMessage}>Redirigiendo al dashboard...</p>
          
          {/* Barra de progreso */}
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Editar Perfil</h2>
        <p className={styles.subtitle}>Personaliza tu perfil de estudiante</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.profileSection}>
          <div className={styles.profilePicContainer}>
            <img src={formData.profilePhoto} alt="Foto de perfil" className={styles.profilePic} />
            <div className={styles.profilePicOverlay}>
              <label htmlFor="profile-photo-input" className={styles.changePicButton}>
                📷
              </label>
            </div>
          </div>
          <input
            id="profile-photo-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información Básica</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre" className={styles.label}>Nombre Completo</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Tu nombre completo"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Tu nombre de usuario"
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Sobre mí</h3>
          <div className={styles.formGroup}>
            <label htmlFor="bio" className={styles.label}>Biografía</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className={styles.textarea}
              placeholder="Cuéntanos algo sobre ti, tus intereses y metas..."
              rows="3"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información Académica</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="escuela" className={styles.label}>Escuela</label>
              <input
                id="escuela"
                name="escuela"
                type="text"
                value={formData.escuela}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Nombre de tu escuela"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="grado" className={styles.label}>Grado/Semestre</label>
              <input
                id="grado"
                name="grado"
                type="text"
                value={formData.grado}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Ej: 5to Semestre"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="materias" className={styles.label}>Materias de Interés</label>
              <input
                id="materias"
                name="materias"
                type="text"
                value={formData.materias}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Cálculo, Física, etc."
              />
            </div>
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
            disabled={isSubmitting}
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

export default EditProfileFormStudent; 