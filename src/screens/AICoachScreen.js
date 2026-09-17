import { useCallback, useState } from 'react';
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

import RecommendationCard from '../components/RecommendationCard';
import { buildTodayContext } from '../services/wellnessContextBuilder';
import { getWellnessAdvice } from '../services/aiService';

const SUGGESTED_QUESTIONS = [
  'What should I focus on today?',
  'Should I walk more today?',
  'What should I eat after my workout?',
  'Which breathing session would fit my day?',
  'Give me a short wellness summary.',
];

const WORKOUT_STATUS_TEXT = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export default function AICoachScreen() {
  const [contextSummary, setContextSummary] = useState(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);

  const loadContextSummary = useCallback(async () => {
    const context = await buildTodayContext();
    setContextSummary(context);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContextSummary();
    }, [loadContextSummary])
  );

  async function handleAsk(question) {
    const trimmed = question.trim();
    if (!trimmed) return;

    setStatus('loading');
    setResult(null);
    try {
      // Always build a fresh context right before asking, so the answer
      // reflects anything logged since the screen last loaded.
      const context = await buildTodayContext();
      const advice = await getWellnessAdvice(trimmed, context);
      setResult(advice);
      setStatus('done');
    } catch (error) {
      setStatus('error');
    }
  }

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

      {status === 'loading' && <ActivityIndicator size="large" style={styles.loading} />}

      {status === 'error' && (
        <Text style={styles.errorText}>
          Couldn't reach the wellness coach. Check that the backend is running, then try again.
        </Text>
      )}

      {status === 'done' && result && (
        <View style={styles.resultBox}>
          <Text style={styles.answerText}>{result.answer}</Text>

          {result.recommendations.length > 0 && (
            <>
              <Text style={styles.resultSectionTitle}>Recommendations</Text>
              {result.recommendations.map((recommendation, index) => (
                <RecommendationCard key={index} recommendation={recommendation} />
              ))}
            </>
          )}

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
