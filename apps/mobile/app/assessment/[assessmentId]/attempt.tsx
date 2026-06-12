import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getMyAssessmentAttempt, type AttemptSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function AttemptSummaryScreen() {
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const { token, user } = useAuth();

  const [attempt, setAttempt] = useState<AttemptSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const percent = useMemo(() => {
    if (!attempt || attempt.maxScore <= 0) return 0;
    return Math.round((attempt.totalScoreEarned / attempt.maxScore) * 100);
  }, [attempt]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!token || !user) {
        return <Redirect href="/login" />;
      }

      try {
        const response = await getMyAssessmentAttempt(token, assessmentId);
        if (!active) return;
        setAttempt(response.attempt);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load attempt summary.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [token, assessmentId, user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color="#fb923c" />
          <Text style={styles.centerText}>Loading attempt summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!attempt) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Attempt summary not found.'}</Text>
          <Link href={`/(tabs)`} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to Dashboard</Text>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{attempt.assessment.title}</Text>
          <Text style={styles.copy}>Status: {attempt.status}</Text>

          <View style={styles.scoreRing}>
            <Text style={styles.scorePercent}>{percent}%</Text>
            <Text style={styles.scoreRaw}>
              {attempt.totalScoreEarned} / {attempt.maxScore}
            </Text>
          </View>
        </View>

        {attempt.answers.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.copy}>No submitted answers yet.</Text>
          </View>
        ) : (
          attempt.answers.map((answer) => (
            <View key={answer.challenge._id} style={styles.card}>
              <Text style={styles.subtitle}>{answer.challenge.title}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                <Text style={styles.meta}>Score: {answer.scoreEarned}</Text>
                <Text style={styles.meta}>Status: {challengeStatusLabel(answer)}</Text>
                {typeof answer.passedTests === 'number' && typeof answer.totalTests === 'number' ? (
                  <Text style={styles.meta}>
                    Tests: {answer.passedTests}/{answer.totalTests}
                  </Text>
                ) : null}
              </View>
              {answer.feedback ? <Text style={styles.copy}>Feedback: {answer.feedback}</Text> : null}
              {answer.aiFeedback ? <Text style={styles.copy}>AI feedback: {answer.aiFeedback}</Text> : null}
            </View>
          ))
        )}

        <Link href={`/assessment/${assessmentId}`} style={styles.primaryLink}>
          <Text style={styles.primaryLinkText}>Back to Assessment</Text>
        </Link>

        <Link href={`/(tabs)`} style={styles.ghostLink}>
          <Text style={styles.ghostLinkText}>Back to Dashboard</Text>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const challengeStatusLabel = (answer: AttemptSummary['answers'][number]) => {
  if (typeof answer.passedTests === 'number' && typeof answer.totalTests === 'number') {
    if (answer.totalTests > 0 && answer.passedTests === answer.totalTests) return 'Perfect';
    if (answer.passedTests > 0) return 'Partial';
    return 'Needs work';
  }

  if (answer.scoreEarned > 0) return 'Scored';
  return 'No score';
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#040a16' },
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerText: { color: '#f8fafc', fontSize: 14 },
  errorText: { color: '#fb7185', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(10,15,26,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#f8fafc', fontSize: 17, fontWeight: '700' },
  copy: { marginTop: 8, color: 'rgba(203,213,225,0.82)', fontSize: 14, lineHeight: 22 },
  meta: { marginTop: 8, color: '#fdba74', fontSize: 13, fontWeight: '700' },
  scoreRing: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.24)',
    backgroundColor: 'rgba(251,146,60,0.1)',
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  scorePercent: { color: '#f8fafc', fontSize: 34, fontWeight: '900' },
  scoreRaw: { color: 'rgba(226,232,240,0.85)', fontSize: 13, fontWeight: '600' },
  primaryLink: {
    borderRadius: 16,
    minHeight: 50,
    backgroundColor: '#fb923c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLinkText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ghostLink: {
    borderRadius: 16,
    minHeight: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLinkText: { color: '#f8fafc', fontWeight: '700', fontSize: 14 },
  backLink: {
    borderRadius: 16,
    minHeight: 48,
    minWidth: 190,
    backgroundColor: '#fb923c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backLinkText: { color: '#fff', fontWeight: '800' },
});