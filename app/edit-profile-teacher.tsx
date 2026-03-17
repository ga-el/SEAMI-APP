/**
 * edit-profile-teacher.tsx
 * Edición de perfil del profesor — campos: nombre, apellidos, birthdate, materias+semestre, avatar
 * Coincide con la estructura de datos de complete-profile-teacher.tsx
 */
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initializeFirebase } from '../firebase-config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ThemeContext } from './_layout';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubjectRow {
  subject: string;
  semester: string;
}

interface TeacherForm {
  first_name: string;
  last_name: string;
  second_last_name: string;
  subjects: SubjectRow[];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EditProfileTeacherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeCtx = useContext(ThemeContext);
  const isDark = themeCtx?.isDarkTheme ?? true;
  const toggleTheme = themeCtx?.toggleTheme;

  const { auth, db } = initializeFirebase();

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherForm>({
    first_name:       '',
    last_name:        '',
    second_last_name: '',
    subjects:         [{ subject: '', semester: '' }],
  });

  // ── Load existing data ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) { router.replace('/login'); return; }

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists()) { setLoading(false); return; }
        const data = snap.data();
        console.log("Raw user data from Firestore on LOAD:", JSON.stringify(data, null, 2));

        // Resolve subjects — try all known schemas:
        // 1. {subject, semester} from edit-profile-teacher
        // 2. {subject} only from complete-profile-teacher (no semester per row)
        // 3. {nombre, semestre} from Astro/materias field
        let subjects: SubjectRow[] = [{ subject: '', semester: '' }];

        if (Array.isArray(data.subjects) && data.subjects.length > 0) {
          subjects = data.subjects.map((s: any) => ({
            subject:  s.subject  || s.materia  || s.nombre   || '',
            semester: s.semester || s.semestre || '',
          }));
        } else if (Array.isArray(data.materias) && data.materias.length > 0) {
          // Legacy Astro schema
          subjects = data.materias.map((m: any) => ({
            subject:  m.nombre   || m.subject  || '',
            semester: m.semestre || m.semester || '',
          }));
        }

        setForm({
          first_name:       data.first_name       || data.nombre        || '',
          last_name:        data.last_name         || data.apellidoPaterno || '',
          second_last_name: data.second_last_name  || data.apellidoMaterno || '',
          subjects,
        });
        setAvatarUrl(data.avatarUrl || null);
      } catch (e) {
        console.error('Error cargando perfil:', e);
        Alert.alert('Error', 'No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const handleChange = (key: keyof TeacherForm, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubjectChange = (idx: number, field: keyof SubjectRow, val: string) => {
    const updated = [...form.subjects];
    updated[idx] = { ...updated[idx], [field]: val };
    setForm(prev => ({ ...prev, subjects: updated }));
  };

  const addSubjectRow = () =>
    setForm(prev => ({ ...prev, subjects: [...prev.subjects, { subject: '', semester: '' }] }));

  const removeSubjectRow = (idx: number) => {
    if (form.subjects.length > 1)
      setForm(prev => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== idx) }));
  };

  // ── Image picker ───────────────────────────────────────────────────────────
  const pickImage = async () => {
    if (saving) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      // Usar el URI local como avatar (sin subir a ImgBB para no necesitar API key extra)
      setAvatarUrl(result.assets[0].uri);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.first_name.trim()) {
      Alert.alert('Campo requerido', 'El nombre es obligatorio.');
      return;
    }

    const hasValidSubject = form.subjects.some(s => s.subject.trim());
    if (!hasValidSubject) {
      Alert.alert('Materias incompletas', 'Agrega al menos una materia.');
      return;
    }

    const user = auth.currentUser;
    if (!user) { router.replace('/login'); return; }

    setSaving(true);
    try {
      const validSubjects = form.subjects.filter(s => s.subject.trim());
      const fullName = [form.first_name, form.last_name, form.second_last_name]
        .filter(Boolean).join(' ').trim();

      await updateDoc(doc(db, 'users', user.uid), {
        first_name:       form.first_name,
        last_name:        form.last_name,
        second_last_name: form.second_last_name,
        nombre:           fullName || form.first_name,
        subjects:         validSubjects,
        ...(avatarUrl ? { avatarUrl } : {}),
        updatedAt: new Date(),
      });

      Alert.alert('¡Listo!', 'Perfil actualizado correctamente.', [
        { text: 'OK', onPress: () => router.replace('/profile-teacher') },
      ]);
    } catch (e) {
      console.error('Error guardando:', e);
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  // ── Colors ─────────────────────────────────────────────────────────────────
  const bg          = isDark ? '#0f172a'                   : '#f5f7fa';
  const cardBg      = isDark ? 'rgba(255,255,255,0.06)'    : '#fff';
  const cardBorder  = isDark ? 'rgba(139,195,74,0.25)'     : 'rgba(0,0,0,0.07)';
  const inputBg     = isDark ? 'rgba(255,255,255,0.08)'    : 'rgba(0,0,0,0.03)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.18)'    : 'rgba(0,0,0,0.1)';
  const inputColor  = isDark ? '#e2e8f0'                   : '#1e293b';
  const labelColor  = isDark ? '#94a3b8'                   : '#475569';
  const textColor   = isDark ? '#e2e8f0'                   : '#1e293b';
  const placeholderColor = isDark ? '#64748b' : '#94a3b8';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[s.flex, { backgroundColor: bg }]}>
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color="#8bc34a" />
          <Text style={[s.loadingText, { color: '#8bc34a' }]}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Initials for avatar fallback ───────────────────────────────────────────
  const nameParts = form.first_name.trim().split(' ');
  const firstInitial = nameParts[0]?.charAt(0) || 'P';
  const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.charAt(0) : '';
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[s.flex, { backgroundColor: bg }]}>

        {/* ── Header ── */}
        <View
          style={[
            s.header,
            {
              paddingTop: insets.top || 16,
              backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
              borderBottomColor: isDark ? 'rgba(139,195,74,0.2)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
            <Ionicons name="arrow-back" size={22} color="#8bc34a" />
          </TouchableOpacity>
          <Text style={[s.headerLogo, { color: '#8bc34a' }]}>SEAMI</Text>
          <TouchableOpacity onPress={toggleTheme} style={s.headerBtn}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={isDark ? '#64b5f6' : '#ffa726'}
            />
          </TouchableOpacity>
        </View>

        {/* ── Scroll content ── */}
        <ScrollView
          contentContainerStyle={[s.scrollContent, { paddingTop: 80 + (insets.top || 0) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Page title ── */}
          <Text style={[s.pageTitle, { color: '#8bc34a' }]}>Editar Perfil</Text>
          <Text style={[s.pageSubtitle, { color: labelColor }]}>
            Actualiza tu información de profesor
          </Text>

          {/* ── Avatar section ── */}
          <View style={s.avatarSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={s.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatarImage} />
              ) : (
                <View style={[s.avatarFallback, { backgroundColor: 'rgba(139,195,74,0.15)' }]}>
                  <Text style={s.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={s.cameraChip}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={[s.avatarHint, { color: labelColor }]}>Toca para cambiar foto</Text>
          </View>

          {/* ── Form card ── */}
          <View
            style={[
              s.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {/* ── Section: Datos personales ── */}
            <View style={s.sectionHeader}>
              <View style={[s.sectionCircle, { backgroundColor: 'rgba(139,195,74,0.15)' }]}>
                <Ionicons name="person" size={16} color="#8bc34a" />
              </View>
              <Text style={[s.sectionTitle, { color: textColor }]}>Información Personal</Text>
            </View>

            {/* Nombre(s) */}
            <View style={s.formGroup}>
              <Text style={[s.label, { color: labelColor }]}>Nombre(s) *</Text>
              <TextInput
                style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }]}
                value={form.first_name}
                onChangeText={v => handleChange('first_name', v)}
                placeholder="Ej: Juan"
                placeholderTextColor={placeholderColor}
                returnKeyType="next"
              />
            </View>
            <View style={s.row}>
              {/* Apellido paterno */}
              <View style={s.halfGroup}>
                <Text style={[s.label, { color: labelColor }]}>Apellido Paterno</Text>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }]}
                  value={form.last_name}
                  onChangeText={v => handleChange('last_name', v)}
                  placeholder="Ej: García"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                />
              </View>
              {/* Apellido materno */}
              <View style={s.halfGroup}>
                <Text style={[s.label, { color: labelColor }]}>Apellido Materno</Text>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }]}
                  value={form.second_last_name}
                  onChangeText={v => handleChange('second_last_name', v)}
                  placeholder="Ej: López"
                  placeholderTextColor={placeholderColor}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* ── Divider ── */}
            <View style={[s.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

            {/* ── Section: Materias ── */}
            <View style={s.sectionHeader}>
              <View style={[s.sectionCircle, { backgroundColor: 'rgba(139,195,74,0.15)' }]}>
                <Ionicons name="school" size={16} color="#8bc34a" />
              </View>
              <Text style={[s.sectionTitle, { color: textColor }]}>Materias y Semestres</Text>
            </View>

            {form.subjects.map((row, idx) => (
              <View key={idx} style={s.subjectRow}>
                <View style={s.subjectInputs}>
                  <TextInput
                    style={[
                      s.subjectInput,
                      { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                    ]}
                    value={row.subject}
                    onChangeText={v => handleSubjectChange(idx, 'subject', v)}
                    placeholder="Ej. Matemáticas"
                    placeholderTextColor={placeholderColor}
                  />
                  <TextInput
                    style={[
                      s.subjectInput,
                      { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                    ]}
                    value={row.semester}
                    onChangeText={v => handleSubjectChange(idx, 'semester', v)}
                    placeholder="Semestre (ej. 3)"
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                  />
                </View>
                {form.subjects.length > 1 && (
                  <TouchableOpacity
                    style={s.removeBtn}
                    onPress={() => removeSubjectRow(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={[s.addBtn, { borderColor: '#8bc34a' }]}
              onPress={addSubjectRow}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color="#8bc34a" style={{ marginRight: 6 }} />
              <Text style={[s.addBtnText, { color: '#8bc34a' }]}>Agregar materia</Text>
            </TouchableOpacity>
          </View>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.saveBtnText}>Guardando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.saveBtnText}>Guardar cambios</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1 },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerLogo: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },

  // Scroll
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },

  // Page title
  pageTitle:    { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 4, marginTop: 8 },
  pageSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: '#8bc34a',
    overflow: 'visible', position: 'relative',
    shadowColor: '#8bc34a', shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
    marginBottom: 8,
  },
  avatarImage:    { width: 114, height: 114, borderRadius: 57 },
  avatarFallback: {
    width: 114, height: 114, borderRadius: 57,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 40, fontWeight: '800', color: '#8bc34a' },
  cameraChip: {
    position: 'absolute', bottom: 0, right: 0,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#8bc34a',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    elevation: 4,
  },
  avatarHint: { fontSize: 13 },

  // Card
  card: {
    borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },

  // Section header
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionCircle:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:   { fontSize: 15, fontWeight: '700' },
  sectionHint:    { fontSize: 13, marginBottom: 16, marginTop: -8 },

  // Form
  formGroup: { marginBottom: 16 },
  label:     { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    height: 50, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1.5, fontSize: 15,
  },
  inputIconRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 50, borderRadius: 12, borderWidth: 1.5, overflow: 'hidden',
  },
  inputIcon:    { paddingHorizontal: 12 },
  inputWithIcon: {
    flex: 1, height: '100%', fontSize: 15, paddingRight: 14,
    borderWidth: 0,
  },
  row:       { flexDirection: 'row', gap: 12, marginBottom: 16 },
  halfGroup: { flex: 1 },

  // Divider
  divider: { height: 1, marginVertical: 20, borderRadius: 1 },

  // Subjects
  subjectRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  subjectInputs: { flex: 1, gap: 8 },
  subjectInput: {
    height: 48, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1.5, fontSize: 14,
  },
  removeBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderStyle: 'dashed',
    marginTop: 4,
  },
  addBtnText: { fontSize: 15, fontWeight: '600' },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#8bc34a',
    paddingVertical: 16, borderRadius: 16,
    shadowColor: '#8bc34a', shadowOpacity: 0.35, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Loading
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:   { fontSize: 16, fontWeight: '600' },
});
