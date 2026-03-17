/**
 * ZenModeScreen – ported from the web ZenApp.jsx
 * Features: Breathing 4-7-8 | Pomodoro | Micro-activities | Audio player
 * All icons use Ionicons (vector SVGs – no emojis)
 */
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../_layout';

// ─── Types ────────────────────────────────────────────────────────────────────
type BreathingPhase = 'inhale' | 'hold' | 'exhale';
type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Track {
  title: string;
  artist: string;
  cover: string;
  src: string;
}

interface MicroActivity {
  icon: IoniconsName;
  iconColor: string;
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BREATHING_PHASES: { name: BreathingPhase; duration: number; label: string }[] = [
  { name: 'inhale', duration: 4,  label: 'Inhala profundamente' },
  { name: 'hold',   duration: 7,  label: 'Mantén la respiración' },
  { name: 'exhale', duration: 8,  label: 'Exhala lentamente' },
];

const POMODORO_TIMES: Record<PomodoroPhase, number> = {
  focus:      25 * 60,
  shortBreak:  5 * 60,
  longBreak:  15 * 60,
};

const POMODORO_PHASE_INFO: Record<
  PomodoroPhase,
  { icon: IoniconsName; label: string; color: string }
> = {
  focus:      { icon: 'flash',  label: 'Enfoque',         color: '#e74c3c' },
  shortBreak: { icon: 'cafe',   label: 'Descanso corto',  color: '#27ae60' },
  longBreak:  { icon: 'sunny',  label: 'Descanso largo',  color: '#f39c12' },
};

const MICRO_ACTIVITIES: MicroActivity[] = [
  { icon: 'body',           iconColor: '#8bc34a', message: 'Respira profundo: inhala 4s, exhala 6s' },
  { icon: 'leaf',           iconColor: '#4caf50', message: 'Estírate como una planta hacia el sol' },
  { icon: 'sparkles',       iconColor: '#ab47bc', message: 'Piensa en algo que te hizo sonreír hoy' },
  { icon: 'cloudy',         iconColor: '#64b5f6', message: 'Mira por la ventana 30 segundos' },
  { icon: 'brush',          iconColor: '#ff7043', message: 'Haz un doodle rápido en tu libreta' },
  { icon: 'water',          iconColor: '#29b6f6', message: 'Estírate profundamente y libera tensión' },
  { icon: 'musical-notes',  iconColor: '#66bb6a', message: 'Escucha el sonido a tu alrededor' },
  { icon: 'happy',          iconColor: '#ffa726', message: '¡Recuerda: nadie es perfecto, y está bien!' },
  { icon: 'boat',           iconColor: '#42a5f5', message: 'Imagina que eres una ola en el océano' },
  { icon: 'eye',            iconColor: '#7e57c2', message: 'Tómate un momento para observar' },
];

const PLAYLIST: Track[] = [
  {
    title:  'Lluvia Relajante',
    artist: 'SEAMI Zen',
    cover:  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=200&fit=crop&crop=center',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    title:  'Bosque Tranquilo',
    artist: 'SEAMI Zen',
    cover:  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop&crop=center',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    title:  'Cafetería Zen',
    artist: 'SEAMI Zen',
    cover:  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&crop=center',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    title:  'Viento Suave',
    artist: 'SEAMI Zen',
    cover:  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    title:  'Lo-fi Beats',
    artist: 'SEAMI Zen',
    cover:  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=center',
    src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Reusable card-header icon ─────────────────────────────────────────────────
function CardIcon({
  name,
  color = '#8bc34a',
  size = 22,
}: {
  name: IoniconsName;
  color?: string;
  size?: number;
}) {
  return (
    <View style={[ss.iconCircle, { backgroundColor: `${color}22` }]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ZenModeScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const themeCtx   = useContext(ThemeContext);
  const isDark     = themeCtx?.isDarkTheme ?? true;
  const toggleTheme = themeCtx?.toggleTheme;

  // ── Breathing ───────────────────────────────────────────────────────────────
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase]   = useState(0);
  const [breathingCount, setBreathingCount]   = useState(BREATHING_PHASES[0].duration);
  const breathingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animRef   = useRef<Animated.CompositeAnimation | null>(null);

  const startBreathingAnim = (phaseIdx: number) => {
    animRef.current?.stop();
    const target = phaseIdx === 0 ? 1.4 : phaseIdx === 1 ? 1.4 : 1;
    const dur    = BREATHING_PHASES[phaseIdx].duration * 1000;
    animRef.current = Animated.timing(scaleAnim, {
      toValue: target,
      duration: dur,
      easing: phaseIdx === 2 ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
      useNativeDriver: true,
    });
    animRef.current.start();
  };

  useEffect(() => {
    if (breathingActive) {
      let pIdx = 0, cnt = BREATHING_PHASES[0].duration;
      setBreathingPhase(0);
      setBreathingCount(cnt);
      startBreathingAnim(0);

      breathingInterval.current = setInterval(() => {
        cnt--;
        setBreathingCount(cnt);
        if (cnt === 0) {
          pIdx = (pIdx + 1) % 3;
          cnt  = BREATHING_PHASES[pIdx].duration;
          setBreathingPhase(pIdx);
          setBreathingCount(cnt);
          startBreathingAnim(pIdx);
        }
      }, 1000);
    } else {
      if (breathingInterval.current) clearInterval(breathingInterval.current);
      animRef.current?.stop();
      Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      setBreathingPhase(0);
      setBreathingCount(BREATHING_PHASES[0].duration);
    }
    return () => { if (breathingInterval.current) clearInterval(breathingInterval.current); };
  }, [breathingActive]);

  // Circle color by phase
  const phaseColors = ['#8bc34a', '#64b5f6', '#f06292'];
  const circleColor = breathingActive ? phaseColors[breathingPhase] : '#8bc34a';

  // ── Pomodoro ────────────────────────────────────────────────────────────────
  const [pomodoroPhase,  setPomodoroPhase]  = useState<PomodoroPhase>('focus');
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroPaused, setPomodoroPaused] = useState(false);
  const [timeLeft,  setTimeLeft]  = useState(POMODORO_TIMES.focus);
  const [cycle, setCycle] = useState(1);
  const pomodoroInterval  = useRef<ReturnType<typeof setInterval> | null>(null);
  const pomodoroPhaseRef  = useRef(pomodoroPhase);
  const cycleRef          = useRef(cycle);
  pomodoroPhaseRef.current = pomodoroPhase;
  cycleRef.current         = cycle;

  useEffect(() => {
    if (pomodoroActive && !pomodoroPaused) {
      pomodoroInterval.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            const cur = pomodoroPhaseRef.current;
            let nextPhase: PomodoroPhase;
            let nextCycle = cycleRef.current;
            if (cur === 'focus') {
              nextCycle++;
              if (nextCycle > 4) { setPomodoroActive(false); setCycle(1); return POMODORO_TIMES.focus; }
              setCycle(nextCycle);
              nextPhase = nextCycle % 4 === 0 ? 'longBreak' : 'shortBreak';
            } else {
              nextPhase = 'focus';
            }
            setPomodoroPhase(nextPhase);
            return POMODORO_TIMES[nextPhase];
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomodoroInterval.current) clearInterval(pomodoroInterval.current);
    }
    return () => { if (pomodoroInterval.current) clearInterval(pomodoroInterval.current); };
  }, [pomodoroActive, pomodoroPaused]);

  const handlePomodoroToggle = () => {
    if (!pomodoroActive) {
      setPomodoroActive(true);
      setPomodoroPaused(false);
      setTimeLeft(POMODORO_TIMES[pomodoroPhase]);
      setCycle(1);
    } else if (pomodoroPaused) {
      setPomodoroPaused(false);
    } else {
      setPomodoroPaused(true);
    }
  };

  const handlePomodoroStop = () => {
    setPomodoroActive(false);
    setPomodoroPaused(false);
    setTimeLeft(POMODORO_TIMES.focus);
    setPomodoroPhase('focus');
    setCycle(1);
  };

  const pomodoroProgress = 1 - timeLeft / POMODORO_TIMES[pomodoroPhase];
  const phaseInfo        = POMODORO_PHASE_INFO[pomodoroPhase];

  // ── Micro-activities ────────────────────────────────────────────────────────
  const [microIdx, setMicroIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMicroIdx(i => (i + 1) % MICRO_ACTIVITIES.length), 30000);
    return () => clearInterval(id);
  }, []);
  const micro = MICRO_ACTIVITIES[microIdx];

