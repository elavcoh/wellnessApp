// All hold phases are short (0-4 seconds) - safe, general wellness content,
// not medical or extreme breath-holding.

export const BEGINNER_SESSIONS = [
  {
    id: 'calm-2min',
    title: '2-Minute Calm Breathing',
    description: 'A short, gentle breathing exercise to help you relax.',
    level: 'Beginner',
    durationSeconds: 120,
    pattern: { inhale: 4, hold: 0, exhale: 6 },
  },
  {
    id: 'diaphragmatic',
    title: 'Diaphragmatic Breathing',
    description: 'Slow belly breathing with a brief hold to build awareness.',
    level: 'Beginner',
    durationSeconds: 180,
    pattern: { inhale: 4, hold: 2, exhale: 6 },
  },
  {
    id: 'slow-breathing',
    title: 'Slow Breathing',
    description: 'Even, unhurried breaths to slow your pace down.',
    level: 'Beginner',
    durationSeconds: 180,
    pattern: { inhale: 5, hold: 0, exhale: 5 },
  },
  {
    id: 'before-sleep',
    title: 'Before Sleep',
    description: 'Longer exhales to help you wind down before bed.',
    level: 'Beginner',
    durationSeconds: 240,
    pattern: { inhale: 4, hold: 0, exhale: 8 },
  },
];

export const ADVANCED_SESSIONS = [
  {
    id: 'focus-breathing',
    title: 'Focus Breathing',
    description: 'Balanced inhale, hold, and exhale to sharpen focus.',
    level: 'Advanced',
    durationSeconds: 300,
    pattern: { inhale: 4, hold: 4, exhale: 4 },
  },
  {
    id: 'recovery-breathing',
    title: 'Recovery Breathing',
    description: 'A calming pattern to help you recover after activity.',
    level: 'Advanced',
    durationSeconds: 300,
    pattern: { inhale: 5, hold: 3, exhale: 7 },
  },
  {
    id: 'longer-controlled',
    title: 'Longer Controlled Breathing',
    description: 'An extended session with a short hold for deeper control.',
    level: 'Advanced',
    durationSeconds: 360,
    pattern: { inhale: 4, hold: 4, exhale: 6 },
  },
];
