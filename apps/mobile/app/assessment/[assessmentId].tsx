import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import FieldHelp from '@/components/field-help';
import GlassToast from '@/components/glass-toast';
import {
  finalizeAssessmentRequest,
  getAssessments,
  getChallengeById,
  getChallengeHintRequest,
  getMyAssessmentAttempt,
  startAssessmentRequest,
  submitChallengeAnswerRequest,
  type AssessmentSummary,
  type AttemptSummary,
  type ChallengeDetails,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

function normalizeChallengeId(challengeRef: string | { _id: string }) {
  return typeof challengeRef === 'string' ? challengeRef : challengeRef._id;
}

function getOrderedChallengeItems(assessment: AssessmentSummary | null) {
  if (!assessment?.challenges?.length) return [];
  return [...assessment.challenges].sort((a, b) => a.order - b.order);
}

function getAnsweredChallengeIds(attempt: AttemptSummary | null) {
  if (!attempt?.answers?.length) return new Set<string>();
  return new Set(attempt.answers.map((answer) => answer.challenge._id));
}

export default function AssessmentDetailScreen() {
  const { assessmentId } = useLocalSearchParams<{ assessmentId: string }>();
  const router = useRouter();
  const { token, user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentSummary | null>(null);
  const [challenge, setChallenge] = useState<ChallengeDetails | null>(null);
  const [attempt, setAttempt] = useState<AttemptSummary | null>(null);
  const [submittedOutput, setSubmittedOutput] = useState('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | ''; message: string }>({
    type: '',
    message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  const isInProgress = attempt?.status === 'in_progress';
  const isSubmitted = attempt?.status === 'submitted';

  const scoreLabel = useMemo(() => {
    if (!attempt) return '--';
    if (attempt.maxScore <= 0) return `${attempt.totalScoreEarned}`;
    return `${attempt.totalScoreEarned} / ${attempt.maxScore}`;
  }, [attempt]);

  const orderedChallengeItems = useMemo(() => getOrderedChallengeItems(assessment), [assessment]);

  const currentChallengeId = useMemo(() => {
    const currentItem = orderedChallengeItems[currentChallengeIndex];
    if (!currentItem) return null;
    return normalizeChallengeId(currentItem.challenge);
  }, [orderedChallengeItems, currentChallengeIndex]);

  const totalChallenges = orderedChallengeItems.length;
  const visibleTestCases = (challenge?.testCases ?? []).filter((test) => !test.isHidden);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!token || !assessmentId) {
        if (active) setLoading(false);
        return;
      }

      try {
        setError(null);
        const { assessments } = await getAssessments(token);
        const selected = assessments.find((item) => item._id === assessmentId) ?? null;

        if (!active) return;
        setAssessment(selected);

        if (!selected) {
          setError('Assessment not found.');
          return;
        }

        try {
          const attemptResponse = await getMyAssessmentAttempt(token, selected._id);
          if (!active) return;
          setAttempt(attemptResponse.attempt);
        } catch (attemptError) {
          const message = attemptError instanceof Error ? attemptError.message : '';
          if (!message.toLowerCase().includes('attempt not found')) {
            throw attemptError;
          }
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load assessment.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [token, assessmentId]);

  useEffect(() => {
    if (!orderedChallengeItems.length) {
      setCurrentChallengeIndex(0);
      return;
    }

    const answeredIds = getAnsweredChallengeIds(attempt);
    const firstUnansweredIndex = orderedChallengeItems.findIndex((item) => {
      const id = normalizeChallengeId(item.challenge);
      return !answeredIds.has(id);
    });

    if (firstUnansweredIndex >= 0) {
      setCurrentChallengeIndex(firstUnansweredIndex);
    } else {
      setCurrentChallengeIndex(orderedChallengeItems.length - 1);
    }
  }, [attempt, orderedChallengeItems]);

  useEffect(() => {
    let active = true;

    const loadChallenge = async () => {
      if (!token || !currentChallengeId) {
        setChallenge(null);
        return;
      }

      try {
        const challengeResponse = await getChallengeById(token, currentChallengeId);
        if (!active) return;
        setChallenge(challengeResponse.challenge);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load challenge.');
      }
    };

    loadChallenge();
    return () => {
      active = false;
    };
  }, [token, currentChallengeId]);

  useEffect(() => {
    if (!currentChallengeId) {
      setSubmittedOutput('');
      return;
    }

    const existingAnswer = attempt?.answers?.find(
      (item) => item.challenge?._id === currentChallengeId
    );

    setSubmittedOutput(existingAnswer?.submittedOutput ?? challenge?.starterCode ?? '');
  }, [attempt, challenge, currentChallengeId]);

  useEffect(() => {
    setHintMessage(null);
  }, [currentChallengeId]);

  const handleStart = async () => {
    if (!token || !assessment) return;

    setActionLoading(true);
    setActionNotice({ type: '', message: '' });
    setError(null);

    try {
      await startAssessmentRequest(token, assessment._id);
      const refreshed = await getMyAssessmentAttempt(token, assessment._id);
      setAttempt(refreshed.attempt);
      setActionNotice({ type: 'success', message: 'Assessment started. You can now submit your answer.' });
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : 'Failed to start assessment.';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || !assessment || !currentChallengeId) return;
    if (!submittedOutput.trim()) {
      const message = 'Please enter an output/code answer before submitting.';
      setError(message);
      setActionNotice({ type: 'error', message });
      return;
    }

    setActionLoading(true);
    setActionNotice({ type: '', message: '' });
    setError(null);

    try {
      const submitResult = await submitChallengeAnswerRequest(
        token,
        assessment._id,
        currentChallengeId,
        submittedOutput
      );
      const refreshed = await getMyAssessmentAttempt(token, assessment._id);
      setAttempt(refreshed.attempt);

      setActionNotice({
        type: 'success',
        message: `Submitted: ${submitResult.result.passedTests}/${submitResult.result.totalTests} tests passed.`,
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to submit answer.';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestHint = async () => {
    if (!token || !assessment || !currentChallengeId) return;

    setActionLoading(true);
    setActionNotice({ type: '', message: '' });
    setError(null);

    try {
      const response = await getChallengeHintRequest(
        token,
        assessment._id,
        currentChallengeId,
        submittedOutput
      );

      setHintMessage(
        `${response.hint}\nHints used: ${response.hintCount}/${response.hintLimit}`
      );
      setActionNotice({ type: 'success', message: 'AI hint generated successfully.' });
    } catch (hintError) {
      const message = hintError instanceof Error ? hintError.message : 'Failed to get hint.';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!token || !assessment) return;

    setActionLoading(true);
    setActionNotice({ type: '', message: '' });
    setError(null);

    try {
      if (!attempt) {
        const message = 'Start the assessment first.';
        setError(message);
        setActionNotice({ type: 'error', message });
        return;
      }

      if (attempt.answers.length === 0) {
        const message = 'Submit at least one challenge before finalizing.';
        setError(message);
        setActionNotice({ type: 'error', message });
        return;
      }

      await finalizeAssessmentRequest(token, assessment._id);
      const refreshed = await getMyAssessmentAttempt(token, assessment._id);
      setAttempt(refreshed.attempt);
      setActionNotice({ type: 'success', message: 'Assessment finalized successfully.' });
    } catch (finalizeError) {
      const message = finalizeError instanceof Error ? finalizeError.message : 'Failed to finalize assessment.';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!token || !user) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color="#fb923c" />
          <Text style={styles.centerText}>Loading assessment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assessment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Assessment not available.'}</Text>
          <TouchableOpacity style={styles.ghostButton} onPress={() => router.back()}>
            <Text style={styles.ghostButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <GlassToast notice={actionNotice} onClose={() => setActionNotice({ type: '', message: '' })} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{assessment.title}</Text>
            <TouchableOpacity style={styles.inlineSignOut} onPress={handleSignOut}>
              <Text style={styles.inlineSignOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.copy}>
            Enter one output per line in the same order as the test cases.
            Example: first test output on line 1, second on line 2, and so on.
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaPill}>{assessment.durationMinutes} min</Text>
            <Text style={styles.metaPill}>{assessment.passingScore ?? 70}% pass</Text>
            <Text style={styles.metaPill}>Score: {scoreLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>{challenge?.title ?? 'Challenge details'}</Text>
          <Text style={styles.copy}>{challenge?.description ?? 'Challenge description is loading.'}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaPill}>{challenge?.difficulty ?? 'easy'}</Text>
            <Text style={styles.metaPill}>{challenge?.language ?? 'javascript'}</Text>
            <Text style={styles.metaPill}>{visibleTestCases.length} public tests</Text>
            <Text style={styles.metaPill}>
              Challenge {totalChallenges === 0 ? 0 : currentChallengeIndex + 1} / {totalChallenges}
            </Text>
          </View>

          {visibleTestCases.length > 0 ? (
            <View style={styles.publicTestsWrap}>
              <Text style={styles.publicTestsTitle}>Public test examples</Text>
              {visibleTestCases.map((test, index) => (
                <Text key={`${test.input}-${index}`} style={styles.publicTestItem}>
                  {index + 1}. Input: {test.input} {'->'} Expected: {test.expectedOutput}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.labelRow}>
            <View style={styles.editorHeaderLeft}>
              <Text style={styles.subtitle}>Your submitted output</Text>
              <FieldHelp text="Enter output lines in the same order as the test cases shown above." />
            </View>
            {hintMessage ? <Text style={styles.hintInlineText}>Hint ready</Text> : null}
          </View>
          {hintMessage ? <Text style={styles.hintInlineBody}>{hintMessage}</Text> : null}
          <TextInput
            multiline
            value={submittedOutput}
            onChangeText={setSubmittedOutput}
            style={styles.editor}
            placeholder="Type your expected output here..."
            placeholderTextColor="rgba(148,163,184,0.75)"
          />

          <View style={styles.actionWrap}>
            <TouchableOpacity
              disabled={currentChallengeIndex <= 0 || actionLoading}
              style={styles.ghostButton}
              onPress={() => setCurrentChallengeIndex((prev) => Math.max(0, prev - 1))}
            >
              <Text style={styles.ghostButtonText}>Previous Challenge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={currentChallengeIndex >= totalChallenges - 1 || actionLoading}
              style={styles.ghostButton}
              onPress={() =>
                setCurrentChallengeIndex((prev) => Math.min(totalChallenges - 1, prev + 1))
              }
            >
              <Text style={styles.ghostButtonText}>Next Challenge</Text>
            </TouchableOpacity>

            {!attempt ? (
              <TouchableOpacity disabled={actionLoading} style={styles.primaryButton} onPress={handleStart}>
                <Text style={styles.primaryButtonText}>
                  {actionLoading ? 'Starting...' : 'Start Assessment'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {isInProgress ? (
              <>
                <TouchableOpacity disabled={actionLoading} style={styles.primaryButton} onPress={handleSubmit}>
                  <Text style={styles.primaryButtonText}>
                    {actionLoading ? 'Submitting...' : 'Submit Challenge'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity disabled={actionLoading} style={styles.ghostButton} onPress={handleRequestHint}>
                  <Text style={styles.ghostButtonText}>
                    {actionLoading ? 'Requesting Hint...' : 'Get AI Hint'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity disabled={actionLoading} style={styles.ghostButton} onPress={handleFinalize}>
                  <Text style={styles.ghostButtonText}>
                    {actionLoading ? 'Finalizing...' : 'Finalize Assessment'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            {isSubmitted ? (
              <Link href={`/assessment/${assessment._id}/attempt`} asChild>
                <TouchableOpacity style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>View Attempt Summary</Text>
                </TouchableOpacity>
              </Link>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#040a16' },
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  centerText: { color: '#f8fafc', fontSize: 14 },
  card: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(10,15,26,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '800' },
  inlineSignOut: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.28)',
    backgroundColor: 'rgba(248,113,113,0.13)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inlineSignOutText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subtitle: { color: '#f8fafc', fontSize: 17, fontWeight: '700' },
  editorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  copy: { marginTop: 8, color: 'rgba(203,213,225,0.82)', lineHeight: 22, fontSize: 14 },
  metaRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: {
    fontSize: 12,
    color: '#fdba74',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.24)',
    backgroundColor: 'rgba(251,146,60,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  publicTestsWrap: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    gap: 8,
  },
  publicTestsTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  publicTestItem: { color: 'rgba(203,213,225,0.85)', fontSize: 13, lineHeight: 20 },
  editor: {
    marginTop: 10,
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(5,9,20,0.9)',
    color: '#f8fafc',
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
  },
  hintInlineText: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hintInlineBody: {
    marginTop: 10,
    color: '#fcd34d',
    fontSize: 13,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.28)',
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 12,
    padding: 10,
  },
  noticeCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.45)',
    backgroundColor: 'rgba(22,163,74,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeCardError: {
    borderColor: 'rgba(248,113,113,0.45)',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  noticeTextSuccess: { color: '#bbf7d0', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  noticeTextError: { color: '#fecaca', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  errorText: { marginTop: 10, color: '#fb7185', fontSize: 13, lineHeight: 18 },
  actionWrap: { marginTop: 14, gap: 10 },
  primaryButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#fb923c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ghostButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: { color: '#f8fafc', fontWeight: '700', fontSize: 14 },
});