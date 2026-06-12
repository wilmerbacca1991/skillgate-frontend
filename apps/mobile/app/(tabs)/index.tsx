import { useEffect, useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import SkillGateBrand from '@/skillgate-brand';
import GlassToast from '@/components/glass-toast';
import AnimatedReveal from '@/components/animated-reveal';
import {
  API_BASE_URL,
  createAssessmentRequest,
  createChallengeRequest,
  deleteAssessmentRequest,
  deleteChallengeRequest,
  getAssessments,
  getAssessmentAttemptsForRecruiterRequest,
  getChallenges,
  getInterviewByRoomIdRequest,
  getMyInterviewsRequest,
  generateInterviewRoomRequest,
  getRecruiterCandidatesRequest,
  getRecruiterSummaryRequest,
  deleteRecruiterCandidateRequest,
  deleteInterviewRequest,
  scheduleInterviewRequest,
  updateChallengeRequest,
  updateInterviewStatusRequest,
  type ChallengePreview,
  type AssessmentSummary,
  type InterviewSummary,
  type RecruiterAttemptSummary,
  type RecruiterCandidate,
  type RecruiterDashboardMetrics,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function DashboardScreen() {
  const router = useRouter();
  const { token, user, signOut } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<ChallengePreview[]>([]);
  const [myInterviews, setMyInterviews] = useState<InterviewSummary[]>([]);
  const [selectedAssessmentForAttempts, setSelectedAssessmentForAttempts] = useState('');
  const [assessmentAttempts, setAssessmentAttempts] = useState<RecruiterAttemptSummary[]>([]);
  const [recruiterSummary, setRecruiterSummary] = useState<RecruiterDashboardMetrics | null>(null);
  const [recruiterCandidates, setRecruiterCandidates] = useState<RecruiterCandidate[]>([]);
  const [challengeTitle, setChallengeTitle] = useState('Add Two Numbers');
  const [challengeDescription, setChallengeDescription] = useState('Return the sum of two integers.');
  const [challengeInput, setChallengeInput] = useState('1 2');
  const [challengeExpectedOutput, setChallengeExpectedOutput] = useState('3');
  const [challengeSearchQuery, setChallengeSearchQuery] = useState('');
  const [challengeDifficultyFilter, setChallengeDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [challengeSeniorityFilter, setChallengeSeniorityFilter] = useState<'all' | 'junior' | 'intermediate' | 'senior'>('all');
  const [editingChallengeId, setEditingChallengeId] = useState('');
  const [editChallengeTitle, setEditChallengeTitle] = useState('');
  const [editChallengeDescription, setEditChallengeDescription] = useState('');
  const [editChallengeDifficulty, setEditChallengeDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [editChallengeLanguage, setEditChallengeLanguage] = useState('javascript');
  const [assessmentTitle, setAssessmentTitle] = useState('JS Basics Timed Test');
  const [assessmentDescription, setAssessmentDescription] = useState('One challenge timed assessment');
  const [assessmentDuration, setAssessmentDuration] = useState('30');
  const [assessmentPassingScore, setAssessmentPassingScore] = useState('60');
  const [assessmentChallengeId, setAssessmentChallengeId] = useState('');
  const [selectedAssessmentCandidateIds, setSelectedAssessmentCandidateIds] = useState<string[]>([]);
  const [candidateEntryMode, setCandidateEntryMode] = useState<'existing' | 'manual'>('existing');
  const [interviewCandidateId, setInterviewCandidateId] = useState('');
  const [interviewCandidateName, setInterviewCandidateName] = useState('');
  const [interviewCandidateEmail, setInterviewCandidateEmail] = useState('');
  const [interviewAssessmentId, setInterviewAssessmentId] = useState('');
  const [interviewWhen, setInterviewWhen] = useState('');
  const [interviewRoomId, setInterviewRoomId] = useState('');
  const [interviewMeetingLink, setInterviewMeetingLink] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [latestRoomDetails, setLatestRoomDetails] = useState<{
    roomId: string;
    meetingLink: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'build' | 'live'>('overview');
  const [copiedAssessmentId, setCopiedAssessmentId] = useState('');
  const [copiedChallengeId, setCopiedChallengeId] = useState('');
  const [showChallengePicker, setShowChallengePicker] = useState(false);
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);
  const [showSeniorityPicker, setShowSeniorityPicker] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | ''; message: string }>({
    type: '',
    message: '',
  });

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        if (user?.role === 'recruiter') {
          const [
            assessmentsResponse,
            challengesResponse,
            interviewsResponse,
            summaryResponse,
            candidatesResponse,
          ] =
            await Promise.all([
              getAssessments(token),
              getChallenges(token),
              getMyInterviewsRequest(token),
              getRecruiterSummaryRequest(token),
              getRecruiterCandidatesRequest(token),
            ]);

          if (!active) {
            return;
          }

          setAssessments(assessmentsResponse.assessments ?? []);
          setAvailableChallenges(challengesResponse.challenges ?? []);
          setMyInterviews(interviewsResponse.interviews ?? []);
          setRecruiterSummary(summaryResponse.metrics ?? null);
          const nextCandidates = candidatesResponse.candidates ?? [];
          setRecruiterCandidates(nextCandidates);
          setSelectedAssessmentCandidateIds((current) => {
            const filtered = current.filter((candidateId) =>
              nextCandidates.some((candidate) => candidate._id === candidateId)
            );

            if (filtered.length) {
              return filtered;
            }

            return nextCandidates[0]?._id ? [nextCandidates[0]._id] : [];
          });
          setError(null);
          return;
        }

        const response = await getAssessments(token);

        if (!active) {
          return;
        }

        setAssessments(response.assessments);
        setError(null);
      } catch (fetchError) {
        if (active) {
          const message =
            fetchError instanceof Error ? fetchError.message : 'Failed to load assessments';

          if (message.toLowerCase().includes('token invalid')) {
            await signOut();
            router.replace('/login');
            return;
          }

          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [token, user?.role, signOut, router]);

  if (!token || !user) {
    return <Redirect href="/login" />;
  }

  const openAssessments = assessments.length;
  const latestAssessment = assessments[0];
  const visibleRecruiterInterviews = myInterviews.filter((item) => item.status !== 'cancelled');
  const upcomingInterviews = recruiterSummary?.upcomingInterviews ?? visibleRecruiterInterviews.length;

  const getChallengeSeniority = (challenge: ChallengePreview) => {
    const tags = (challenge.tags ?? []).map((tag) => String(tag).toLowerCase());
    if (tags.includes('junior')) return 'junior';
    if (tags.includes('intermediate')) return 'intermediate';
    if (tags.includes('senior')) return 'senior';
    return 'unspecified';
  };

  const getChallengeSubject = (challenge: ChallengePreview) => {
    const subjectTag = (challenge.tags ?? []).find((tag) => String(tag).toLowerCase().startsWith('subject:'));
    if (!subjectTag) {
      return 'general coding';
    }
    return String(subjectTag).split(':').slice(1).join(':').replace(/-/g, ' ');
  };

  const filteredChallenges = availableChallenges.filter((challenge) => {
    const query = challengeSearchQuery.trim().toLowerCase();
    const title = String(challenge.title ?? '').toLowerCase();
    const description = String(challenge.description ?? '').toLowerCase();
    const matchesQuery = !query || title.includes(query) || description.includes(query);
    const matchesDifficulty =
      challengeDifficultyFilter === 'all' || challenge.difficulty === challengeDifficultyFilter;
    const matchesSeniority =
      challengeSeniorityFilter === 'all' || getChallengeSeniority(challenge) === challengeSeniorityFilter;

    return matchesQuery && matchesDifficulty && matchesSeniority;
  });

  const selectedAssessmentChallenge = availableChallenges.find(
    (challenge) => challenge._id === assessmentChallengeId
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setAssessments([]);
    setMyInterviews([]);
    setRecruiterSummary(null);
    setRecruiterCandidates([]);
    setSelectedAssessmentCandidateIds([]);
    setAvailableChallenges([]);
    setAssessmentAttempts([]);
    setSelectedAssessmentForAttempts('');
  };

  const refreshRecruiterData = async () => {
    if (!token || user?.role !== 'recruiter') return;

    const [interviewsResponse, summaryResponse, candidatesResponse, assessmentsResponse, challengesResponse] = await Promise.all([
      getMyInterviewsRequest(token),
      getRecruiterSummaryRequest(token),
      getRecruiterCandidatesRequest(token),
      getAssessments(token),
      getChallenges(token),
    ]);

    setMyInterviews(interviewsResponse.interviews ?? []);
    setRecruiterSummary(summaryResponse.metrics ?? null);
    const nextCandidates = candidatesResponse.candidates ?? [];
    setRecruiterCandidates(nextCandidates);
    setSelectedAssessmentCandidateIds((current) => {
      const filtered = current.filter((candidateId) =>
        nextCandidates.some((candidate) => candidate._id === candidateId)
      );

      if (filtered.length) {
        return filtered;
      }

      return nextCandidates[0]?._id ? [nextCandidates[0]._id] : [];
    });
    setAssessments(assessmentsResponse.assessments ?? []);
    setAvailableChallenges(challengesResponse.challenges ?? []);
  };

  const handleCreateChallenge = async () => {
    if (!token || user?.role !== 'recruiter') return;

    if (!challengeTitle.trim() || !challengeDescription.trim()) {
      setError('Challenge title and description are required.');
      return;
    }

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      const response = await createChallengeRequest(token, {
        title: challengeTitle.trim(),
        description: challengeDescription.trim(),
        difficulty: 'easy',
        language: 'javascript',
        starterCode: 'function solve(a, b) {\n  return a + b;\n}',
        tags: ['mobile', 'recruiter'],
        testCases: [
          {
            input: challengeInput || '1 2',
            expectedOutput: challengeExpectedOutput || '3',
            isHidden: false,
          },
        ],
      });

      setAssessmentChallengeId(response.challenge._id);
      await refreshRecruiterData();
      setActionNotice({ type: 'success', message: 'Challenge successfully created!' });
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create challenge';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEditChallenge = (challenge: ChallengePreview) => {
    setEditingChallengeId(challenge._id);
    setEditChallengeTitle(challenge.title || '');
    setEditChallengeDescription(challenge.description || '');
    setEditChallengeDifficulty(challenge.difficulty || 'easy');
    setEditChallengeLanguage(challenge.language || 'javascript');
  };

  const handleSaveChallengeEdit = async (challenge: ChallengePreview) => {
    if (!token || user?.role !== 'recruiter') return;

    if (!editChallengeTitle.trim() || !editChallengeDescription.trim()) {
      setError('Challenge title and description are required.');
      return;
    }

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      await updateChallengeRequest(token, challenge._id, {
        title: editChallengeTitle.trim(),
        description: editChallengeDescription.trim(),
        difficulty: editChallengeDifficulty,
        language: editChallengeLanguage.trim() || 'javascript',
        starterCode: 'function solve(input) {\n  return input;\n}',
        tags: [],
        testCases:
          challenge.testCases && challenge.testCases.length
            ? challenge.testCases
            : [
                {
                  input: 'sample',
                  expectedOutput: 'sample',
                  isHidden: false,
                },
              ],
      });

      setEditingChallengeId('');
      await refreshRecruiterData();
      setActionNotice({ type: 'success', message: 'Challenge updated successfully.' });
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update challenge';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!token || user?.role !== 'recruiter') return;

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      await deleteChallengeRequest(token, challengeId);
      if (editingChallengeId === challengeId) {
        setEditingChallengeId('');
      }
      await refreshRecruiterData();
      setActionNotice({ type: 'success', message: 'Challenge deleted successfully.' });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete challenge';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAssessmentCandidate = (candidateId: string) => {
    setSelectedAssessmentCandidateIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId]
    );
  };

  const executeDeleteCandidate = async (candidate: RecruiterCandidate) => {
    if (!token || user?.role !== 'recruiter') return;

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      await deleteRecruiterCandidateRequest(token, candidate._id);

      setSelectedAssessmentCandidateIds((current) =>
        current.filter((candidateId) => candidateId !== candidate._id)
      );

      if (interviewCandidateId === candidate._id) {
        setInterviewCandidateId('');
        setInterviewCandidateName('');
        setInterviewCandidateEmail('');
      }

      await refreshRecruiterData();
      setActionNotice({ type: 'success', message: 'Candidate deleted and removed from SkillGate.' });
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete candidate';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCandidate = (candidate: RecruiterCandidate) => {
    if (!token || user?.role !== 'recruiter') return;

    Alert.alert(
      'Delete candidate',
      `${candidate.firstName} ${candidate.lastName} and all of their SkillGate data will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void executeDeleteCandidate(candidate);
          },
        },
      ]
    );
  };

  const handleCreateAssessment = async () => {
    if (!token || user?.role !== 'recruiter') return;

    if (!assessmentTitle.trim() || !assessmentChallengeId.trim()) {
      setError('Assessment title and challenge ID are required.');
      return;
    }

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      const assignedCandidates = selectedAssessmentCandidateIds.length
        ? selectedAssessmentCandidateIds
        : recruiterCandidates.slice(0, 1).map((candidate) => candidate._id);

      await createAssessmentRequest(token, {
        title: assessmentTitle.trim(),
        description: assessmentDescription.trim(),
        durationMinutes: Number(assessmentDuration) || 30,
        passingScore: Number(assessmentPassingScore) || 60,
        assignedCandidates,
        challenges: [
          {
            challenge: assessmentChallengeId.trim(),
            points: 100,
            order: 1,
          },
        ],
      });

      await refreshRecruiterData();
      setActionNotice({ type: 'success', message: 'Assessment successfully created!' });
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create assessment';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const resolveChallengeId = (challengeRef: string | { _id?: string } | undefined) => {
    if (!challengeRef) return '';
    if (typeof challengeRef === 'string') return challengeRef;
    return challengeRef._id ?? '';
  };

  const handleCopyAssessmentId = (assessmentId: string) => {
    setCopiedAssessmentId(assessmentId);
    setActionNotice({ type: 'success', message: 'Assessment ID copied and ready to use.' });
  };

  const handleUseAssessmentInBuilder = (assessment: AssessmentSummary) => {
    const firstChallengeId = resolveChallengeId(assessment.challenges?.[0]?.challenge as string | { _id?: string } | undefined);

    if (!firstChallengeId) {
      setActionNotice({ type: 'error', message: 'This assessment has no challenge ID to reuse in Build.' });
      return;
    }

    setCopiedAssessmentId(assessment._id);
    setCopiedChallengeId(firstChallengeId);
    setAssessmentChallengeId(firstChallengeId);
    setActiveSection('build');
    setActionNotice({ type: 'success', message: 'First challenge ID inserted into Build Assessments.' });
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!token || user?.role !== 'recruiter') return;

    Alert.alert(
      'Delete Assessment',
      'Delete this assessment permanently? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            setError(null);

            try {
              await deleteAssessmentRequest(token, assessmentId);

              if (selectedAssessmentForAttempts === assessmentId) {
                setSelectedAssessmentForAttempts('');
                setAssessmentAttempts([]);
              }

              await refreshRecruiterData();
              setActionNotice({ type: 'success', message: 'Assessment deleted permanently.' });
            } catch (deleteError) {
              const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete assessment';
              setError(message);
              setActionNotice({ type: 'error', message });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLoadAssessmentAttempts = async (assessmentId: string) => {
    if (!token || user?.role !== 'recruiter') return;

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      const response = await getAssessmentAttemptsForRecruiterRequest(token, assessmentId);
      setSelectedAssessmentForAttempts(assessmentId);
      setAssessmentAttempts(response.attempts ?? []);
      setActionNotice({ type: 'success', message: 'Candidate attempts loaded successfully.' });
    } catch (attemptsError) {
      const message = attemptsError instanceof Error ? attemptsError.message : 'Failed to load attempts';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInterviewRoom = async (interviewId: string) => {
    if (!token || user?.role !== 'recruiter') return;

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      const response = await generateInterviewRoomRequest(token, interviewId);
      setLatestRoomDetails({ roomId: response.roomId, meetingLink: response.meetingLink });
      await refreshRecruiterData();
      setActionNotice({ type: 'success', message: 'Interview room generated successfully.' });
    } catch (roomError) {
      const message = roomError instanceof Error ? roomError.message : 'Failed to generate room';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRoomById = async (value: string) => {
    if (!token) return;

    const linkMatch = String(value || '').trim().match(/[?&]roomId=([^&#]+)/i);
    const roomId = (linkMatch?.[1] ? decodeURIComponent(linkMatch[1]) : String(value || ''))
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');

    if (!roomId) {
      setError('Room ID or full room link is required to join.');
      return;
    }

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      await getInterviewByRoomIdRequest(token, roomId);
      router.push({
        pathname: '/interview-room' as never,
        params: { roomId },
      });
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : 'Failed to join room';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!token || user?.role !== 'recruiter') return;

    const isManualCandidate = candidateEntryMode === 'manual';
    if (
      !interviewWhen.trim() ||
      (!isManualCandidate && !interviewCandidateId.trim()) ||
      (isManualCandidate && (!interviewCandidateName.trim() || !interviewCandidateEmail.trim()))
    ) {
      setError(
        isManualCandidate
          ? 'Manual candidate name, email, and scheduled datetime are required.'
          : 'Candidate and scheduled datetime are required.'
      );
      return;
    }

    if (interviewAssessmentId && !/^[a-f0-9]{24}$/.test(interviewAssessmentId.trim())) {
      setError('Assessment ID must be a valid 24-character ID. Leave blank if not using an assessment.');
      return;
    }

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      const scheduleResponse = await scheduleInterviewRequest(token, {
        candidateId: isManualCandidate ? undefined : interviewCandidateId.trim(),
        candidateName: isManualCandidate ? interviewCandidateName.trim() : undefined,
        candidateEmail: interviewCandidateEmail.trim() || undefined,
        assessmentId: interviewAssessmentId.trim() || undefined,
        scheduledAt: interviewWhen.trim(),
        durationMinutes: 60,
        timezone: 'UTC',
        roomId: interviewRoomId.trim() || undefined,
        meetingLink: interviewMeetingLink.trim() || undefined,
      });

      await refreshRecruiterData();
      setInterviewWhen('');
      setInterviewRoomId('');
      setInterviewMeetingLink('');
      const emailDelivery = scheduleResponse?.emailDelivery;
      const emailHint = emailDelivery?.sent
        ? ' Email invite sent.'
        : emailDelivery?.reason
          ? ` Email invite not sent (${emailDelivery.reason}).`
          : '';

      setActionNotice({
        type: emailDelivery?.sent === false ? 'error' : 'success',
        message: `Interview scheduled successfully!${emailHint}`,
      });
    } catch (scheduleError) {
      const message = scheduleError instanceof Error ? scheduleError.message : 'Failed to schedule interview';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateInterviewStatus = async (
    interviewId: string,
    status: 'completed' | 'cancelled'
  ) => {
    if (!token || user?.role !== 'recruiter') return;

    setActionLoading(true);
    setError(null);
    setActionNotice({ type: '', message: '' });

    try {
      await updateInterviewStatusRequest(token, interviewId, status);
      await refreshRecruiterData();
      setActionNotice({ type: 'success', message: `Interview marked as ${status}.` });
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update interview status';
      setError(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!token) return;

    const interview = visibleRecruiterInterviews.find((item) => item._id === interviewId);
    if (!interview || interview.status !== 'completed') {
      return;
    }

    Alert.alert(
      'Delete interview',
      'This will remove the completed interview from your dashboard permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionNotice({ type: '', message: '' });

            try {
              await deleteInterviewRequest(token, interviewId);
              const [summaryResponse, interviewsResponse] = await Promise.all([
                getRecruiterSummaryRequest(token),
                getMyInterviewsRequest(token),
              ]);

              setRecruiterSummary(summaryResponse.metrics ?? null);
              setMyInterviews(interviewsResponse.interviews ?? []);
              setActionNotice({ type: 'success', message: 'Interview deleted.' });
            } catch (deleteError) {
              const message =
                deleteError instanceof Error ? deleteError.message : 'Failed to delete interview.';
              setError(message);
              setActionNotice({ type: 'error', message });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GlassToast notice={actionNotice} onClose={() => setActionNotice({ type: '', message: '' })} />
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedReveal delay={20} duration={340} style={styles.hero}>
          <SkillGateBrand
            size="hero"
            tagline={user.role === 'recruiter' ? 'Mobile recruiter companion' : 'Mobile candidate companion'}
          />
          <Text style={styles.heroCopy}>
            {user.role === 'recruiter'
              ? 'Recruiters can monitor analytics, schedule interviews, and update interview status directly on mobile.'
              : 'SkillGate Mobile now uses the backend. This screen shows the current assessment feed for the signed-in user from live backend data.'}
          </Text>

          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>
              Signed in as {user.firstName} {user.lastName}
            </Text>
          </View>
        </AnimatedReveal>

        <AnimatedReveal delay={80} duration={380} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{String(openAssessments).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>
              {user.role === 'recruiter' ? 'Owned assessments' : 'Open assessments'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {user.role === 'recruiter'
                ? `${recruiterSummary?.completionRate ?? 0}%`
                : latestAssessment
                  ? `${latestAssessment.durationMinutes}m`
                  : '--'}
            </Text>
            <Text style={styles.statLabel}>
              {user.role === 'recruiter' ? 'Completion rate' : 'Latest duration'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {user.role === 'recruiter' ? upcomingInterviews : `${latestAssessment?.passingScore ?? '--'}%`}
            </Text>
            <Text style={styles.statLabel}>
              {user.role === 'recruiter' ? 'Upcoming interviews' : 'Passing score'}
            </Text>
          </View>
        </AnimatedReveal>

        <AnimatedReveal delay={120} duration={420} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live assessment feed</Text>
          <Text style={styles.sectionCopy}>
            Current API: {API_BASE_URL}
          </Text>
        </AnimatedReveal>

        <AnimatedReveal delay={140} duration={420} style={styles.featureCard}>
          <Text style={styles.featureTitle}>Action Center</Text>
          <Text style={styles.featureCopy}>
            {actionNotice.message || 'Use this space for the latest system updates and actions as you work.'}
          </Text>
        </AnimatedReveal>

        {user.role === 'recruiter' ? (
          <View style={styles.sectionTabsRow}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'build', label: 'Build' },
              { id: 'live', label: 'Interview Rooms' },
            ].map((section) => (
              <TouchableOpacity activeOpacity={0.82}
                key={section.id}
                style={[
                  styles.sectionTabButton,
                  activeSection === section.id ? styles.sectionTabButtonActive : null,
                ]}
                onPress={() => setActiveSection(section.id as 'overview' | 'build' | 'live')}
              >
                <Text style={styles.sectionTabText}>{section.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {user.role === 'recruiter' && activeSection === 'overview' ? (
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Recruiter Snapshot</Text>
            <Text style={styles.featureCopy}>
              Use Build to create challenges/assessments and Interview Rooms to schedule, generate rooms, and run live sessions.
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Candidates: {recruiterCandidates.length}</Text>
              <Text style={styles.metaText}>Challenges: {availableChallenges.length}</Text>
              <Text style={styles.metaText}>Interviews: {myInterviews.length}</Text>
            </View>
          </View>
        ) : null}

        {user.role === 'recruiter' && activeSection === 'build' ? (
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Create Challenge</Text>
            <Text style={styles.featureCopy}>Mobile recruiter parity: create challenge directly from mobile.</Text>
            <TextInput
              value={challengeTitle}
              onChangeText={setChallengeTitle}
              placeholder="Challenge title"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
            />
            <TextInput
              value={challengeDescription}
              onChangeText={setChallengeDescription}
              placeholder="Challenge description"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
            />
            <TextInput
              value={challengeInput}
              onChangeText={setChallengeInput}
              placeholder="Public test input"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
            />
            <TextInput
              value={challengeExpectedOutput}
              onChangeText={setChallengeExpectedOutput}
              placeholder="Expected output"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
            />
            <TouchableOpacity activeOpacity={0.82} style={styles.inlineButton} onPress={handleCreateChallenge} disabled={actionLoading}>
              <Text style={styles.inlineButtonText}>{actionLoading ? 'Working...' : 'Create Challenge'}</Text>
            </TouchableOpacity>

            <TextInput
              value={challengeSearchQuery}
              onChangeText={setChallengeSearchQuery}
              placeholder="Search by challenge name or subject"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.inlineButton}
                onPress={() => setShowDifficultyPicker(true)}
              >
                <Text style={styles.inlineButtonText}>Difficulty: {challengeDifficultyFilter}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.inlineButton}
                onPress={() => setShowSeniorityPicker(true)}
              >
                <Text style={styles.inlineButtonText}>Seniority: {challengeSeniorityFilter}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.featureCopy}>
              Existing Challenges: pick one to edit/delete, then copy its challenge ID into Create Assessment.
            </Text>

            {filteredChallenges.length ? (
              <View style={styles.libraryStack}>
                {filteredChallenges.slice(0, 10).map((challenge) => (
                  <View key={challenge._id} style={styles.miniCard}>
                    <Text style={styles.metaText}>{challenge.title}</Text>
                    <Text style={styles.featureCopy}>ID: {challenge._id}</Text>
                    <Text style={styles.featureCopy}>
                      {challenge.difficulty || 'easy'} · {challenge.language || 'javascript'}
                    </Text>
                    <Text style={styles.featureCopy}>
                      Seniority: {getChallengeSeniority(challenge)} · Subject: {getChallengeSubject(challenge)}
                    </Text>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity activeOpacity={0.82}
                        style={styles.inlineButton}
                        onPress={() => handleStartEditChallenge(challenge)}
                        disabled={actionLoading}
                      >
                        <Text style={styles.inlineButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.82}
                        style={styles.inlineButton}
                        onPress={() => handleDeleteChallenge(challenge._id)}
                        disabled={actionLoading}
                      >
                        <Text style={styles.inlineButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>

                    {editingChallengeId === challenge._id ? (
                      <View>
                        <TextInput
                          value={editChallengeTitle}
                          onChangeText={setEditChallengeTitle}
                          placeholder="Challenge title"
                          placeholderTextColor="rgba(148,163,184,0.75)"
                          style={styles.input}
                        />
                        <TextInput
                          value={editChallengeDescription}
                          onChangeText={setEditChallengeDescription}
                          placeholder="Challenge description"
                          placeholderTextColor="rgba(148,163,184,0.75)"
                          style={styles.input}
                        />
                        <TextInput
                          value={editChallengeDifficulty}
                          onChangeText={(value) => {
                            const lower = value.toLowerCase();
                            if (lower === 'easy' || lower === 'medium' || lower === 'hard') {
                              setEditChallengeDifficulty(lower);
                            }
                          }}
                          placeholder="Difficulty: easy | medium | hard"
                          placeholderTextColor="rgba(148,163,184,0.75)"
                          style={styles.input}
                        />
                        <TextInput
                          value={editChallengeLanguage}
                          onChangeText={setEditChallengeLanguage}
                          placeholder="Language"
                          placeholderTextColor="rgba(148,163,184,0.75)"
                          style={styles.input}
                        />
                        <View style={styles.actionsRow}>
                          <TouchableOpacity activeOpacity={0.82}
                            style={styles.inlineButton}
                            onPress={() => handleSaveChallengeEdit(challenge)}
                            disabled={actionLoading}
                          >
                            <Text style={styles.inlineButtonText}>Save</Text>
                          </TouchableOpacity>
                          <TouchableOpacity activeOpacity={0.82}
                            style={styles.inlineButton}
                            onPress={() => setEditingChallengeId('')}
                            disabled={actionLoading}
                          >
                            <Text style={styles.inlineButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {user.role === 'recruiter' && activeSection === 'build' ? (
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Create Assessment</Text>
            <Text style={styles.featureCopy}>Create an assessment and attach one challenge from mobile.</Text>
            {copiedAssessmentId ? (
              <Text style={styles.featureCopy}>Copied assessment ID: {copiedAssessmentId}</Text>
            ) : null}
            <TextInput
              value={assessmentTitle}
              onChangeText={setAssessmentTitle}
              placeholder="Assessment title"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
            />
            <TextInput
              value={assessmentDescription}
              onChangeText={setAssessmentDescription}
              placeholder="Assessment description"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
            />
            <TextInput
              value={assessmentDuration}
              onChangeText={setAssessmentDuration}
              placeholder="Duration minutes"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              value={assessmentPassingScore}
              onChangeText={setAssessmentPassingScore}
              placeholder="Passing score"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              value={assessmentChallengeId}
              onChangeText={setAssessmentChallengeId}
              placeholder="Challenge ID"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
            />
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.inlineButton}
              onPress={() => setShowChallengePicker(true)}
            >
              <Text style={styles.inlineButtonText}>Select Challenge From Library</Text>
            </TouchableOpacity>
            {selectedAssessmentChallenge ? (
              <Text style={styles.featureCopy}>
                Selected: {selectedAssessmentChallenge.title} · Tests: {(selectedAssessmentChallenge.testCases ?? []).length}
              </Text>
            ) : null}
            {copiedChallengeId ? (
              <TouchableOpacity activeOpacity={0.82}
                style={styles.inlineButton}
                onPress={() => setAssessmentChallengeId(copiedChallengeId)}
                disabled={actionLoading}
              >
                <Text style={styles.inlineButtonText}>Paste Copied Challenge ID</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.featureCopy}>Assign candidates for this assessment.</Text>
            <View style={styles.libraryStack}>
              {recruiterCandidates.length ? (
                recruiterCandidates.slice(0, 8).map((candidate) => {
                  const isSelected = selectedAssessmentCandidateIds.includes(candidate._id);

                  return (
                    <View
                      key={candidate._id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isSelected ? 'rgba(56,189,248,0.45)' : 'rgba(255,255,255,0.08)',
                        backgroundColor: isSelected ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.82}
                        onPress={() => handleToggleAssessmentCandidate(candidate._id)}
                        style={{ flex: 1 }}
                      >
                        <Text style={styles.inlineButtonText}>
                          {isSelected ? '✓ ' : ''}
                          {candidate.firstName} {candidate.lastName}
                        </Text>
                        <Text style={styles.featureCopy}>{candidate.email}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.82}
                        onPress={() => handleDeleteCandidate(candidate)}
                        style={[
                          styles.inlineButton,
                          {
                            minWidth: 92,
                            backgroundColor: 'rgba(239,68,68,0.16)',
                            borderColor: 'rgba(248,113,113,0.38)',
                          },
                        ]}
                      >
                        <Text style={styles.inlineButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.featureCopy}>No registered candidates loaded yet.</Text>
              )}
            </View>
            <TouchableOpacity activeOpacity={0.82} style={styles.inlineButton} onPress={handleCreateAssessment} disabled={actionLoading}>
              <Text style={styles.inlineButtonText}>{actionLoading ? 'Working...' : 'Create Assessment'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Modal
          visible={showChallengePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowChallengePicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.featureTitle}>Select Challenge</Text>
                <Text style={styles.featureCopy}>Choose one challenge to inject into Build Assessment.</Text>
              </View>
              <ScrollView
                style={styles.pickerScroll}
                contentContainerStyle={styles.pickerScrollContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {(filteredChallenges.length ? filteredChallenges : availableChallenges).slice(0, 30).map((challenge) => (
                  <TouchableOpacity
                    key={challenge._id}
                    activeOpacity={0.82}
                    style={styles.pickerOptionCard}
                    onPress={() => {
                      setAssessmentChallengeId(challenge._id);
                      setShowChallengePicker(false);
                    }}
                  >
                    <View style={styles.pickerOptionTitleRow}>
                      <Text style={styles.pickerOptionTitle}>{challenge.title}</Text>
                      <Text style={styles.pickerOptionBadge}>{challenge.difficulty || 'easy'}</Text>
                    </View>
                    <Text style={styles.pickerOptionMeta}>{(challenge.tags ?? []).slice(0, 2).join(' · ') || 'No tags'}</Text>
                    <Text style={styles.pickerOptionMeta}>
                      {challenge.language || 'javascript'} · {(challenge.testCases ?? []).length} test cases
                    </Text>
                    <Text style={styles.pickerOptionSelected}>Tap to select</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.secondaryButton}
                onPress={() => setShowChallengePicker(false)}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showDifficultyPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDifficultyPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.featureTitle}>Select Difficulty</Text>
                <Text style={styles.featureCopy}>Filter the challenge library by difficulty.</Text>
              </View>
              <ScrollView
                style={styles.pickerScroll}
                contentContainerStyle={styles.pickerScrollContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {['all', 'easy', 'medium', 'hard'].map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    activeOpacity={0.82}
                    style={styles.pickerOptionCard}
                    onPress={() => {
                      setChallengeDifficultyFilter(difficulty as 'all' | 'easy' | 'medium' | 'hard');
                      setShowDifficultyPicker(false);
                    }}
                  >
                    <View style={styles.pickerOptionTitleRow}>
                      <Text style={styles.pickerOptionTitle}>{difficulty}</Text>
                      {challengeDifficultyFilter === difficulty ? (
                        <Text style={styles.pickerOptionSelected}>Selected</Text>
                      ) : null}
                    </View>
                    <Text style={styles.pickerOptionMeta}>
                      {difficulty === 'all'
                        ? 'Show every challenge in the library.'
                        : `${difficulty} challenge set.`}
                    </Text>
                    <Text style={styles.pickerOptionMeta}>
                      {difficulty === 'all' ? 'No content is hidden.' : 'Includes the full challenge details.'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.secondaryButton}
                onPress={() => setShowDifficultyPicker(false)}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showSeniorityPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSeniorityPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.featureTitle}>Select Seniority</Text>
                <Text style={styles.featureCopy}>Narrow the library to a target seniority track.</Text>
              </View>
              <ScrollView
                style={styles.pickerScroll}
                contentContainerStyle={styles.pickerScrollContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {['all', 'junior', 'intermediate', 'senior'].map((seniority) => (
                  <TouchableOpacity
                    key={seniority}
                    activeOpacity={0.82}
                    style={styles.pickerOptionCard}
                    onPress={() => {
                      setChallengeSeniorityFilter(
                        seniority as 'all' | 'junior' | 'intermediate' | 'senior'
                      );
                      setShowSeniorityPicker(false);
                    }}
                  >
                    <View style={styles.pickerOptionTitleRow}>
                      <Text style={styles.pickerOptionTitle}>{seniority}</Text>
                      {challengeSeniorityFilter === seniority ? (
                        <Text style={styles.pickerOptionSelected}>Selected</Text>
                      ) : null}
                    </View>
                    <Text style={styles.pickerOptionMeta}>
                      {seniority === 'all'
                        ? 'Show every seniority level.'
                        : `${seniority} candidate track.`}
                    </Text>
                    <Text style={styles.pickerOptionMeta}>
                      {seniority === 'all' ? 'No seniority filter applied.' : 'Filtered results stay fully visible.'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.secondaryButton}
                onPress={() => setShowSeniorityPicker(false)}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {user.role === 'recruiter' && activeSection === 'live' ? (
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Schedule Interview</Text>
            <Text style={styles.featureCopy}>Choose a registered candidate or switch to manual entry.</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.inlineButton, candidateEntryMode === 'existing' ? styles.sectionTabButtonActive : null]}
                onPress={() => {
                  setCandidateEntryMode('existing');
                  setInterviewCandidateName('');
                  setInterviewCandidateEmail('');
                  setInterviewCandidateId('');
                }}
              >
                <Text style={styles.inlineButtonText}>Registered</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.inlineButton, candidateEntryMode === 'manual' ? styles.sectionTabButtonActive : null]}
                onPress={() => {
                  setCandidateEntryMode('manual');
                  setInterviewCandidateId('');
                  setInterviewCandidateEmail('');
                }}
              >
                <Text style={styles.inlineButtonText}>Manual</Text>
              </TouchableOpacity>
            </View>

            {candidateEntryMode === 'existing' ? (
              <View style={styles.libraryStack}>
                {recruiterCandidates.length ? (
                  recruiterCandidates.slice(0, 6).map((candidate) => {
                    const isSelected = interviewCandidateId === candidate._id;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.82}
                        key={candidate._id}
                        style={[
                          styles.pickerOptionCard,
                          isSelected ? styles.pickerOptionCardActive : null,
                        ]}
                        onPress={() => {
                          setInterviewCandidateId(candidate._id);
                          setInterviewCandidateName(`${candidate.firstName} ${candidate.lastName}`.trim());
                          if (!interviewCandidateEmail.trim()) {
                            setInterviewCandidateEmail(candidate.email || '');
                          }
                        }}
                      >
                        <View style={styles.pickerOptionTitleRow}>
                          <Text style={styles.pickerOptionTitle}>
                            {candidate.firstName} {candidate.lastName}
                          </Text>
                          {isSelected ? <Text style={styles.pickerOptionSelected}>Active</Text> : null}
                        </View>
                        <Text style={styles.pickerOptionMeta}>{candidate.email}</Text>
                        <Text style={styles.pickerOptionMeta}>
                          Tap this card to fill candidate name and email.
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.featureCopy}>No registered candidates loaded yet.</Text>
                )}
                <Text style={styles.featureCopy}>Tap a name to populate the schedule fields.</Text>
                <TextInput
                  value={interviewCandidateEmail}
                  onChangeText={setInterviewCandidateEmail}
                  placeholder="Candidate e-mail (optional override)"
                  placeholderTextColor="rgba(148,163,184,0.75)"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            ) : (
              <View style={styles.libraryStack}>
                <TextInput
                  value={interviewCandidateName}
                  onChangeText={setInterviewCandidateName}
                  placeholder="Manual candidate name"
                  placeholderTextColor="rgba(148,163,184,0.75)"
                  style={styles.input}
                />
                <TextInput
                  value={interviewCandidateEmail}
                  onChangeText={setInterviewCandidateEmail}
                  placeholder="Manual candidate e-mail"
                  placeholderTextColor="rgba(148,163,184,0.75)"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            )}
            <TextInput
              value={interviewAssessmentId}
              onChangeText={setInterviewAssessmentId}
              placeholder="Assessment ID (optional)"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
            />
            <TextInput
              value={interviewWhen}
              onChangeText={setInterviewWhen}
              placeholder="Scheduled ISO datetime (e.g. 2026-06-15T15:00:00.000Z)"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              value={interviewRoomId}
              onChangeText={setInterviewRoomId}
              placeholder="Room ID (optional, auto-generated if empty)"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              value={interviewMeetingLink}
              onChangeText={setInterviewMeetingLink}
              placeholder="Meeting link (optional)"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
              autoCapitalize="none"
            />
            <TouchableOpacity activeOpacity={0.82}
              style={styles.inlineButton}
              onPress={handleScheduleInterview}
              disabled={actionLoading}
            >
              <Text style={styles.inlineButtonText}>
                {actionLoading ? 'Scheduling...' : 'Schedule Interview'}
              </Text>
            </TouchableOpacity>

            <TextInput
              value={roomIdInput}
              onChangeText={setRoomIdInput}
              placeholder="Join room by ID or full link"
              placeholderTextColor="rgba(148,163,184,0.75)"
              style={styles.input}
              autoCapitalize="none"
            />
            <TouchableOpacity activeOpacity={0.82}
              style={styles.inlineButton}
              onPress={() => handleJoinRoomById(roomIdInput)}
              disabled={actionLoading}
            >
              <Text style={styles.inlineButtonText}>{actionLoading ? 'Joining...' : 'Join Room By ID'}</Text>
            </TouchableOpacity>

            {latestRoomDetails ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Room: {latestRoomDetails.roomId}</Text>
              </View>
            ) : null}

            {recruiterCandidates.length ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Tip: tap a candidate button above to auto-fill candidate ID.</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#fb923c" />
            <Text style={styles.stateText}>Loading assessments...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Could not load data</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity activeOpacity={0.82} style={styles.inlineButton} onPress={handleRetry}>
              <Text style={styles.inlineButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : user.role === 'recruiter' ? (
          visibleRecruiterInterviews.length === 0 ? (
            <View style={[styles.stateCard, activeSection !== 'live' ? styles.hiddenSection : undefined]}>
              <Text style={styles.stateTitle}>No interviews yet</Text>
              <Text style={styles.stateText}>Schedule one interview to start your mobile recruiter flow.</Text>
            </View>
          ) : (
            visibleRecruiterInterviews.map((item, index) => (
              <AnimatedReveal
                key={item._id}
                delay={150 + Math.min(index * 45, 320)}
                duration={380}
                style={
                  activeSection !== 'live'
                    ? { ...styles.featureCard, ...styles.hiddenSection }
                    : styles.featureCard
                }
              >
                <Text style={styles.featureTitle}>{item.assessment?.title || 'Interview'}</Text>
                <Text style={styles.featureCopy}>
                  Candidate: {item.candidate?.firstName} {item.candidate?.lastName}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.status}</Text>
                  <Text style={styles.metaText}>{new Date(item.scheduledAt).toLocaleString()}</Text>
                  <Text style={styles.metaText}>Room: {item.roomId || 'not-generated'}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity activeOpacity={0.82}
                    style={styles.inlineButton}
                    onPress={() => handleGenerateInterviewRoom(item._id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.inlineButtonText}>
                      {actionLoading ? 'Working...' : item.roomId ? 'Regenerate Room' : 'Generate Room'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.82}
                    style={styles.inlineButton}
                    onPress={() => handleJoinRoomById(item.roomId || '')}
                    disabled={actionLoading || !item.roomId}
                  >
                    <Text style={styles.inlineButtonText}>Join Room</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.82}
                    style={styles.inlineButton}
                    onPress={() => handleUpdateInterviewStatus(item._id, 'completed')}
                    disabled={actionLoading || item.status === 'completed'}
                  >
                    <Text style={styles.inlineButtonText}>Mark Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.82}
                    style={styles.inlineButton}
                    onPress={() => handleUpdateInterviewStatus(item._id, 'cancelled')}
                    disabled={actionLoading || item.status === 'cancelled'}
                  >
                    <Text style={styles.inlineButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  {item.status === 'completed' ? (
                    <TouchableOpacity activeOpacity={0.82}
                      style={[styles.inlineButton, styles.deleteButton]}
                      onPress={() => handleDeleteInterview(item._id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </AnimatedReveal>
            ))
          )
        ) : (
          assessments.map((assessment, index) => {
            const challengeCount = assessment.challenges?.length ?? 0;

            return (
              <AnimatedReveal
                key={assessment._id}
                delay={150 + Math.min(index * 40, 320)}
                duration={380}
                style={styles.featureCard}
              >
                <Text style={styles.featureTitle}>{assessment.title}</Text>
                <Text style={styles.featureCopy}>
                  {assessment.description?.trim() || 'No description provided.'}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{assessment.durationMinutes} minutes</Text>
                  <Text style={styles.metaText}>{challengeCount} challenges</Text>
                  <Text style={styles.metaText}>{assessment.passingScore ?? 70}% pass</Text>
                </View>

                <Link href={`/assessment/${assessment._id}`} asChild>
                  <TouchableOpacity activeOpacity={0.82} style={styles.inlineButton}>
                    <Text style={styles.inlineButtonText}>Open Assessment</Text>
                  </TouchableOpacity>
                </Link>
              </AnimatedReveal>
            );
          })
        )}

        {user.role === 'recruiter' && selectedAssessmentForAttempts && activeSection === 'build' ? (
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Assessment Attempts</Text>
            <Text style={styles.featureCopy}>Loaded for assessment ID: {selectedAssessmentForAttempts}</Text>
            {assessmentAttempts.length === 0 ? (
              <Text style={styles.featureCopy}>No attempts found for this assessment yet.</Text>
            ) : (
              assessmentAttempts.slice(0, 6).map((attempt) => (
                <View key={attempt._id} style={{ marginTop: 10 }}>
                  <Text style={styles.metaText}>
                    {attempt.candidate?.firstName} {attempt.candidate?.lastName} · {attempt.status}
                  </Text>
                  <Text style={styles.featureCopy}>
                    Score: {attempt.totalScoreEarned}/{attempt.maxScore}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {user.role === 'recruiter' && activeSection === 'build' ? (
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Owned Assessments</Text>
            <Text style={styles.featureCopy}>
              Existing Assessments: full tests for candidates. Copy an assessment ID, load attempts,
              or send its first challenge ID into Create Assessment.
            </Text>
            {assessments.length === 0 ? (
              <Text style={styles.featureCopy}>No assessments yet.</Text>
            ) : (
              assessments.slice(0, 8).map((assessment) => (
                <View key={assessment._id} style={styles.miniCard}>
                  <Text style={styles.metaText}>{assessment.title}</Text>
                  <Text style={styles.featureCopy}>Assessment ID: {assessment._id}</Text>
                  <TouchableOpacity activeOpacity={0.82}
                    style={styles.inlineButton}
                    onPress={() => handleCopyAssessmentId(assessment._id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.inlineButtonText}>Copy Assessment ID</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.82}
                    style={styles.inlineButton}
                    onPress={() => handleUseAssessmentInBuilder(assessment)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.inlineButtonText}>Use First Challenge In Build</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.82}
                    style={styles.inlineButton}
                    onPress={() => handleLoadAssessmentAttempts(assessment._id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.inlineButtonText}>Load Attempts: {assessment.title}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.82}
                    style={styles.inlineButton}
                    onPress={() => handleDeleteAssessment(assessment._id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.inlineButtonText}>Delete Permanently</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : null}

        <TouchableOpacity activeOpacity={0.82} style={styles.secondaryButton} onPress={handleSignOut}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071524',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 26,
    gap: 14,
  },
  hero: {
    borderRadius: 30,
    padding: 18,
    backgroundColor: 'rgba(11,32,52,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(103,230,220,0.26)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  heroCopy: {
    marginTop: 18,
    color: 'rgba(226,232,240,0.82)',
    lineHeight: 23,
    fontSize: 15,
  },
  heroPill: {
    marginTop: 18,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(37,210,197,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(37,210,197,0.32)',
  },
  heroPillText: {
    color: '#9ef4ee',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(9,24,40,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 6,
    color: 'rgba(203,213,225,0.74)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHeader: {
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(249,115,22,0.55)',
    paddingLeft: 10,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionCopy: {
    marginTop: 8,
    color: 'rgba(203,213,225,0.78)',
    lineHeight: 22,
    fontSize: 14,
  },
  sectionTabsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'nowrap',
  },
  sectionTabButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
    backgroundColor: 'rgba(9,24,40,0.9)',
    alignItems: 'center',
  },
  sectionTabButtonActive: {
    borderColor: 'rgba(37,210,197,0.66)',
    backgroundColor: 'rgba(37,210,197,0.2)',
    shadowColor: '#25d2c5',
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTabText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionTabBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  featureCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(9,24,40,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
    shadowColor: '#020617',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  stateCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(9,24,40,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
    alignItems: 'center',
    gap: 10,
  },
  hiddenSection: {
    display: 'none',
  },
  stateTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  stateText: {
    color: 'rgba(203,213,225,0.78)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  featureTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
  },
  featureCopy: {
    marginTop: 8,
    color: 'rgba(203,213,225,0.78)',
    lineHeight: 22,
    fontSize: 14,
  },
  pickerHeader: {
    gap: 4,
  },
  pickerBody: {
    gap: 10,
  },
  pickerScroll: {
    maxHeight: 360,
    flexGrow: 0,
  },
  pickerScrollContent: {
    gap: 10,
    paddingRight: 2,
    paddingBottom: 4,
  },
  pickerOptionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.18)',
    backgroundColor: 'rgba(8,22,36,0.9)',
    padding: 12,
    gap: 4,
  },
  pickerOptionCardActive: {
    borderColor: 'rgba(251,146,60,0.45)',
    backgroundColor: 'rgba(251,146,60,0.12)',
  },
  pickerOptionTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  pickerOptionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
    flexGrow: 1,
    flexBasis: 0,
    lineHeight: 21,
    minWidth: 0,
  },
  pickerOptionMeta: {
    color: 'rgba(203,213,225,0.72)',
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 1,
  },
  pickerOptionBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(251,146,60,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.22)',
    color: '#fdba74',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pickerOptionSelected: {
    color: '#9ef4ee',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
    backgroundColor: 'rgba(8,22,36,0.88)',
    padding: 12,
    shadowColor: '#020617',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  libraryStack: {
    marginTop: 10,
    gap: 10,
  },
  metaText: {
    color: '#9ef4ee',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inlineButton: {
    marginTop: 14,
    borderRadius: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37,210,197,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(37,210,197,0.38)',
    paddingHorizontal: 14,
  },
  inlineButtonText: {
    color: '#9ef4ee',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  deleteButton: {
    backgroundColor: 'rgba(127,29,29,0.95)',
    borderColor: 'rgba(248,113,113,0.34)',
  },
  deleteButtonText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.22)',
    backgroundColor: 'rgba(6,18,31,0.9)',
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 15,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)',
    backgroundColor: 'rgba(15,23,42,0.94)',
    padding: 14,
    gap: 10,
  },
  successCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.45)',
    backgroundColor: 'rgba(22,163,74,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successText: {
    color: '#bbf7d0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  errorCard: {
    borderColor: 'rgba(248,113,113,0.45)',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  errorTextBanner: {
    color: '#fecaca',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
