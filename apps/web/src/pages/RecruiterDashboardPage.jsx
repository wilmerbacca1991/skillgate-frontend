import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  createAssessmentRequest,
  createChallengeRequest,
  deleteAssessmentRequest,
  deleteChallengeRequest,
  deleteRecruiterCandidateRequest,
  deleteInterviewRequest,
  generateInterviewRoomRequest,
  getAssessmentsRequest,
  getChallengesRequest,
  getInterviewByRoomIdRequest,
  getAssessmentAttemptsForRecruiterRequest,
  getMyInterviewsRequest,
  getRecruiterCandidatesRequest,
  getRecruiterSummaryRequest,
  scheduleInterviewRequest,
  updateChallengeRequest,
  updateInterviewStatusRequest
} from '../services/assessmentApi';
import { setCreatedAssessment, setCreatedChallenge, setError, setLoading } from '../features/assessments/assessmentSlice';
import { createPortalStyles } from '../styles/portalStyles';
import SkillGateBrand from '../components/SkillGateBrand';
import FieldHelp from '../components/FieldHelp';
import AccountPanel from '../components/AccountPanel';
import GlassToast from '../components/GlassToast';
import BrandedSelect from '../components/BrandedSelect';

const styles = createPortalStyles('recruiter');
const COMPACT_LAYOUT_MAX_WIDTH = 1120;
const RECRUITER_RAIL_STORAGE_KEY = 'skillgate.web.recruiter.railOpen';

const emptyChallengeForm = {
  title: 'Add Two Numbers',
  description: 'Return the sum of two integers',
  difficulty: 'easy',
  language: 'javascript',
  starterCode: 'function solve(a, b) {\n  return a + b;\n}',
  tags: 'math,arrays',
  input: '1 2',
  expectedOutput: '3'
};

const emptyAssessmentForm = {
  title: 'JS Basics Timed Test',
  description: 'Multi challenge timed test',
  durationMinutes: 30,
  passingScore: 60,
  assignedCandidates: [],
  challenges: [
    {
      challengeId: '',
      points: 100,
      order: 1
    }
  ]
};

const generateDraftRoomId = () =>
  `sg-${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 6)}`;

const buildRoomLinkFromRoomId = (roomId) => {
  const baseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:5173';
  return `${baseUrl}/interview-room?roomId=${encodeURIComponent(roomId)}`;
};

