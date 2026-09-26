import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Guided breathing screen.
 */

import SessionCard from '../components/SessionCard';
import BreathingCircle from '../components/BreathingCircle';
import { ADVANCED_SESSIONS, BEGINNER_SESSIONS } from '../constants/breathingPatterns';
import {
  getTodayCompletedSessions,
  saveCompletedSession,
} from '../database/repositories/breathingRepository';

const CIRCLE_MIN_SCALE = 1;
const CIRCLE_MAX_SCALE = 1.4;

// Turns a number of seconds into "M:SS" for the countdown display.
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Works out which phase comes next (skips "hold" if the pattern has none).
function nextPhaseAfter(currentPhase, pattern) {
  if (currentPhase === 'inhale') return pattern.hold > 0 ? 'hold' : 'exhale';
  if (currentPhase === 'hold') return 'exhale';
  return 'inhale';
}

export default function BreathingScreen() {
  // activeSession: which session (from breathingPatterns.js) is currently
  // playing, or null when showing the list instead of the player.
  const [activeSession, setActiveSession] = useState(null);
  const [phase, setPhase] = useState('inhale'); // 'inhale' | 'hold' | 'exhale' - only used for display
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0); // countdown shown next to the phase name
  const [elapsedSeconds, setElapsedSeconds] = useState(0); // total seconds into the session, for the remaining-time display
  const [isPaused, setIsPaused] = useState(false);
  const [todaySessions, setTodaySessions] = useState([]); // completed sessions today, for the status line above the list

  // circleScale drives the BreathingCircle's size directly - Animated.Value
  // is a React Native class, not plain state, so it doesn't need setState.
  const circleScale = useRef(new Animated.Value(CIRCLE_MIN_SCALE)).current;
  const intervalRef = useRef(null); // holds the current setInterval id, so it can be cleared
  const sessionStartedAtRef = useRef(null); // timestamp saved when a session finishes, for the SQLite row

  // Why both state AND refs for phase/countdown/elapsed:
  // `tick()` below runs inside a setInterval closure, which only ever sees
  // the values from when the interval was created - not later updates. The
  // refs are always current (mutated directly, not through setState), so
  // `tick` reads the real numbers from the refs, then copies them into
  // state just so React re-renders the screen with the new values.
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

  // Safety net: if the user navigates away from this screen entirely while
  // a session is running, stop the timer instead of leaving it running
  // forever in the background.
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // Starts (or continues) animating the circle toward the target size for
  // the given phase. "hold" does nothing - the circle just stays put.
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

  // Runs once per second while a session is active: counts down the
  // current phase, moves to the next phase when it ends, and finishes the
  // whole session once the total duration is reached.
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

  // Sets up a brand-new session: resets all the counters (state + refs
  // together), starts the circle animating for the first "inhale" phase,
  // then starts the once-per-second timer.
  function startSession(session) {
    clearInterval(intervalRef.current); // just in case one was already running

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

  // Called only when a session completes naturally - this is the one
  // place a breathing session gets saved to SQLite.
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

  // Pause stops the interval and freezes the circle mid-animation. Resume
  // restarts both, continuing the current phase's animation for whatever
  // time is left in phaseSecondsLeftRef (not from the start of the phase).
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

  // Stops the session without saving anything - only finishSession() (a
  // natural completion) ever writes to SQLite.
  function handleCancel() {
    clearInterval(intervalRef.current);
    circleScale.stopAnimation();
    setActiveSession(null);
    setIsPaused(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Breathing</Text>

      {/* Either the session list (below) or the player (further down) is
          shown - never both, switched by whether activeSession is set. */}
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
