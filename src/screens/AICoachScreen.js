import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * AICoachScreen.js
 *
 * Purpose: Lets the user ask wellness questions (suggested or typed) and
 * shows the AI's answer, recommendations, and any missing information.
 * The AI Coach only answers wellness questions - unrelated questions get a
 * fixed refusal message from the backend.
 * Related to: one of the 6 main tabs. Uses wellnessContextBuilder.js to
 * gather today's data before every question.
 */

import RecommendationCard from '../components/RecommendationCard';
import { buildTodayContext } from '../services/wellnessContextBuilder';
import { getWellnessAdvice } from '../services/aiService';

// Buttons shown above the text input, so the user can tap instead of typing.
// Tapping one just calls handleAsk with this exact text.
const SUGGESTED_QUESTIONS = [
  'What should I focus on today?',
  'Should I walk more today?',
  'What should I eat after my workout?',
  'Which breathing session would fit my day?',
  'Give me a short wellness summary.',
];

// Turns the raw workout.status value from SQLite ("not_started" etc.)
// into text a user can read.
const WORKOUT_STATUS_TEXT = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export default function AICoachScreen() {
  // contextSummary: today's data (steps, meals, workout, breathing), shown
  // in the small summary box at the top. Refreshed every time the screen
  // is opened, so it reflects the latest state even if the user just came
  // back from logging a meal in another tab.
  const [contextSummary, setContextSummary] = useState(null);

  // customQuestion: whatever the user is currently typing in the text box.
  const [customQuestion, setCustomQuestion] = useState('');

  // status: which part of the "ask a question" flow we're in right now.
  //   idle    - nothing asked yet, or after a fresh screen load
  //   loading - waiting for the backend/AI to respond
  //   done    - got a result back, ok to show it
  //   error   - the request failed (network/backend/AI down)
  const [status, setStatus] = useState('idle');

  // result: the AI Coach's last answer (see the shape returned by
  // getWellnessAdvice - answer, recommendations, missing_information, etc.)
  const [result, setResult] = useState(null);

  // Goes up by one for every question asked. When an answer arrives, it's
  // only shown if no newer question was asked in the meantime - so the
  // screen always shows the answer to the LAST question, even if an older
  // one happens to come back later.
  const latestQuestionRef = useRef(0);

  // Re-reads today's data from SQLite and stores it in contextSummary, just
  // for display in the summary box (this is separate from the context sent
  // with an actual question - see handleAsk below).
  const loadContextSummary = useCallback(async () => {
    const context = await buildTodayContext();
    setContextSummary(context);
  }, []);

  // Runs every time this tab becomes visible (not just once on mount), so
  // the summary box is never stale after switching tabs.
  useFocusEffect(
    useCallback(() => {
      loadContextSummary();
    }, [loadContextSummary])
  );

  // Called both when a suggested-question button is tapped and when the
  // user submits their own typed question - both paths lead here.
  async function handleAsk(question) {
    const trimmed = question.trim();
    if (!trimmed) return; // ignore empty taps (e.g. blank custom question)

    const questionId = latestQuestionRef.current + 1;
    latestQuestionRef.current = questionId;
    setStatus('loading');
    setResult(null); // clear the previous answer so it doesn't flash on screen
    try {
      // Build a brand-new context right now, not the one already sitting in
      // contextSummary - the user may have logged something a moment ago,
      // and the AI must see the real current state, not a stale snapshot.
      const context = await buildTodayContext();
      const advice = await getWellnessAdvice(trimmed, context);
      if (questionId !== latestQuestionRef.current) return; // a newer question was asked - ignore this answer
      setResult(advice);
      setStatus('done');
    } catch (error) {
      // Network down, backend not running, or OpenAI failed - show a
      // friendly message instead of crashing (see the status === 'error' text below).
      if (questionId !== latestQuestionRef.current) return; // an old question failed - the newer one is still loading
      setStatus('error');
    }
  }

  // Pull out just the pieces of contextSummary the summary box needs to
  // display. The "?." everywhere is because contextSummary is null until
  // loadContextSummary finishes its first run.
  const steps = contextSummary?.today?.steps;
  const mealsCount = contextSummary?.today?.meals?.length ?? 0;
  const workoutStatus = contextSummary?.today?.workout?.status;
  const breathingCount = contextSummary?.today?.breathing?.sessions_completed ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI Coach</Text>
      <Text style={styles.subtitle}>
        Recommendations below are based only on what you've actually logged in the app today.
      </Text>

      {/* Quick read-only snapshot of today - "steps" is undefined until
          contextSummary loads, so falls back to "No data yet" instead of
          showing 0 (which would wrongly look like a measured zero). */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryLine}>
          Steps:{' '}
          {steps
            ? `${steps.count.toLocaleString()} / ${steps.goal?.toLocaleString() ?? '—'}`
            : 'No data yet'}
        </Text>
        <Text style={styles.summaryLine}>Meals logged: {mealsCount}</Text>
        <Text style={styles.summaryLine}>
          Workout: {workoutStatus ? WORKOUT_STATUS_TEXT[workoutStatus] : 'None planned'}
        </Text>
        <Text style={styles.summaryLine}>
          Breathing: {breathingCount} session{breathingCount === 1 ? '' : 's'}
        </Text>
      </View>

      {/* One button per entry in SUGGESTED_QUESTIONS - tapping any of them
          just runs handleAsk with that exact question text. */}
      <Text style={styles.sectionTitle}>Suggested Questions</Text>
      {SUGGESTED_QUESTIONS.map((question) => (
        <Pressable
          key={question}
          style={styles.suggestionButton}
          onPress={() => handleAsk(question)}
        >
          <Text style={styles.suggestionText}>{question}</Text>
        </Pressable>
      ))}

      {/* Free-text alternative to the suggested-question buttons above. */}
      <Text style={styles.sectionTitle}>Ask Your Own Question</Text>
      <TextInput
        style={styles.input}
        value={customQuestion}
        onChangeText={setCustomQuestion}
        placeholder="Type a question..."
      />
      <Pressable style={styles.askButton} onPress={() => handleAsk(customQuestion)}>
        <Text style={styles.askButtonText}>Ask</Text>
      </Pressable>

      {/* Below here: only one of these three blocks is ever visible at a
          time, controlled by the `status` state set in handleAsk. */}
      {status === 'loading' && <ActivityIndicator size="large" style={styles.loading} />}

      {status === 'error' && (
        <Text style={styles.errorText}>
          Couldn't reach the wellness coach. Check that the backend is running, then try again.
        </Text>
      )}

      {status === 'done' && result && (
        <View style={styles.resultBox}>
          <Text style={styles.answerText}>{result.answer}</Text>

          {/* For an off-topic question, the backend already forces this
              array to be empty, so this section simply won't render - no
              extra check needed here for that case. */}
          {result.recommendations.length > 0 && (
            <>
              <Text style={styles.resultSectionTitle}>Recommendations</Text>
              {result.recommendations.map((recommendation, index) => (
                <RecommendationCard key={index} recommendation={recommendation} />
              ))}
            </>
          )}

          {/* Things the AI would have needed to answer more fully but
              weren't found in today's data - it's told never to guess
              these, so it lists them honestly instead. */}
          {result.missing_information.length > 0 && (
            <>
              <Text style={styles.resultSectionTitle}>Missing Information</Text>
              {result.missing_information.map((item, index) => (
                <Text key={index} style={styles.missingItem}>
                  • {item}
                </Text>
              ))}
            </>
          )}
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  summaryBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  summaryLine: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  suggestionButton: {
    borderWidth: 1,
    borderColor: '#2f8f5b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  suggestionText: {
    color: '#2f8f5b',
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  askButton: {
    backgroundColor: '#2f8f5b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  askButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    marginTop: 24,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  resultBox: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 8,
  },
  resultSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
  },
  missingItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
});