const resolveRoomIdInput = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const linkMatch = raw.match(/[?&]roomId=([^&#]+)/i);
  const candidate = linkMatch?.[1] ? decodeURIComponent(linkMatch[1]) : raw;

  return candidate
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
};

const RecruiterDashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const user = useSelector((state) => state.auth.user);
  const { loading, error } = useSelector(
    (state) => state.assessments
  );

  const [challengeForm, setChallengeForm] = useState(emptyChallengeForm);
  const [assessmentForm, setAssessmentForm] = useState(emptyAssessmentForm);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [assessmentAttempts, setAssessmentAttempts] = useState([]);
  const [attemptsLoadedForAssessmentId, setAttemptsLoadedForAssessmentId] = useState('');
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [myInterviews, setMyInterviews] = useState([]);
  const [manualRoomId, setManualRoomId] = useState('');
  const [latestRoomResult, setLatestRoomResult] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [challengeSearchQuery, setChallengeSearchQuery] = useState('');
  const [challengeDifficultyFilter, setChallengeDifficultyFilter] = useState('all');
  const [challengeSeniorityFilter, setChallengeSeniorityFilter] = useState('all');
  const [editingChallengeId, setEditingChallengeId] = useState('');
  const [challengeEditForm, setChallengeEditForm] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    language: 'javascript'
  });
  const [candidateEntryMode, setCandidateEntryMode] = useState('existing');
  const [interviewForm, setInterviewForm] = useState({
    candidateId: '',
    candidateName: '',
    candidateEmail: '',
    assessmentId: '',
    scheduledAt: '',
    durationMinutes: 60,
    timezone: 'UTC',
    roomId: '',
    meetingLink: '',
    notes: ''
  });
  const [copiedChallengeId, setCopiedChallengeId] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [actionNotice, setActionNotice] = useState({ type: '', message: '' });
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= COMPACT_LAYOUT_MAX_WIDTH : false
  );
  const [isRailOpen, setIsRailOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(RECRUITER_RAIL_STORAGE_KEY) === '1';
  });

  useEffect(() => {
    const handleResize = () => {
      const compact = window.innerWidth <= COMPACT_LAYOUT_MAX_WIDTH;
      setIsCompactLayout(compact);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RECRUITER_RAIL_STORAGE_KEY, isRailOpen ? '1' : '0');
  }, [isRailOpen]);

  const refreshDashboardData = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    try {
      const [challengesResponse, assessmentsResponse, candidatesResponse, summaryResponse, interviewsResponse] = await Promise.all([
        getChallengesRequest(accessToken),
        getAssessmentsRequest(accessToken),
        getRecruiterCandidatesRequest(accessToken),
        getRecruiterSummaryRequest(accessToken),
        getMyInterviewsRequest(accessToken)
      ]);

      setAvailableChallenges(challengesResponse.challenges || []);
      setAvailableAssessments(assessmentsResponse.assessments || []);
      setAvailableCandidates(candidatesResponse.candidates || []);
      setSummaryMetrics(summaryResponse.metrics || null);
      setMyInterviews(interviewsResponse.interviews || []);
    } catch (err) {
      dispatch(setError(err.message));
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) {
        return;
      }

      try {
        await refreshDashboardData();
      } catch (err) {
        dispatch(setError(err.message));
      }
    };

    if (accessToken) {
      loadData();
    }
  }, [accessToken, dispatch, refreshDashboardData]);

  const handleCandidateModeChange = (nextMode) => {
    setCandidateEntryMode(nextMode);

    if (nextMode === 'manual') {
      setInterviewForm((current) => ({
        ...current,
        candidateId: '',
        candidateEmail: ''
      }));
      return;
    }

    setInterviewForm((current) => ({
      ...current,
      candidateId: '',
      candidateName: '',
      candidateEmail: ''
    }));
  };

  const handleScheduleInterview = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const isManualCandidate = candidateEntryMode === 'manual';
      if (
        !interviewForm.scheduledAt ||
        (!isManualCandidate && !interviewForm.candidateId) ||
        (isManualCandidate && (!interviewForm.candidateName.trim() || !interviewForm.candidateEmail.trim()))
      ) {
        throw new Error(
          isManualCandidate
            ? 'Manual candidate name, email, and schedule time are required.'
            : 'Candidate and schedule time are required.'
        );
      }

      if (interviewForm.assessmentId && !/^[a-f0-9]{24}$/.test(interviewForm.assessmentId.trim())) {
        throw new Error('Assessment ID must be a valid 24-character ID. Leave blank if not using an assessment.');
      }

      const scheduleResponse = await scheduleInterviewRequest(accessToken, {
        candidateId: isManualCandidate ? undefined : interviewForm.candidateId,
        candidateName: isManualCandidate ? interviewForm.candidateName.trim() : undefined,
        candidateEmail: interviewForm.candidateEmail || undefined,
        assessmentId: interviewForm.assessmentId || undefined,
        scheduledAt: interviewForm.scheduledAt,
        durationMinutes: Number(interviewForm.durationMinutes),
        timezone: interviewForm.timezone,
        roomId: interviewForm.roomId?.trim() || undefined,
        meetingLink: interviewForm.meetingLink,
        notes: interviewForm.notes
      });

      const [summaryResponse, interviewsResponse] = await Promise.all([
        getRecruiterSummaryRequest(accessToken),
        getMyInterviewsRequest(accessToken)
      ]);

      setSummaryMetrics(summaryResponse.metrics || null);
      setMyInterviews(interviewsResponse.interviews || []);
      const emailDelivery = scheduleResponse?.emailDelivery;
      const emailHint = emailDelivery?.sent
        ? ' Email invite sent.'
        : emailDelivery?.reason
          ? ` Email invite not sent (${emailDelivery.reason}).`
          : '';

      setActionNotice({
        type: emailDelivery?.sent === false ? 'error' : 'success',
        message: `Interview successfully scheduled!${emailHint}`
      });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to schedule interview.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateInterviewStatus = async (interviewId, status) => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      await updateInterviewStatusRequest(accessToken, interviewId, status);

      const [summaryResponse, interviewsResponse] = await Promise.all([
        getRecruiterSummaryRequest(accessToken),
        getMyInterviewsRequest(accessToken)
      ]);

      setSummaryMetrics(summaryResponse.metrics || null);
      setMyInterviews(interviewsResponse.interviews || []);
      setActionNotice({ type: 'success', message: `Interview marked as ${status}.` });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to update interview status.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGenerateRoom = async (interviewId) => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const roomResponse = await generateInterviewRoomRequest(accessToken, interviewId);
      setLatestRoomResult(roomResponse);

      const interviewsResponse = await getMyInterviewsRequest(accessToken);
      setMyInterviews(interviewsResponse.interviews || []);
      setActionNotice({ type: 'success', message: 'Room generated successfully.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to generate room.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteInterview = async (interviewId) => {
    if (!accessToken) {
      return;
    }

    const interview = visibleInterviews.find((item) => item._id === interviewId);
    if (!interview || interview.status !== 'completed') {
      return;
    }

    const confirmed = window.confirm(
      'Delete this completed interview? This will remove it from the dashboard permanently.'
    );

    if (!confirmed) {
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      await deleteInterviewRequest(accessToken, interviewId);
      const [summaryResponse, interviewsResponse] = await Promise.all([
        getRecruiterSummaryRequest(accessToken),
        getMyInterviewsRequest(accessToken)
      ]);

      setSummaryMetrics(summaryResponse.metrics || null);
      setMyInterviews(interviewsResponse.interviews || []);
      setActionNotice({ type: 'success', message: 'Interview deleted.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to delete interview.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCreateRoomIdForSchedule = () => {
    const roomId = generateDraftRoomId();
    setInterviewForm((current) => ({
      ...current,
      roomId,
      meetingLink: buildRoomLinkFromRoomId(roomId)
    }));
    setActionNotice({
      type: 'success',
      message: `New room ID created: ${roomId}. It is now inserted into scheduling.`
    });
  };

  const handleJoinRoom = async (roomIdValue) => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const roomId = resolveRoomIdInput(roomIdValue);
      if (!roomId) {
        throw new Error('Please provide a valid room ID or interview link.');
      }

      await getInterviewByRoomIdRequest(accessToken, roomId);
      navigate(`/interview-room?roomId=${encodeURIComponent(roomId)}`);
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to join room.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const challengePayload = useMemo(
    () => ({
      title: challengeForm.title,
      description: challengeForm.description,
      difficulty: challengeForm.difficulty,
      language: challengeForm.language,
      starterCode: challengeForm.starterCode,
      tags: challengeForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      testCases: [
        {
          input: challengeForm.input,
          expectedOutput: challengeForm.expectedOutput,
          isHidden: false
        }
      ]
    }),
    [challengeForm]
  );

  const getChallengeSeniority = (challenge) => {
    const tags = (challenge?.tags || []).map((tag) => String(tag).toLowerCase());
    if (tags.includes('junior')) return 'junior';
    if (tags.includes('intermediate')) return 'intermediate';
    if (tags.includes('senior')) return 'senior';
    return 'unspecified';
  };

  const getChallengeSubject = (challenge) => {
    const subjectTag = (challenge?.tags || []).find((tag) =>
      String(tag).toLowerCase().startsWith('subject:')
    );
    if (!subjectTag) {
      return 'General coding';
    }
    return String(subjectTag).split(':').slice(1).join(':').replace(/-/g, ' ');
  };

  const filteredChallenges = useMemo(() => {
    return (availableChallenges || []).filter((challenge) => {
      const title = String(challenge?.title || '').toLowerCase();
      const description = String(challenge?.description || '').toLowerCase();
      const query = challengeSearchQuery.trim().toLowerCase();
      const matchesQuery = !query || title.includes(query) || description.includes(query);
      const matchesDifficulty =
        challengeDifficultyFilter === 'all' || challenge?.difficulty === challengeDifficultyFilter;
      const matchesSeniority =
        challengeSeniorityFilter === 'all' ||
        getChallengeSeniority(challenge) === challengeSeniorityFilter;

      return matchesQuery && matchesDifficulty && matchesSeniority;
    });
  }, [
    availableChallenges,
    challengeSearchQuery,
    challengeDifficultyFilter,
    challengeSeniorityFilter
  ]);

  const visibleInterviews = (myInterviews || []).filter((interview) => interview?.status !== 'cancelled');
  const splitLayoutStyle = isCompactLayout
    ? { ...styles.splitLayout, gridTemplateColumns: '1fr' }
    : styles.splitLayout;
  const railStickyStyle = isCompactLayout
    ? { ...styles.railSticky, position: 'static' }
    : styles.railSticky;
  const shouldShowRail = !isCompactLayout || isRailOpen;
  const railColumnStyle = isCompactLayout
    ? { ...styles.railColumn, animation: 'portalRailIn 240ms ease both' }
    : styles.railColumn;

  const handleCreateChallenge = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const response = await createChallengeRequest(accessToken, challengePayload);
      dispatch(setCreatedChallenge(response.challenge));
      await refreshDashboardData();
      setAssessmentForm((current) => {
        const nextRows = [...current.challenges];

        if (nextRows.length === 0) {
          nextRows.push({ challengeId: response.challenge._id, points: 100, order: 1 });
        } else if (!nextRows[0].challengeId) {
          nextRows[0] = { ...nextRows[0], challengeId: response.challenge._id };
        }

        return {
          ...current,
          challenges: nextRows
        };
      });
      setActionNotice({ type: 'success', message: 'Challenge successfully created!' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to create challenge.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCreateAssessment = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const validationError = validateAssessmentChallenges();
      if (validationError) {
        throw new Error(validationError);
      }

      const response = await createAssessmentRequest(accessToken, {
        title: assessmentForm.title,
        description: assessmentForm.description,
        durationMinutes: Number(assessmentForm.durationMinutes),
        passingScore: Number(assessmentForm.passingScore),
        assignedCandidates: assessmentForm.assignedCandidates,
        challenges: assessmentForm.challenges.map((row) => ({
          challenge: row.challengeId,
          points: Number(row.points),
          order: Number(row.order)
        }))
      });

      dispatch(setCreatedAssessment(response.assessment));
      await refreshDashboardData();
      setActionNotice({ type: 'success', message: 'Assessment successfully created!' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to create assessment.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!window.confirm('Delete this assessment permanently?')) {
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      await deleteAssessmentRequest(accessToken, assessmentId);

      if (selectedAssessmentId === assessmentId) {
        setSelectedAssessmentId('');
        setAttemptsLoadedForAssessmentId('');
        setAssessmentAttempts([]);
      }

      await refreshDashboardData();
      setActionNotice({ type: 'success', message: 'Assessment deleted permanently.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to delete assessment.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLoadAttempts = async (assessmentId) => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const response = await getAssessmentAttemptsForRecruiterRequest(accessToken, assessmentId);
      setSelectedAssessmentId(assessmentId);
      setAssessmentAttempts(response.attempts || []);
      setAttemptsLoadedForAssessmentId(assessmentId);
      setActionNotice({ type: 'success', message: 'Candidate attempts loaded successfully.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to load attempts.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleStartEditChallenge = (challenge) => {
    setEditingChallengeId(challenge._id);
    setChallengeEditForm({
      title: challenge.title || '',
      description: challenge.description || '',
      difficulty: challenge.difficulty || 'easy',
      language: challenge.language || 'javascript'
    });
  };

  const handleSaveChallengeEdit = async (challenge) => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      await updateChallengeRequest(accessToken, challenge._id, {
        title: challengeEditForm.title.trim(),
        description: challengeEditForm.description.trim(),
        difficulty: challengeEditForm.difficulty,
        language: challengeEditForm.language.trim() || 'javascript',
        starterCode: challenge.starterCode || '',
        tags: challenge.tags || [],
        testCases: (challenge.testCases || []).length
          ? challenge.testCases
          : [
              {
                input: 'sample',
                expectedOutput: 'sample',
                isHidden: false
              }
            ]
      });

      setEditingChallengeId('');
      await refreshDashboardData();
      setActionNotice({ type: 'success', message: 'Challenge updated successfully.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to update challenge.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm('Delete this challenge from your library?')) {
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      await deleteChallengeRequest(accessToken, challengeId);
      if (editingChallengeId === challengeId) {
        setEditingChallengeId('');
      }
      await refreshDashboardData();
      setActionNotice({ type: 'success', message: 'Challenge deleted successfully.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to delete challenge.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteCandidate = async (candidate) => {
    if (!window.confirm(`Delete ${candidate.firstName} ${candidate.lastName} and all of their SkillGate data?`)) {
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      await deleteRecruiterCandidateRequest(accessToken, candidate._id);

      setAssessmentForm((current) => ({
        ...current,
        assignedCandidates: current.assignedCandidates.filter((candidateId) => candidateId !== candidate._id)
      }));

      setInterviewForm((current) =>
        current.candidateId === candidate._id
          ? {
              ...current,
              candidateId: '',
              candidateName: '',
              candidateEmail: ''
            }
          : current
      );

      await refreshDashboardData();
      setActionNotice({ type: 'success', message: 'Candidate deleted and removed from SkillGate.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to delete candidate.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const resolveChallengeId = (challengeRef) => {
    if (!challengeRef) return '';
    if (typeof challengeRef === 'string') return challengeRef;
    return challengeRef._id || '';
  };

  const applyChallengeIdToBuilder = (challengeId) => {
    if (!challengeId) {
      return;
    }

    setAssessmentForm((current) => {
      const nextRows = [...current.challenges];

      if (nextRows.length === 0) {
        nextRows.push({ challengeId, points: 100, order: 1 });
      } else {
        nextRows[0] = { ...nextRows[0], challengeId };
      }

      return {
        ...current,
        challenges: nextRows
      };
    });
  };

  const copyText = async (value) => {
    if (!value) return false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // Fallback below for browsers without clipboard permission.
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = value;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textArea);
      return copied;
    } catch {
      return false;
    }
  };

  const handleCopyAssessmentId = async (assessmentId) => {
    const copied = await copyText(assessmentId);

    if (copied) {
      setCopyFeedback(`Assessment ID copied: ${assessmentId}`);
    } else {
      setCopyFeedback('Could not access clipboard. Copy manually from the ID text.');
    }
  };

  const handleUseAssessmentInBuilder = async (assessment) => {
    const firstChallengeId = resolveChallengeId(assessment?.challenges?.[0]?.challenge);

    if (!firstChallengeId) {
      setCopyFeedback('This assessment has no challenge ID to reuse in Build Assessments.');
      return;
    }

    const copied = await copyText(firstChallengeId);
    setCopiedChallengeId(firstChallengeId);
    applyChallengeIdToBuilder(firstChallengeId);
    setActiveSection('builder');
    setCopyFeedback(
      copied
        ? 'First challenge ID copied and inserted into Build Assessments.'
        : 'Challenge ID inserted into Build Assessments.'
    );
  };

  const updateAssessmentChallengeRow = (index, patch) => {
    setAssessmentForm((current) => {
      const nextRows = current.challenges.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row
      );
      return { ...current, challenges: nextRows };
    });
  };

  const addAssessmentChallengeRow = () => {
    setAssessmentForm((current) => ({
      ...current,
      challenges: [
        ...current.challenges,
        {
          challengeId: '',
          points: 100,
          order: current.challenges.length + 1
        }
      ]
    }));
  };

  const removeAssessmentChallengeRow = (index) => {
    setAssessmentForm((current) => {
      const nextRows = current.challenges.filter((_, rowIndex) => rowIndex !== index);
      return {
        ...current,
        challenges: nextRows.length
          ? nextRows
          : [{ challengeId: '', points: 100, order: 1 }]
      };
    });
  };

  const validateAssessmentChallenges = () => {
    const rows = assessmentForm.challenges;
    if (!rows.length) return 'Add at least one challenge row.';

    const orders = new Set();

    for (const row of rows) {
      if (!row.challengeId) return 'Every challenge row needs a challenge ID.';
      if (!Number.isFinite(Number(row.points)) || Number(row.points) <= 0) {
        return 'Challenge points must be greater than 0.';
      }
      if (!Number.isFinite(Number(row.order)) || Number(row.order) < 1) {
        return 'Challenge order must be 1 or greater.';
      }
      if (orders.has(Number(row.order))) {
        return 'Challenge order values must be unique.';
      }
      orders.add(Number(row.order));

      const selectedChallenge = availableChallenges.find((c) => c._id === row.challengeId);
      const hasPublicTest =
        selectedChallenge?.testCases?.some((testCase) => !testCase.isHidden) ?? false;

      if (!hasPublicTest) {
        return 'Each selected challenge must include at least one public test case.';
      }
    }

    return null;
  };

  const toggleAssignedCandidate = (candidateId) => {
    setAssessmentForm((current) => {
      const exists = current.assignedCandidates.includes(candidateId);
      return {
        ...current,
        assignedCandidates: exists
          ? current.assignedCandidates.filter((id) => id !== candidateId)
          : [...current.assignedCandidates, candidateId]
      };
    });
  };

  const selectedAssessmentCandidates = useMemo(
    () =>
      (availableCandidates || []).filter((candidate) =>
        assessmentForm.assignedCandidates.includes(candidate._id)
      ),
    [availableCandidates, assessmentForm.assignedCandidates]
  );

  const dropdownDateLabel = (value) => {
    if (!value) return 'No date selected';

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleString();
  };

  return (
    <div style={styles.shell}>
      <GlassToast notice={actionNotice} onClose={() => setActionNotice({ type: '', message: '' })} />
      <div style={styles.container}>
        <header style={styles.hero}>
          <div style={styles.heroTop}>
            <div>
              <SkillGateBrand size="section" subtitle="Recruiter command center" />
              <p style={styles.heroCopy}>
                This page now acts like a workspace instead of a plain form. You can browse
                your challenge library, inspect assessments, and create new items from the
                same screen.
              </p>
            </div>
            <AccountPanel accessToken={accessToken} user={user} />
          </div>

          <div style={styles.badgeRow}>
            <span style={styles.badge}>Logged in: {user?.email || 'unknown'}</span>
            <span style={styles.badge}>Challenges: {availableChallenges.length}</span>
            <span style={styles.badge}>Assessments: {availableAssessments.length}</span>
            <span style={styles.badge}>
              {selectedAssessmentId ? 'Attempts loaded' : 'Pick an assessment'}
            </span>
            <span style={styles.badge}>
              Upcoming interviews: {summaryMetrics?.upcomingInterviews ?? 0}
            </span>
            <span style={styles.badge}>
              Completion rate: {summaryMetrics?.completionRate ?? 0}%
            </span>
          </div>

          <div style={styles.heroAccentLine} />

          <div style={styles.sectionSwitchRow}>
            {[
              { id: 'overview', label: 'Overview', badge: availableAssessments.length },
              { id: 'builder', label: 'Build', badge: availableChallenges.length },
              { id: 'live', label: 'Live Rooms', badge: visibleInterviews.length }
            ].map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveSection(section.id);
                  if (isCompactLayout) {
                    setIsRailOpen(false);
                  }
                }}
                style={{
                  ...styles.sectionSwitchButton,
                  ...(activeSection === section.id
                    ? styles.sectionSwitchButtonActive
                    : null)
                }}
              >
                <span style={styles.sectionSwitchButtonText}>{section.label}</span>
                {typeof section.badge === 'number' && section.badge > 0 ? (
                  <span style={styles.sectionSwitchBadge}>
                    {section.badge > 99 ? '99+' : section.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <section style={{ ...styles.subPanel, marginTop: 14 }}>
            <h3 style={styles.subPanelTitle}>Action Center</h3>
            <p style={styles.panelCopy}>
              {actionNotice.message || 'Create a room, schedule interviews, and monitor status updates from here.'}
            </p>
          </section>

          {isCompactLayout ? (
            <div style={styles.actionRow}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => setIsRailOpen((current) => !current)}
              >
                {isRailOpen ? 'Hide Side Rail' : 'Show Side Rail'}
              </button>
            </div>
          ) : null}

        </header>

        {activeSection === 'overview' ? (
        <div style={splitLayoutStyle}>
          <div style={styles.mainColumn}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Existing Challenges</h2>
            <p style={styles.panelCopy}>
              Step 1: Browse challenge templates. Step 2: choose one and copy/use its
              challenge ID in Build Assessments so it becomes part of an assessment.
            </p>

            <div style={styles.subPanel}>
              <h3 style={styles.subPanelTitle}>Challenge Library</h3>

            <div style={styles.formGrid}>
              <input
                value={challengeSearchQuery}
                onChange={(event) => setChallengeSearchQuery(event.target.value)}
                placeholder="Search by challenge name or subject"
                style={styles.input}
              />
              <div style={styles.actionRow}>
                <BrandedSelect
                  value={challengeDifficultyFilter}
                  onChange={setChallengeDifficultyFilter}
                  placeholder="Difficulty: All"
                  options={[
                    { value: 'all', label: 'Difficulty: All', description: 'Show every challenge in the library.' },
                    { value: 'easy', label: 'Easy', description: 'Starter-friendly tasks.', badge: 'Low' },
                    { value: 'medium', label: 'Medium', description: 'Balanced problem-solving tasks.', badge: 'Mid' },
                    { value: 'hard', label: 'Hard', description: 'Advanced interview challenges.', badge: 'High' }
                  ]}
                />
                <BrandedSelect
                  value={challengeSeniorityFilter}
                  onChange={setChallengeSeniorityFilter}
                  placeholder="Seniority: All"
                  options={[
                    { value: 'all', label: 'Seniority: All', description: 'Show every seniority level.' },
                    { value: 'junior', label: 'Junior', description: 'Early-career candidate track.', badge: 'JR' },
                    { value: 'intermediate', label: 'Intermediate', description: 'Mid-level engineering track.', badge: 'MID' },
                    { value: 'senior', label: 'Senior', description: 'Advanced system-thinking track.', badge: 'SR' }
                  ]}
                />
              </div>
            </div>

            <div style={styles.stacked}>
              {filteredChallenges.length === 0 ? (
                <div style={styles.emptyState}>No challenges found yet.</div>
              ) : (
                filteredChallenges.map((challenge, index) => (
                  <div
                    key={challenge._id}
                    onClick={() =>
                      setAssessmentForm((current) => {
                        const nextRows = [...current.challenges];

                        if (nextRows.length === 0) {
                          nextRows.push({ challengeId: challenge._id, points: 100, order: 1 });
                        } else if (!nextRows[0].challengeId) {
                          nextRows[0] = { ...nextRows[0], challengeId: challenge._id };
                        }

                        return {
                          ...current,
                          challenges: nextRows
                        };
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setAssessmentForm((current) => {
                          const nextRows = [...current.challenges];

                          if (nextRows.length === 0) {
                            nextRows.push({ challengeId: challenge._id, points: 100, order: 1 });
                          } else if (!nextRows[0].challengeId) {
                            nextRows[0] = { ...nextRows[0], challengeId: challenge._id };
                          }

                          return {
                            ...current,
                            challenges: nextRows
                          };
                        });
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      ...styles.listCard,
                      animationDelay: `${Math.min(index * 45, 360)}ms`
                    }}
                  >
                    <strong style={styles.listTitle}>{challenge.title}</strong>
                    <div style={styles.listMeta}>
                      Difficulty: {challenge.difficulty}
                      <br />
                      Seniority: {getChallengeSeniority(challenge)}
                      <br />
                      Subject: {getChallengeSubject(challenge)}
                      <br />
                      Language: {challenge.language}
                      <br />
                      Test cases: {challenge.testCases?.length || 0}
                    </div>

                    <div style={styles.actionRow}>
                      <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStartEditChallenge(challenge);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteChallenge(challenge._id);
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    {editingChallengeId === challenge._id ? (
                      <div style={{ ...styles.formGrid, marginTop: 12 }} onClick={(event) => event.stopPropagation()}>
                        <input
                          value={challengeEditForm.title}
                          onChange={(event) =>
                            setChallengeEditForm((current) => ({
                              ...current,
                              title: event.target.value
                            }))
                          }
                          placeholder="Challenge title"
                          style={styles.input}
                        />
                        <textarea
                          value={challengeEditForm.description}
                          onChange={(event) =>
                            setChallengeEditForm((current) => ({
                              ...current,
                              description: event.target.value
                            }))
                          }
                          rows={3}
                          placeholder="Challenge description"
                          style={styles.textarea}
                        />
                        <input
                          value={challengeEditForm.difficulty}
                          onChange={(event) =>
                            setChallengeEditForm((current) => ({
                              ...current,
                              difficulty: event.target.value
                            }))
                          }
                          placeholder="Difficulty"
                          style={styles.input}
                        />
                        <input
                          value={challengeEditForm.language}
                          onChange={(event) =>
                            setChallengeEditForm((current) => ({
                              ...current,
                              language: event.target.value
                            }))
                          }
                          placeholder="Language"
                          style={styles.input}
                        />
                        <div style={styles.actionRow}>
                          <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={() => handleSaveChallengeEdit(challenge)}
                          >
                            Save Challenge
                          </button>
                          <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={() => setEditingChallengeId('')}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {challenge.description ? (
                      <div style={{ ...styles.listMeta, marginTop: 8 }}>
                        {challenge.description}
                      </div>
                    ) : null}

                    {challenge.tags?.length ? (
                      <div style={styles.chipRow}>
                        {challenge.tags.map((tag) => (
                          <span key={tag} style={styles.chip}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            </div>

            <div style={styles.subPanel}>
              <h3 style={styles.subPanelTitle}>Existing Assessments</h3>
              <p style={styles.panelCopy}>
                These are complete tests assigned to candidates. Use them to copy assessment IDs,
                load candidate attempts, or reuse their first challenge in the builder.
              </p>
              {copyFeedback ? <p style={styles.panelCopy}>{copyFeedback}</p> : null}
              <div style={styles.stacked}>
                {availableAssessments.length === 0 ? (
                  <div style={styles.emptyState}>No assessments found yet.</div>
                ) : (
                  availableAssessments.map((assessment, index) => (
                    <div
                      key={assessment._id}
                      style={{
                        ...styles.listCard,
                        animationDelay: `${Math.min(index * 50, 360)}ms`
                      }}
                    >
                      <strong style={styles.listTitle}>{assessment.title}</strong>
                      <div style={{ ...styles.listMeta, marginTop: 6 }}>
                        Assessment ID: {assessment._id}
                      </div>
                      <div style={styles.listMeta}>
                        Duration: {assessment.durationMinutes} minutes
                        <br />
                        Passing score: {assessment.passingScore}
                        <br />
                        Challenges: {assessment.challenges?.length || 0}
                      </div>

                      {assessment.description ? (
                        <div style={{ ...styles.listMeta, marginTop: 8 }}>
                          {assessment.description}
                        </div>
                      ) : null}

                      {assessment.challenges?.length ? (
                        <div style={styles.chipRow}>
                          {assessment.challenges.map((item) => (
                            <span key={item.challenge?._id || item.order} style={styles.chip}>
                              {item.challenge?.title || 'Challenge'} · {item.points} pts
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div style={{ ...styles.actionRow, marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => handleCopyAssessmentId(assessment._id)}
                          style={styles.secondaryButton}
                        >
                          Copy Assessment ID
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUseAssessmentInBuilder(assessment)}
                          style={styles.secondaryButton}
                        >
                          Use First Challenge In Builder
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadAttempts(assessment._id)}
                          disabled={loading || !accessToken}
                          style={{
                            ...styles.secondaryButton,
                            ...(loading || !accessToken ? styles.disabledButton : null)
                          }}
                        >
                          Load Attempts
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssessment(assessment._id)}
                          disabled={loading || !accessToken}
                          style={{
                            ...styles.secondaryButton,
                            ...(loading || !accessToken ? styles.disabledButton : null)
                          }}
                        >
                          Delete Permanently
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={styles.subPanel}>
              <h3 style={styles.subPanelTitle}>Candidate Attempts</h3>

              {selectedAssessmentId ? (
                <p style={styles.panelCopy}>
                  Showing attempts for assessment ID: {selectedAssessmentId}
                </p>
              ) : null}

              {!attemptsLoadedForAssessmentId ? (
                <div style={styles.emptyState}>Select an assessment and click Load Attempts.</div>
              ) : assessmentAttempts.length === 0 ? (
                <div style={styles.emptyState}>No attempts found for this assessment yet.</div>
              ) : (
                <div style={styles.stacked}>
                  {assessmentAttempts.map((attempt, index) => (
                    <div
                      key={attempt._id}
                      style={{
                        ...styles.listCard,
                        animationDelay: `${Math.min(index * 55, 360)}ms`
                      }}
                    >
                      <strong style={styles.listTitle}>
                        {attempt.candidate?.firstName} {attempt.candidate?.lastName}
                      </strong>

                      <div style={styles.listMeta}>
                        Email: {attempt.candidate?.email || 'N/A'}
                        <br />
                        Status: {attempt.status}
                        <br />
                        Score: {attempt.totalScoreEarned} / {attempt.maxScore}
                      </div>

                      {attempt.answers?.length ? (
                        <div style={styles.chipRow}>
                          {attempt.answers.map((answer, index) => (
                            <span key={answer.challenge?._id || index} style={styles.chip}>
                              {answer.challenge?.title || 'Challenge'}: {answer.scoreEarned} pts
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
          </div>

          {shouldShowRail ? (
          <aside style={railColumnStyle}>
            <div style={railStickyStyle}>
              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Recruiter Pulse</h3>
                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Challenges</p>
                    <p style={styles.statValue}>{availableChallenges.length}</p>
                  </div>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Assessments</p>
                    <p style={styles.statValue}>{availableAssessments.length}</p>
                  </div>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Interviews</p>
                    <p style={styles.statValue}>{visibleInterviews.length}</p>
                  </div>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Status</p>
                    <p style={styles.statValue}>{loading ? 'Busy' : 'Ready'}</p>
                  </div>
                </div>
              </section>

              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Flow Shortcuts</h3>
                <p style={styles.panelCopy}>
                  Jump to build mode to create a new challenge and attach it to an assessment.
                </p>
                <div style={styles.actionRow}>
                  <button type="button" style={styles.primaryButton} onClick={() => setActiveSection('builder')}>
                    Open Builder
                  </button>
                  <button type="button" style={styles.secondaryButton} onClick={() => setActiveSection('live')}>
                    Open Interview Rooms
                  </button>
                </div>
              </section>
            </div>
          </aside>
          ) : null}

        </div>
        ) : null}

        {activeSection === 'builder' ? (
        <div style={splitLayoutStyle}>
          <div style={styles.mainColumn}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Create Challenge</h2>
            <p style={styles.panelCopy}>
              This form creates the challenge first, then reuses the new ID in the
              assessment form. That teaches the dependency between the two resources.
            </p>

            <div style={styles.formGrid}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel}>Title</label>
                <FieldHelp text="Use a clear challenge name candidates can understand quickly." />
              </div>
              <input
                value={challengeForm.title}
                onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                placeholder="Title"
                style={styles.input}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel}>Description</label>
                <FieldHelp text="Explain what the candidate should produce, plus any constraints." />
              </div>
              <textarea
                value={challengeForm.description}
                onChange={(e) =>
                  setChallengeForm({ ...challengeForm, description: e.target.value })
                }
                placeholder="Description"
                rows={3}
                style={styles.textarea}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel}>Difficulty</label>
                <FieldHelp text="Use values like easy, medium, or hard for consistent filtering." />
              </div>
              <input
                value={challengeForm.difficulty}
                onChange={(e) =>
                  setChallengeForm({ ...challengeForm, difficulty: e.target.value })
                }
                placeholder="Difficulty"
                style={styles.input}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel}>Language</label>
                <FieldHelp text="Set the primary coding language expected for this problem." />
              </div>
              <input
                value={challengeForm.language}
                onChange={(e) => setChallengeForm({ ...challengeForm, language: e.target.value })}
                placeholder="Language"
                style={styles.input}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel}>Starter code</label>
                <FieldHelp text="Optional scaffold candidates start from during the attempt." />
              </div>
              <textarea
                value={challengeForm.starterCode}
                onChange={(e) =>
                  setChallengeForm({ ...challengeForm, starterCode: e.target.value })
                }
                placeholder="Starter code"
                rows={4}
                style={styles.textarea}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel}>Tags</label>
                <FieldHelp text="Comma-separated tags like arrays, strings, or dynamic-programming." />
              </div>
              <input
                value={challengeForm.tags}
                onChange={(e) => setChallengeForm({ ...challengeForm, tags: e.target.value })}
                placeholder="Tags separated by commas"
                style={styles.input}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel}>Test input</label>
                <FieldHelp text="Input payload your deterministic test expects. Keep it non-empty." />
              </div>
              <input
                value={challengeForm.input}
                onChange={(e) => setChallengeForm({ ...challengeForm, input: e.target.value })}
                placeholder="Test input"
                style={styles.input}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel}>Expected output</label>
                <FieldHelp text="Exact output used by grading comparison for this test case." />
              </div>
              <input
                value={challengeForm.expectedOutput}
                onChange={(e) =>
                  setChallengeForm({ ...challengeForm, expectedOutput: e.target.value })
                }
                placeholder="Expected output"
                style={styles.input}
              />
            </div>

            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={handleCreateChallenge}
                disabled={loading || !accessToken}
                style={{
                  ...styles.primaryButton,
                  ...(loading || !accessToken ? styles.disabledButton : null)
                }}
              >
                Create Challenge
              </button>
            </div>

            <div style={styles.subPanel}>
              <h3 style={styles.subPanelTitle}>Create Assessment</h3>
              <div style={styles.formGrid}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <label style={styles.formLabel}>Title</label>
                  <FieldHelp text="Assessment name shown in recruiter and candidate dashboards." />
                </div>
                <input
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  placeholder="Title"
                  style={styles.input}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <label style={styles.formLabel}>Description</label>
                  <FieldHelp text="Brief overview of what this assessment tests." />
                </div>
                <textarea
                  value={assessmentForm.description}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, description: e.target.value })
                  }
                  placeholder="Description"
                  rows={3}
                  style={styles.textarea}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <label style={styles.formLabel}>Duration minutes</label>
                  <FieldHelp text="How long candidates have to complete this assessment." />
                </div>
                <input
                  type="number"
                  value={assessmentForm.durationMinutes}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, durationMinutes: e.target.value })
                  }
                  placeholder="Duration minutes"
                  style={styles.input}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <label style={styles.formLabel}>Passing score</label>
                  <FieldHelp text="Minimum final score required to pass, typically 0 to 100." />
                </div>
                <input
                  type="number"
                  value={assessmentForm.passingScore}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, passingScore: e.target.value })
                  }
                  placeholder="Passing score"
                  style={styles.input}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <h4 style={styles.subPanelTitle}>Assign Candidates</h4>
                {availableCandidates.length === 0 ? (
                  <div style={styles.emptyState}>No candidate users found.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {availableCandidates.map((candidate) => {
                      const isSelected = assessmentForm.assignedCandidates.includes(candidate._id);

                      return (
                        <div
                          key={candidate._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: 10,
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: isSelected
                              ? 'rgba(56,189,248,0.12)'
                              : 'rgba(255,255,255,0.03)',
                            cursor: 'default'
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAssignedCandidate(candidate._id)}
                            />
                            <span style={{ color: '#e2e8f0', display: 'grid', gap: 4 }}>
                              <span style={{ fontWeight: 700 }}>
                                {candidate.firstName} {candidate.lastName}
                              </span>
                              <span style={{ color: 'rgba(226,232,240,0.7)', fontSize: 12 }}>
                                {candidate.email}
                              </span>
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteCandidate(candidate)}
                            style={{
                              ...styles.secondaryButton,
                              minWidth: 92,
                              padding: '8px 12px',
                              borderColor: 'rgba(248,113,113,0.45)',
                              color: '#fecaca'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedAssessmentCandidates.length ? (
                  <div style={{ marginTop: 12, ...styles.listMeta }}>
                    Selected for this assessment: {selectedAssessmentCandidates.map((candidate) => `${candidate.firstName} ${candidate.lastName}`).join(', ')}
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                {assessmentForm.challenges.map((row, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      padding: 12,
                      display: 'grid',
                      gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <label style={styles.formLabel}>Challenge ID</label>
                      <FieldHelp text="Paste a challenge id from the challenge list so this assessment includes it." />
                    </div>
                    <BrandedSelect
                      value={row.challengeId}
                      onChange={(value) => updateAssessmentChallengeRow(index, { challengeId: value })}
                      placeholder="Select a challenge from library"
                      options={availableChallenges.map((challenge) => ({
                        value: challenge._id,
                        label: challenge.title,
                        description: `${challenge.difficulty || 'easy'} · ${challenge.language || 'javascript'} · ${challenge.testCases?.length || 0} test cases`,
                        badge: challenge.difficulty || 'easy'
                      }))}
                    />
                    {copiedChallengeId ? (
                      <button
                        type="button"
                        onClick={() => updateAssessmentChallengeRow(index, { challengeId: copiedChallengeId })}
                        style={styles.secondaryButton}
                      >
                        Paste Copied Challenge ID
                      </button>
                    ) : null}
                    <input
                      value={row.challengeId}
                      onChange={(e) => updateAssessmentChallengeRow(index, { challengeId: e.target.value })}
                      placeholder="Challenge ID (manual entry optional)"
                      style={styles.input}
                    />
                    {row.challengeId ? (
                      <div style={styles.listMeta}>
                        Selected challenge tests: {(availableChallenges.find((c) => c._id === row.challengeId)?.testCases || []).length}
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <label style={styles.formLabel}>Challenge points</label>
                      <FieldHelp text="Set score weight for this row. Total points affect max assessment score." />
                    </div>
                    <input
                      type="number"
                      value={row.points}
                      onChange={(e) => updateAssessmentChallengeRow(index, { points: e.target.value })}
                      placeholder="Challenge points"
                      style={styles.input}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <label style={styles.formLabel}>Challenge order</label>
                      <FieldHelp text="Controls challenge sequence shown to candidates, typically 1, 2, 3..." />
                    </div>
                    <input
                      type="number"
                      value={row.order}
                      onChange={(e) => updateAssessmentChallengeRow(index, { order: e.target.value })}
                      placeholder="Challenge order"
                      style={styles.input}
                    />
                    <button
                      type="button"
                      onClick={() => removeAssessmentChallengeRow(index)}
                      disabled={loading}
                      style={{
                        ...styles.secondaryButton,
                        ...(loading ? styles.disabledButton : null)
                      }}
                    >
                      Remove Row
                    </button>
                  </div>
                ))}
              </div>

              <div style={styles.actionRow}>
                <button
                  type="button"
                  onClick={addAssessmentChallengeRow}
                  disabled={loading || !accessToken}
                  style={{
                    ...styles.primaryButton,
                    ...(loading || !accessToken ? styles.disabledButton : null)
                  }}
                >
                  Add Challenge Row
                </button>

                <button
                  type="button"
                  onClick={handleCreateAssessment}
                  disabled={loading || !accessToken}
                  style={{
                    ...styles.secondaryButton,
                    ...(loading || !accessToken ? styles.disabledButton : null)
                  }}
                >
                  Create Assessment
                </button>
              </div>
            </div>

            {error ? <p style={styles.errorText}>{error}</p> : null}
          </section>
          </div>

          {shouldShowRail ? (
          <aside style={railColumnStyle}>
            <div style={railStickyStyle}>
              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Build Checklist</h3>
                <p style={styles.panelCopy}>1. Create challenge with at least one public test.</p>
                <p style={styles.panelCopy}>2. Add challenge rows and set unique order values.</p>
                <p style={styles.panelCopy}>3. Assign candidates before creating assessment.</p>
              </section>
              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Navigation</h3>
                <div style={styles.actionRow}>
                  <button type="button" style={styles.secondaryButton} onClick={() => setActiveSection('overview')}>
                    Back To Library
                  </button>
                  <button type="button" style={styles.primaryButton} onClick={() => setActiveSection('live')}>
                    Go To Interview Rooms
                  </button>
                </div>
              </section>
            </div>
          </aside>
          ) : null}
        </div>
        ) : null}

        {activeSection === 'live' ? (
        <div style={splitLayoutStyle}>
          <div style={styles.mainColumn}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Schedule Interview</h2>
            <div style={styles.formGrid}>
              <BrandedSelect
                value={candidateEntryMode}
                onChange={handleCandidateModeChange}
                placeholder="Select registered candidate"
                options={[
                  { value: 'existing', label: 'Select registered candidate', description: 'Pick from your registered candidate list.' },
                  { value: 'manual', label: 'Enter candidate manually', description: 'Type a name and email directly.' }
                ]}
              />

              {candidateEntryMode === 'existing' ? (
                <BrandedSelect
                  value={interviewForm.candidateId}
                  onChange={(nextCandidateId) => {
                    const selectedCandidate = (availableCandidates || []).find(
                      (item) => item._id === nextCandidateId
                    );

                    setInterviewForm({
                      ...interviewForm,
                      candidateId: nextCandidateId,
                      candidateName: `${selectedCandidate?.firstName || ''} ${selectedCandidate?.lastName || ''}`.trim(),
                      candidateEmail: selectedCandidate?.email || interviewForm.candidateEmail
                    });
                  }}
                  placeholder="Select candidate"
                  options={(availableCandidates || []).map((candidate) => ({
                    value: candidate._id,
                    label: `${candidate.firstName} ${candidate.lastName}`.trim(),
                    description: candidate.email,
                    badge: candidate._id === interviewForm.candidateId ? 'Active' : ''
                  }))}
                />
              ) : (
                <>
                  <input
                    value={interviewForm.candidateName}
                    onChange={(e) => setInterviewForm({ ...interviewForm, candidateName: e.target.value })}
                    placeholder="Manual candidate name"
                    style={styles.input}
                  />
                  <input
                    type="email"
                    value={interviewForm.candidateEmail}
                    onChange={(e) => setInterviewForm({ ...interviewForm, candidateEmail: e.target.value })}
                    placeholder="Manual candidate email"
                    style={styles.input}
                  />
                </>
              )}
              <input
                value={interviewForm.assessmentId}
                onChange={(e) => setInterviewForm({ ...interviewForm, assessmentId: e.target.value })}
                placeholder="Assessment ID (optional)"
                style={styles.input}
              />
              <input
                type="datetime-local"
                value={interviewForm.scheduledAt}
                onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
                title={dropdownDateLabel(interviewForm.scheduledAt)}
                style={styles.selectInput}
              />
              <input
                type="number"
                value={interviewForm.durationMinutes}
                onChange={(e) => setInterviewForm({ ...interviewForm, durationMinutes: e.target.value })}
                placeholder="Duration minutes"
                style={styles.input}
              />
              <input
                value={interviewForm.timezone}
                onChange={(e) => setInterviewForm({ ...interviewForm, timezone: e.target.value })}
                placeholder="Timezone"
                style={styles.input}
              />
              <input
                value={interviewForm.roomId}
                onChange={(e) => {
                  const nextRoomId = e.target.value;
                  setInterviewForm({
                    ...interviewForm,
                    roomId: nextRoomId,
                    meetingLink: nextRoomId
                      ? buildRoomLinkFromRoomId(nextRoomId)
                      : interviewForm.meetingLink
                  });
                }}
                placeholder="Room ID (optional, auto-generated if empty)"
                style={styles.input}
              />
              <input
                value={interviewForm.meetingLink}
                onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                placeholder="Meeting link"
                style={styles.input}
              />
              <textarea
                value={interviewForm.notes}
                onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                placeholder="Interview notes"
                rows={3}
                style={styles.textarea}
              />
            </div>

            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={handleCreateRoomIdForSchedule}
                disabled={loading || !accessToken}
                style={{
                  ...styles.secondaryButton,
                  ...(loading || !accessToken ? styles.disabledButton : null)
                }}
              >
                Create New Room ID
              </button>
              <button
                type="button"
                onClick={handleScheduleInterview}
                disabled={loading || !accessToken}
                style={{
                  ...styles.primaryButton,
                  ...(loading || !accessToken ? styles.disabledButton : null)
                }}
              >
                Schedule Interview
              </button>
            </div>

            <div style={styles.subPanel}>
              <h3 style={styles.subPanelTitle}>My Interviews</h3>
              <p style={styles.panelCopy}>
                Generate a room ID to share by email, or join directly using room ID or join link.
              </p>

              <div style={styles.formGrid}>
                <input
                  value={manualRoomId}
                  onChange={(e) => setManualRoomId(e.target.value)}
                  placeholder="Paste room ID or full interview link"
                  style={styles.input}
                />
              </div>
              <div style={styles.actionRow}>
                <button
                  type="button"
                  onClick={() => handleJoinRoom(manualRoomId)}
                  disabled={loading || !accessToken || !manualRoomId.trim()}
                  style={{
                    ...styles.secondaryButton,
                    ...(loading || !accessToken || !manualRoomId.trim() ? styles.disabledButton : null)
                  }}
                >
                  Join Room By ID
                </button>
              </div>

              {latestRoomResult?.roomId ? (
                <div style={styles.selectedBox}>
                  <h4 style={styles.selectedTitle}>Latest Generated Room</h4>
                  <div style={styles.assessmentMeta}>
                    Room ID: {latestRoomResult.roomId}
                    <br />
                    Link: {latestRoomResult.meetingLink}
                  </div>
                </div>
              ) : null}

              {visibleInterviews.length === 0 ? (
                <div style={styles.emptyState}>No interviews scheduled yet.</div>
              ) : (
                <div style={styles.stacked}>
                  {visibleInterviews.slice(0, 8).map((item, index) => (
                    <div
                      key={item._id}
                      style={{
                        ...styles.listCard,
                        animationDelay: `${Math.min(index * 50, 360)}ms`
                      }}
                    >
                      <strong style={styles.listTitle}>
                        {item.assessment?.title || 'Interview'} · {item.status}
                      </strong>
                      <div style={styles.listMeta}>
                        Candidate: {item.candidate?.firstName} {item.candidate?.lastName}
                        <br />
                        Scheduled: {new Date(item.scheduledAt).toLocaleString()}
                        <br />
                        Room ID: {item.roomId || 'Not generated yet'}
                      </div>
                      <div style={styles.actionRow}>
                        <button
                          type="button"
                          onClick={() => handleGenerateRoom(item._id)}
                          style={styles.secondaryButton}
                          disabled={loading || !accessToken}
                        >
                          {item.roomId ? 'Regenerate Room ID' : 'Generate Room ID'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJoinRoom(item.roomId || '')}
                          style={styles.secondaryButton}
                          disabled={loading || !item.roomId}
                        >
                          Join Room
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateInterviewStatus(item._id, 'completed')}
                          style={styles.secondaryButton}
                          disabled={loading || item.status === 'completed'}
                        >
                          Mark Completed
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateInterviewStatus(item._id, 'cancelled')}
                          style={styles.secondaryButton}
                          disabled={loading || item.status === 'cancelled'}
                        >
                          Cancel
                        </button>
                        {item.status === 'completed' ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteInterview(item._id)}
                            style={{
                              ...styles.secondaryButton,
                              borderColor: 'rgba(248,113,113,0.34)',
                              background: 'linear-gradient(145deg, rgba(69,10,10,0.92) 0%, rgba(24,4,4,0.88) 100%)',
                              color: '#fecaca'
                            }}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error ? <p style={styles.errorText}>{error}</p> : null}
          </section>
          </div>

          {shouldShowRail ? (
          <aside style={railColumnStyle}>
            <div style={railStickyStyle}>
              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Interview Ops</h3>
                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Scheduled</p>
                    <p style={styles.statValue}>{visibleInterviews.filter((item) => item.status === 'scheduled').length}</p>
                  </div>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Completed</p>
                    <p style={styles.statValue}>{visibleInterviews.filter((item) => item.status === 'completed').length}</p>
                  </div>
                </div>
              </section>

              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Quick Notes</h3>
                <p style={styles.panelCopy}>
                  Create a room ID first, schedule the interview, then share the generated link with the candidate.
                </p>
              </section>
            </div>
          </aside>
          ) : null}
        </div>
        ) : null}
      </div>
    </div>
  );
};

export default RecruiterDashboardPage;