  // ── Audio player ─────────────────────────────────────────────────────────────
  const soundRef       = useRef<Audio.Sound | null>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [audioProgress,setAudioProgress]= useState(0);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [audioDuration,setAudioDuration]= useState(0);
  const [volume,       setVolume]       = useState(0.7);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      setAudioProgress(0); setCurrentTime(0); setAudioDuration(0);
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: PLAYLIST[currentTrack].src },
          { volume, shouldPlay: false },
          (status) => {
            if (!mounted || !status.isLoaded) return;
            if (status.durationMillis) setAudioDuration(Math.floor(status.durationMillis / 1000));
            if (status.positionMillis && status.durationMillis) {
              setCurrentTime(Math.floor(status.positionMillis / 1000));
              setAudioProgress(status.positionMillis / status.durationMillis);
            }
            if (status.didJustFinish) setCurrentTrack(t => (t + 1) % PLAYLIST.length);
          }
        );
        soundRef.current = sound;
        if (isPlayingRef.current) await sound.playAsync();
      } catch (e) { console.error('Audio load error:', e); }
    };
    load();
    return () => { mounted = false; };
  }, [currentTrack]);

  const togglePlay = async () => {
    if (!soundRef.current) return;
    if (isPlaying) { await soundRef.current.pauseAsync(); setIsPlaying(false); }
    else           { await soundRef.current.playAsync();  setIsPlaying(true); }
  };

  const prevTrack = () => setCurrentTrack(t => (t - 1 + PLAYLIST.length) % PLAYLIST.length);
  const nextTrack = () => setCurrentTrack(t => (t + 1) % PLAYLIST.length);

  const handleVolumeChange = async (delta: number) => {
    const v = Math.max(0, Math.min(1, volume + delta));
    setVolume(v);
    if (soundRef.current) await soundRef.current.setVolumeAsync(v);
  };

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  // ── Colors ──────────────────────────────────────────────────────────────────
  const bg           = isDark ? ['#0f172a', '#1a1a2e'] as const : ['#f0f9ff', '#e0f2fe'] as const;
  const cardBg       = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)';
  const cardBorder   = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.06)';
  const textPrimary  = isDark ? '#e2e8f0' : '#1e293b';
  const textSecondary= isDark ? '#94a3b8' : '#64748b';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={bg} style={ss.fullScreen}>

        {/* Floating particles */}
        {[...Array(18)].map((_, i) => (
          <View
            key={i}
            style={[
              ss.particle,
              {
                left: `${(i * 5.55) % 100}%`,
                top:  `${(i * 7.7 ) % 100}%`,
                width:  3 + (i % 4),
                height: 3 + (i % 4),
                backgroundColor: isDark
                  ? 'rgba(139,195,74,0.2)'
                  : 'rgba(100,180,255,0.25)',
              },
            ]}
          />
        ))}

        {/* ── Header ── */}
        <View
          style={[
            ss.header,
            {
              paddingTop: insets.top || 16,
              backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)',
              borderBottomColor: isDark ? 'rgba(139,195,74,0.2)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={ss.headerBtn}>
            <Ionicons name="arrow-back" size={22} color="#8bc34a" />
          </TouchableOpacity>

          <View style={ss.headerCenter}>
            {/* Leaf logo */}
            <View style={[ss.headerLogoCircle, { backgroundColor: 'rgba(139,195,74,0.15)' }]}>
              <Ionicons name="leaf" size={18} color="#8bc34a" />
            </View>
            <Text style={ss.headerTitle}>SEAMI ZEN</Text>
          </View>

          <TouchableOpacity onPress={toggleTheme} style={ss.headerBtn}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={isDark ? '#64b5f6' : '#ffa726'}
            />
          </TouchableOpacity>
        </View>

        {/* ── Scroll ── */}
        <ScrollView
          contentContainerStyle={[ss.scrollContent, { paddingTop: 80 + (insets.top || 0) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={ss.hero}>
            <Text style={[ss.heroTitle, { color: '#8bc34a' }]}>Tu espacio de calma</Text>
            <Text style={[ss.heroSub, { color: textSecondary }]}>
              Encuentra equilibrio y serenidad en cada respiración
            </Text>
          </View>

          {/* ── 1. Breathing card ── */}
          <View style={[ss.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={ss.cardHeader}>
              <CardIcon name="body" color="#8bc34a" />
              <Text style={[ss.cardTitle, { color: textPrimary }]}>
                Ejercicio de Respiración 4-7-8
              </Text>
            </View>

            {/* Animated circle */}
            <View style={ss.breathingVisual}>
              <Animated.View
                style={[
                  ss.breathingCircleOuter,
                  { borderColor: circleColor, transform: [{ scale: scaleAnim }] },
                ]}
              >
                <View
                  style={[
                    ss.breathingCircleInner,
                    { backgroundColor: `${circleColor}22`, borderColor: `${circleColor}66` },
                  ]}
                >
                  {breathingActive ? (
                    <>
                      <Text style={[ss.breathingCount, { color: circleColor }]}>
                        {breathingCount}
                      </Text>
                      <Text style={[ss.breathingPhaseLabel, { color: textSecondary }]}>
                        {breathingPhase === 0 ? 'inhala' : breathingPhase === 1 ? 'mantén' : 'exhala'}
                      </Text>
                    </>
                  ) : (
                    <Ionicons name="body" size={52} color="#8bc34a" />
                  )}
                </View>
              </Animated.View>

              <Text style={[ss.breathingInstruction, { color: textSecondary }]}>
                {breathingActive
                  ? `${BREATHING_PHASES[breathingPhase].label} (${breathingCount}s)`
                  : 'Inhala 4 — Mantén 7 — Exhala 8'}
              </Text>
            </View>

            <TouchableOpacity
              style={[ss.primaryBtn, { backgroundColor: breathingActive ? '#64748b' : '#8bc34a' }]}
              onPress={() => setBreathingActive(a => !a)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={breathingActive ? 'pause' : 'play'}
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={ss.primaryBtnText}>{breathingActive ? 'Pausar' : 'Iniciar'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── 2. Pomodoro card ── */}
          <View style={[ss.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={ss.cardHeader}>
              <CardIcon name="alarm" color="#e74c3c" />
              <Text style={[ss.cardTitle, { color: textPrimary }]}>Modo Enfoque</Text>
            </View>

            <Text style={[ss.pomodoroTimer, { color: textPrimary }]}>{formatTime(timeLeft)}</Text>

            {/* Progress bar */}
            <View style={ss.progressTrack}>
              <View
                style={[
                  ss.progressBar,
                  { width: `${pomodoroProgress * 100}%`, backgroundColor: phaseInfo.color },
                ]}
              />
            </View>

            {/* Phase info */}
            <View style={ss.phaseRow}>
              <View style={[ss.phaseIconCircle, { backgroundColor: `${phaseInfo.color}22` }]}>
                <Ionicons name={phaseInfo.icon} size={16} color={phaseInfo.color} />
              </View>
              <Text style={[ss.phaseRowText, { color: textPrimary }]}>{phaseInfo.label}</Text>
              <View style={[ss.cycleBadge, { backgroundColor: `${phaseInfo.color}22` }]}>
                <Text style={[ss.cycleBadgeText, { color: phaseInfo.color }]}>
                  Ciclo {cycle}/4
                </Text>
              </View>
            </View>

            {/* Controls */}
            <View style={ss.pomodoroControls}>
              <TouchableOpacity
                style={[
                  ss.primaryBtn,
                  {
                    flex: 1,
                    backgroundColor:
                      pomodoroActive && !pomodoroPaused ? '#f39c12' : '#8bc34a',
                  },
                ]}
                onPress={handlePomodoroToggle}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={!pomodoroActive ? 'rocket' : pomodoroPaused ? 'play' : 'pause'}
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={ss.primaryBtnText}>
                  {!pomodoroActive
                    ? 'Enfocar ahora'
                    : pomodoroPaused
                    ? 'Reanudar'
                    : 'Pausar'}
                </Text>
              </TouchableOpacity>

              {pomodoroActive && (
                <TouchableOpacity style={ss.stopBtn} onPress={handlePomodoroStop}>
                  <Ionicons name="stop" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── 3. Micro-activity card ── */}
          <View
            style={[
              ss.card,
              ss.microCard,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={[ss.iconCircle, { backgroundColor: `${micro.iconColor}22`, width: 56, height: 56 }]}>
              <Ionicons name={micro.icon} size={30} color={micro.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ss.microLabel, { color: textSecondary }]}>Actividad zen</Text>
              <Text style={[ss.microMessage, { color: textPrimary }]}>{micro.message}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setMicroIdx(i => (i + 1) % MICRO_ACTIVITIES.length)}
              style={ss.refreshBtn}
            >
              <Ionicons name="refresh" size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── 4. Audio player card ── */}
          <View style={[ss.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={ss.cardHeader}>
              <CardIcon name="musical-notes" color="#9c27b0" />
              <Text style={[ss.cardTitle, { color: textPrimary }]}>Sonidos Relajantes</Text>
            </View>

            {/* Now playing */}
            <View style={ss.playerMain}>
              <Image
                source={{ uri: PLAYLIST[currentTrack].cover }}
                style={ss.albumCover}
                contentFit="cover"
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[ss.trackTitle, { color: textPrimary }]} numberOfLines={1}>
                  {PLAYLIST[currentTrack].title}
                </Text>
                <Text style={[ss.trackArtist, { color: textSecondary }]}>
                  {PLAYLIST[currentTrack].artist}
                </Text>

                {/* Controls */}
                <View style={ss.playerControls}>
                  <TouchableOpacity onPress={prevTrack} style={ss.controlBtn}>
                    <Ionicons name="play-skip-back" size={22} color="#8bc34a" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={togglePlay} style={[ss.controlBtn, ss.playBtn]}>
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={nextTrack} style={ss.controlBtn}>
                    <Ionicons name="play-skip-forward" size={22} color="#8bc34a" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Audio progress */}
            <View style={ss.audioProgressRow}>
              <Text style={[ss.audioTime, { color: textSecondary }]}>{formatTime(currentTime)}</Text>
              <View style={ss.audioProgressTrack}>
                <View style={[ss.audioProgressBar, { width: `${audioProgress * 100}%` }]} />
              </View>
              <Text style={[ss.audioTime, { color: textSecondary }]}>{formatTime(audioDuration)}</Text>
            </View>

            {/* Volume */}
            <View style={ss.volumeRow}>
              <Ionicons name="volume-low"  size={16} color={textSecondary} />
              <TouchableOpacity onPress={() => handleVolumeChange(-0.1)} style={ss.volBtn}>
                <Ionicons name="remove" size={14} color={textSecondary} />
              </TouchableOpacity>
              <View style={ss.volumeTrack}>
                <View style={[ss.volumeFill, { width: `${volume * 100}%` }]} />
              </View>
              <TouchableOpacity onPress={() => handleVolumeChange(0.1)} style={ss.volBtn}>
                <Ionicons name="add" size={14} color={textSecondary} />
              </TouchableOpacity>
              <Ionicons name="volume-high" size={16} color={textSecondary} />
            </View>

            {/* Playlist */}
            <View style={ss.playlist}>
              {PLAYLIST.map((track, idx) => {
                const active = idx === currentTrack;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      ss.playlistItem,
                      {
                        backgroundColor: active
                          ? 'rgba(139,195,74,0.13)'
                          : 'transparent',
                        borderColor: active
                          ? 'rgba(139,195,74,0.35)'
                          : 'transparent',
                      },
                    ]}
                    onPress={() => setCurrentTrack(idx)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: track.cover }}
                      style={ss.playlistCover}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          ss.playlistTitle,
                          { color: active ? '#8bc34a' : textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <Text style={[ss.playlistArtist, { color: textSecondary }]}>
                        {track.artist}
                      </Text>
                    </View>
                    {active && isPlaying && (
                      <Ionicons name="volume-medium" size={16} color="#8bc34a" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </LinearGradient>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  fullScreen: { flex: 1 },
  particle:   { position: 'absolute', borderRadius: 99 },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogoCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: '800', color: '#8bc34a', letterSpacing: 1,
  },

  // Scroll / hero
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  hero:      { alignItems: 'center', marginBottom: 24 },
  heroTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  heroSub:   { fontSize: 14, textAlign: 'center' },

  // Card
  card: {
    borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardTitle:  { fontSize: 16, fontWeight: '700', flex: 1 },

  // Reusable icon circle
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  // Breathing
  breathingVisual: { alignItems: 'center', marginBottom: 20 },
  breathingCircleOuter: {
    width: 160, height: 160, borderRadius: 80, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  breathingCircleInner: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  breathingCount:       { fontSize: 40, fontWeight: '800' },
  breathingPhaseLabel:  { fontSize: 13, marginTop: 2 },
  breathingInstruction: { fontSize: 14, textAlign: 'center' },

  // Buttons
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, paddingHorizontal: 24, borderRadius: 50,
    shadowColor: '#8bc34a', shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  stopBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#e74c3c',
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
    shadowColor: '#e74c3c', shadowOpacity: 0.25, shadowRadius: 6, elevation: 2,
  },

  // Pomodoro
  pomodoroTimer: {
    fontSize: 56, fontWeight: '800', textAlign: 'center',
    letterSpacing: 2, marginBottom: 12,
  },
  progressTrack: {
    height: 6, backgroundColor: 'rgba(139,195,74,0.15)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 12,
  },
  progressBar: { height: '100%', borderRadius: 3 },
  phaseRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  phaseIconCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseRowText:    { flex: 1, fontSize: 14, fontWeight: '600' },
  cycleBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cycleBadgeText:  { fontSize: 12, fontWeight: '700' },
  pomodoroControls:{ flexDirection: 'row', alignItems: 'center' },

  // Micro-activity
  microCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  microLabel:   { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  microMessage: { fontSize: 15, fontWeight: '500', lineHeight: 20 },
  refreshBtn:   { padding: 6 },

  // Player
  playerMain:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  albumCover:      { width: 72, height: 72, borderRadius: 14 },
  trackTitle:      { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  trackArtist:     { fontSize: 13, marginBottom: 10 },
  playerControls:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  controlBtn:      { padding: 6 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#8bc34a',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8bc34a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  audioProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  audioTime:        { fontSize: 12, minWidth: 36 },
  audioProgressTrack: {
    flex: 1, height: 4, backgroundColor: 'rgba(139,195,74,0.2)',
    borderRadius: 2, overflow: 'hidden',
  },
  audioProgressBar: { height: '100%', backgroundColor: '#8bc34a', borderRadius: 2 },
  volumeRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  volBtn:     { padding: 4 },
  volumeTrack: {
    flex: 1, height: 4, backgroundColor: 'rgba(139,195,74,0.2)',
    borderRadius: 2, overflow: 'hidden',
  },
  volumeFill: { height: '100%', backgroundColor: '#8bc34a', borderRadius: 2 },

  // Playlist
  playlist:       { gap: 4 },
  playlistItem:   {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 12, borderWidth: 1,
  },
  playlistCover:  { width: 40, height: 40, borderRadius: 8 },
  playlistTitle:  { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  playlistArtist: { fontSize: 12 },
});