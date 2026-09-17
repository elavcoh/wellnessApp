import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import SessionCard from '../components/SessionCard';
import BreathingCircle from '../components/BreathingCircle';
import { ADVANCED_SESSIONS, BEGINNER_SESSIONS } from '../constants/breathingPatterns';
import {
  getTodayCompletedSessions,
  saveCompletedSession,
} from '../database/repositories/breathingRepository';

const CIRCLE_MIN_SCALE = 1;
const CIRCLE_MAX_SCALE = 1.4;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function nextPhaseAfter(currentPhase, pattern) {
  if (currentPhase === 'inhale') return pattern.hold > 0 ? 'hold' : 'exhale';
  if (currentPhase === 'hold') return 'exhale';
  return 'inhale';
}

export default function BreathingScreen() {
  const [activeSession, setActiveSession] = useState(null);
  const [phase, setPhase] = useState('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [todaySessions, setTodaySessions] = useState([]);

  const circleScale = useRef(new Animated.Value(CIRCLE_MIN_SCALE)).current;
  const intervalRef = useRef(null);
  const sessionStartedAtRef = useRef(null);

  // These mirror the state above so the setInterval callback always reads
  // the latest values - state alone is only used to trigger re-renders.
  const phaseRef = useRef('inhale');
  const phaseSecondsLeftRef = useRef(0);
  const elapsedSecondsRef = useRef(0);

  const loadTodaySessions = useCallback(async () => {
    const sessions = await getTodayCompletedSessions();
    setTodaySessions(sessions);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodaySessions();
    }, [loadTodaySessions])
  );

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  function animatePhase(nextPhase, seconds) {
    if (nextPhase === 'inhale') {
      Animated.timing(circleScale, {
        toValue: CIRCLE_MAX_SCALE,
        duration: seconds * 1000,
        useNativeDriver: true,
      }).start();
    } else if (nextPhase === 'exhale') {
      Animated.timing(circleScale, {
        toValue: CIRCLE_MIN_SCALE,
        duration: seconds * 1000,
        useNativeDriver: true,
      }).start();
    }
    // hold: leave the circle exactly where it is
  }

  function tick(session) {
    elapsedSecondsRef.current += 1;
    setElapsedSeconds(elapsedSecondsRef.current);

    if (elapsedSecondsRef.current >= session.durationSeconds) {
      finishSession(session);
      return;
    }

    phaseSecondsLeftRef.current -= 1;
    if (phaseSecondsLeftRef.current <= 0) {
      const next = nextPhaseAfter(phaseRef.current, session.pattern);
      const nextDuration = session.pattern[next];
      phaseRef.current = next;
      phaseSecondsLeftRef.current = nextDuration;
      setPhase(next);
      setPhaseSecondsLeft(nextDuration);
      animatePhase(next, nextDuration);
    } else {
      setPhaseSecondsLeft(phaseSecondsLeftRef.current);
    }
  }

  function startSession(session) {
    clearInterval(intervalRef.current);

    setActiveSession(session);
    setIsPaused(false);
    setPhase('inhale');
    setElapsedSeconds(0);
    setPhaseSecondsLeft(session.pattern.inhale);

    phaseRef.current = 'inhale';
    elapsedSecondsRef.current = 0;
    phaseSecondsLeftRef.current = session.pattern.inhale;
    sessionStartedAtRef.current = new Date().toISOString();

    circleScale.setValue(CIRCLE_MIN_SCALE);
    animatePhase('inhale', session.pattern.inhale);

    intervalRef.current = setInterval(() => tick(session), 1000);
  }

  function finishSession(session) {
    clearInterval(intervalRef.current);
    circleScale.stopAnimation();

    saveCompletedSession({
      sessionType: session.title,
      level: session.level,
      durationSeconds: session.durationSeconds,
      startedAt: sessionStartedAtRef.current,
    }).then(loadTodaySessions);

    setActiveSession(null);
  }

  function handlePauseResume() {
    if (isPaused) {
      intervalRef.current = setInterval(() => tick(activeSession), 1000);
      animatePhase(phaseRef.current, phaseSecondsLeftRef.current);
      setIsPaused(false);
    } else {
      clearInterval(intervalRef.current);
      circleScale.stopAnimation();
      setIsPaused(true);
    }
  }

  function handleCancel() {
    clearInterval(intervalRef.current);
    circleScale.stopAnimation();
    setActiveSession(null);
    setIsPaused(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Breathing</Text>

      {!activeSession && (
        <>
          <Text style={styles.statusText}>
            {todaySessions.length > 0
              ? `Breathing completed today (${todaySessions.length} session${
                  todaySessions.length > 1 ? 's' : ''
                })`
              : 'No breathing session completed today.'}
          </Text>

          <Text style={styles.sectionTitle}>Beginner</Text>
          {BEGINNER_SESSIONS.map((session) => (
            <SessionCard key={session.id} session={session} onPress={() => startSession(session)} />
          ))}

          <Text style={styles.sectionTitle}>Advanced</Text>
          {ADVANCED_SESSIONS.map((session) => (
            <SessionCard key={session.id} session={session} onPress={() => startSession(session)} />
          ))}
        </>
      )}

      {activeSession && (
        <View style={styles.player}>
          <Text style={styles.playerTitle}>{activeSession.title}</Text>
          <Text style={styles.playerTime}>
            {formatTime(activeSession.durationSeconds - elapsedSeconds)} remaining
          </Text>

          <BreathingCircle
            scale={circleScale}
            phaseLabel={`${phase.charAt(0).toUpperCase() + phase.slice(1)} · ${phaseSecondsLeft}`}
          />

          <View style={styles.controlsRow}>
            <Pressable style={styles.controlButton} onPress={handlePauseResume}>
              <Text style={styles.controlButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </Pressable>
            <Pressable style={[styles.controlButton, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.controlButtonText}>Stop</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  player: {
    alignItems: 'center',
    paddingTop: 20,
  },
  playerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  playerTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  controlButton: {
    backgroundColor: '#2f8f5b',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#c0392b',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
