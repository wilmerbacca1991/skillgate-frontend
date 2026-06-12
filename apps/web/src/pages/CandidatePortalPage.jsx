import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import {
  finalizeAssessmentRequest,
  getAssessmentsRequest,
  getChallengeByIdRequest,
  getChallengeHintRequest,
  getInterviewByRoomIdRequest,
  getMyInterviewsRequest,
  getMyNotificationsRequest,
  getMyAttemptRequest,
  deleteInterviewRequest,
  deleteNotificationRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  startAssessmentRequest,
  submitChallengeAnswerRequest
} from '../services/assessmentApi';
import {
  setCurrentAssessmentId,
  setCurrentChallengeId,
  setError,
  setLastFinalizeResult,
  setLastSubmissionResult,
  setLoading
} from '../features/assessments/assessmentSlice';
import { createPortalStyles } from '../styles/portalStyles';
import SkillGateBrand from '../components/SkillGateBrand';
import FieldHelp from '../components/FieldHelp';
import AccountPanel from '../components/AccountPanel';
import GlassToast from '../components/GlassToast';

const styles = createPortalStyles('candidate');
const COMPACT_LAYOUT_MAX_WIDTH = 1120;
const CANDIDATE_RAIL_STORAGE_KEY = 'skillgate.web.candidate.railOpen';

const resolveChallengeId = (challengeRef) => {
  if (!challengeRef) return '';
  if (typeof challengeRef === 'string') return challengeRef;
  return challengeRef._id || '';
};

const buildQuestionFromChallenge = (challenge) => {
  if (!challenge) return '';

  const description = String(challenge.description || '').trim();
  if (description) {
    return description;
  }

  const title = String(challenge.title || '').trim();
  if (title) {
    return `Solve this challenge: ${title}`;
  }

  return 'Solve the selected challenge based on the public examples below.';
};

const parseInputPreview = (value) => {
  const input = String(value || '').trim();
  if (!input) return 'No sample input provided.';

  const parts = input.split(';').map((item) => item.trim()).filter(Boolean);
  if (parts.length === 0) return input;

  return parts.join(' | ');
};

const resolveMonacoLanguage = (language) => {
  const normalized = String(language || '').trim().toLowerCase();
  if (!normalized) return 'plaintext';

  const map = {
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    python: 'python',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    cplusplus: 'cpp',
    c: 'c',
    csharp: 'csharp',
    cs: 'csharp',
    go: 'go',
    rust: 'rust',
    ruby: 'ruby',
    php: 'php',
    swift: 'swift',
    kotlin: 'kotlin',
    sql: 'sql',
    json: 'json'
  };

  return map[normalized] || 'plaintext';
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

const CandidatePortalPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const user = useSelector((state) => state.auth.user);
  const { loading, error, lastSubmissionResult, lastFinalizeResult } = useSelector(
    (state) => state.assessments
  );

  const [assessmentIdInput, setAssessmentIdInput] = useState('');
  const [challengeIdInput, setChallengeIdInput] = useState('');
  const [submittedOutput, setSubmittedOutput] = useState('3');
  const [startedAssessment, setStartedAssessment] = useState(null);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [attemptSummary, setAttemptSummary] = useState(null);
  const [hintResult, setHintResult] = useState(null);
  const [challengeDetailsById, setChallengeDetailsById] = useState({});
  const [myInterviews, setMyInterviews] = useState([]);
  const [myNotifications, setMyNotifications] = useState([]);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [activeSection, setActiveSection] = useState('assessments');
  const [actionNotice, setActionNotice] = useState({ type: '', message: '' });
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= COMPACT_LAYOUT_MAX_WIDTH : false
  );
  const [isRailOpen, setIsRailOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(CANDIDATE_RAIL_STORAGE_KEY) === '1';
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
    window.localStorage.setItem(CANDIDATE_RAIL_STORAGE_KEY, isRailOpen ? '1' : '0');
  }, [isRailOpen]);

  useEffect(() => {
    let frameId = 0;
    const sectionParam = searchParams.get('section');
    const assessmentParam = searchParams.get('assessmentId');

    frameId = window.requestAnimationFrame(() => {
      if (sectionParam === 'workspace' || sectionParam === 'assessments') {
        setActiveSection(sectionParam);
      }

      if (assessmentParam) {
        setAssessmentIdInput(assessmentParam);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [searchParams]);

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const response = await getAssessmentsRequest(accessToken);
        setAvailableAssessments(response.assessments || []);
      } catch (err) {
        dispatch(setError(err.message));
      }
    };

    if (accessToken) {
      loadAssessments();
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }

    if (user?.role && user.role !== 'candidate') {
      navigate('/recruiter');
    }
  }, [accessToken, navigate, user]);

  useEffect(() => {
    const loadCandidateActivity = async () => {
      try {
        const [interviewsResponse, notificationsResponse] = await Promise.all([
          getMyInterviewsRequest(accessToken),
          getMyNotificationsRequest(accessToken)
        ]);

        setMyInterviews(
          (interviewsResponse.interviews || []).filter(
            (interview) => interview?.status !== 'cancelled'
          )
        );
        setMyNotifications(notificationsResponse.notifications || []);
      } catch (err) {
        dispatch(setError(err.message));
      }
    };

    if (accessToken) {
      loadCandidateActivity();
    }
  }, [accessToken, dispatch]);

  const selectedAssessment = availableAssessments.find(
    (assessment) => assessment._id === assessmentIdInput.trim()
  );

  const selectedAssessmentChallenges = useMemo(() => {
    if (!selectedAssessment?.challenges?.length) {
      return [];
    }

    return [...selectedAssessment.challenges].sort(
      (first, second) => Number(first.order || 0) - Number(second.order || 0)
    );
  }, [selectedAssessment]);

  const selectedChallengeIndex = useMemo(() => {
    if (!selectedAssessmentChallenges.length) return -1;
    return selectedAssessmentChallenges.findIndex(
      (item) => resolveChallengeId(item.challenge) === challengeIdInput.trim()
    );
  }, [selectedAssessmentChallenges, challengeIdInput]);

  const handleAssessmentSelect = (assessment) => {
    setAssessmentIdInput(assessment._id);
    setActiveSection('workspace');
    setSearchParams({ section: 'workspace', assessmentId: assessment._id });

    const firstChallenge = assessment.challenges?.[0]?.challenge;
    setChallengeIdInput(resolveChallengeId(firstChallenge));
    setHintResult(null);
    setActionNotice({ type: 'success', message: 'Assessment selected. Workspace is ready.' });
  };

  const handleSelectChallenge = (challengeId) => {
    setChallengeIdInput(challengeId);
    dispatch(setCurrentChallengeId(challengeId));
    setHintResult(null);
  };

  const handleStartAssessment = async () => {
    const trimmedAssessmentId = assessmentIdInput.trim();

    if (!trimmedAssessmentId) {
      setActionNotice({ type: 'error', message: 'Select an assessment before starting.' });
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(''));
    setActionNotice({ type: '', message: '' });

    try {
      const response = await startAssessmentRequest(accessToken, trimmedAssessmentId);
      dispatch(setCurrentAssessmentId(trimmedAssessmentId));
      setStartedAssessment(response);
      setActiveSection('workspace');
      setSearchParams({ section: 'workspace', assessmentId: trimmedAssessmentId });
      setActionNotice({ type: 'success', message: 'Assessment started. You are now in the workspace.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to start assessment.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSubmitAnswer = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));
    setActionNotice({ type: '', message: '' });

    try {
      const response = await submitChallengeAnswerRequest(
        accessToken,
        assessmentIdInput.trim(),
        challengeIdInput.trim(),
        submittedOutput
      );
      dispatch(setCurrentChallengeId(challengeIdInput.trim()));
      dispatch(setLastSubmissionResult(response));
      setActionNotice({ type: 'success', message: 'Challenge answer submitted successfully.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to submit challenge answer.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFinalizeAssessment = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));
    setActionNotice({ type: '', message: '' });

    try {
      const response = await finalizeAssessmentRequest(accessToken, assessmentIdInput.trim());
      dispatch(setLastFinalizeResult(response));
      setActionNotice({ type: 'success', message: 'Assessment finalized successfully.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to finalize assessment.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRequestHint = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));
    setActionNotice({ type: '', message: '' });

    try {
      const response = await getChallengeHintRequest(
        accessToken,
        assessmentIdInput.trim(),
        challengeIdInput.trim(),
        submittedOutput
      );
      setHintResult(response);
      setActionNotice({ type: 'success', message: 'AI hint generated successfully.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to get AI hint.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    setActionNotice({ type: '', message: '' });
    try {
      await markNotificationReadRequest(accessToken, notificationId);
      setMyNotifications((current) =>
        current.map((item) => (item._id === notificationId ? { ...item, read: true } : item))
      );
      setActionNotice({ type: 'success', message: 'Notification marked as read.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to mark notification.' });
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setActionNotice({ type: '', message: '' });
    try {
      await markAllNotificationsReadRequest(accessToken);
      setMyNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setActionNotice({ type: 'success', message: 'All notifications marked as read.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to mark all notifications.' });
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!accessToken) {
      return;
    }

    const notification = myNotifications.find((item) => item._id === notificationId);
    if (!notification || !notification.read) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this read notification? This will remove it from your dashboard permanently.'
    );

    if (!confirmed) {
      return;
    }

    setActionNotice({ type: '', message: '' });
    try {
      await deleteNotificationRequest(accessToken, notificationId);
      const notificationsResponse = await getMyNotificationsRequest(accessToken);
      setMyNotifications(notificationsResponse.notifications || []);
      setActionNotice({ type: 'success', message: 'Notification deleted.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to delete notification.' });
    }
  };

  const handleDeleteInterview = async (interviewId) => {
    if (!accessToken) {
      return;
    }

    const interview = myInterviews.find((item) => item._id === interviewId);
    if (!interview || interview.status !== 'completed') {
      return;
    }

    const confirmed = window.confirm(
      'Delete this completed interview? This will remove it from your dashboard permanently.'
    );

    if (!confirmed) {
      return;
    }

    setActionNotice({ type: '', message: '' });
    try {
      await deleteInterviewRequest(accessToken, interviewId);
      setMyInterviews((current) => current.filter((item) => item._id !== interviewId));
      setActionNotice({ type: 'success', message: 'Interview deleted.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to delete interview.' });
    }
  };

  const handleLoadMyAttempt = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));
    setActionNotice({ type: '', message: '' });

    try {
      const response = await getMyAttemptRequest(accessToken, assessmentIdInput.trim());
      setAttemptSummary(response.attempt || null);
      setActionNotice({ type: 'success', message: 'Attempt summary loaded successfully.' });
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to load attempt summary.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleJoinRoomById = async (value) => {
    dispatch(setLoading(true));
    dispatch(setError(''));
    setActionNotice({ type: '', message: '' });

    try {
      const roomId = resolveRoomIdInput(value);
      if (!roomId) {
        throw new Error('Please enter a room ID from recruiter email.');
      }

      await getInterviewByRoomIdRequest(accessToken, roomId);
      setActionNotice({ type: 'success', message: 'Interview room validated. Joining now...' });
      navigate(`/interview-room?roomId=${encodeURIComponent(roomId)}`);
    } catch (err) {
      dispatch(setError(err.message));
      setActionNotice({ type: 'error', message: err.message || 'Failed to join interview room.' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const aiFeedback =
    lastSubmissionResult?.aiFeedback || lastSubmissionResult?.result?.aiFeedback || '';

  useEffect(() => {
    const loadChallengeDetails = async () => {
      if (!accessToken || !selectedAssessmentChallenges.length) {
        return;
      }

      const ids = selectedAssessmentChallenges
        .map((item) => resolveChallengeId(item.challenge))
        .filter(Boolean);

      const missingIds = ids.filter((id) => !challengeDetailsById[id]);
      if (!missingIds.length) {
        return;
      }

      try {
        const details = await Promise.all(
          missingIds.map(async (challengeId) => {
            const response = await getChallengeByIdRequest(accessToken, challengeId);
            return [challengeId, response.challenge];
          })
        );

        setChallengeDetailsById((current) => {
          const next = { ...current };
          details.forEach(([id, challenge]) => {
            next[id] = challenge;
          });
          return next;
        });
      } catch (err) {
        dispatch(setError(err.message));
      }
    };

    loadChallengeDetails();
  }, [accessToken, selectedAssessmentChallenges, challengeDetailsById, dispatch]);

  const selectedChallenge = useMemo(() => {
    if (!selectedAssessmentChallenges.length || !challengeIdInput.trim()) {
      return null;
    }

    const challengeId = challengeIdInput.trim();

    const detailedChallenge = challengeDetailsById[challengeId];
    if (detailedChallenge) {
      return detailedChallenge;
    }

    const fallback = selectedAssessmentChallenges.find(
      (item) => resolveChallengeId(item.challenge) === challengeId
    );

    return fallback?.challenge || null;
  }, [selectedAssessmentChallenges, challengeIdInput, challengeDetailsById]);

  const visibleSelectedChallengeTests = useMemo(() => {
    if (!selectedChallenge?.testCases?.length) {
      return [];
    }

    return selectedChallenge.testCases.filter((testCase) => !testCase.isHidden);
  }, [selectedChallenge]);

  const challengeQuestionText = useMemo(
    () => buildQuestionFromChallenge(selectedChallenge),
    [selectedChallenge]
  );

  const selectedChallengeLanguage = useMemo(
    () => resolveMonacoLanguage(selectedChallenge?.language),
    [selectedChallenge]
  );

  const submissionFormatCheck = useMemo(() => {
    const lines = String(submittedOutput || '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const expectedLines = visibleSelectedChallengeTests.length;
    if (!expectedLines) {
      return null;
    }

    if (lines.length === expectedLines) {
      return {
        status: 'ok',
        message: `Output format check passed: ${lines.length} line(s) for ${expectedLines} public test(s).`
      };
    }

    return {
      status: 'warn',
      message: `Output format check: you entered ${lines.length} line(s), but there are ${expectedLines} public test(s).`
    };
  }, [submittedOutput, visibleSelectedChallengeTests]);

  const canGoToPreviousChallenge = selectedChallengeIndex > 0;
  const canGoToNextChallenge =
    selectedChallengeIndex >= 0 && selectedChallengeIndex < selectedAssessmentChallenges.length - 1;

  const handleGoToPreviousChallenge = () => {
    if (!canGoToPreviousChallenge) return;
    const previous = selectedAssessmentChallenges[selectedChallengeIndex - 1];
    handleSelectChallenge(resolveChallengeId(previous?.challenge));
  };

  const handleGoToNextChallenge = () => {
    if (!canGoToNextChallenge) return;
    const next = selectedAssessmentChallenges[selectedChallengeIndex + 1];
    handleSelectChallenge(resolveChallengeId(next?.challenge));
  };

  const currentAssessmentDisplay = assessmentIdInput.trim() || 'No assessment selected yet';
  const currentChallengeDisplay = challengeIdInput.trim() || 'No challenge selected yet';
  const hasAssessmentSelection = Boolean(assessmentIdInput.trim());
  const hasChallengeSelection = Boolean(challengeIdInput.trim());
  const unreadNotificationCount = myNotifications.filter((item) => !item.read).length;
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

  return (
    <div style={styles.shell}>
      <GlassToast notice={actionNotice} onClose={() => setActionNotice({ type: '', message: '' })} />
      <div style={styles.container}>
        <header style={styles.hero}>
          <div style={styles.heroTop}>
            <div>
              <SkillGateBrand size="section" subtitle="Candidate experience" />
              <p style={styles.heroCopy}>
                Start an assessment, submit expected output answers, and review deterministic
                scoring plus feedback in one place.
                This layout is meant to feel like a real test-taking workspace instead of a
                raw form screen.
              </p>
            </div>
            <AccountPanel accessToken={accessToken} user={user} />
          </div>

          <div style={styles.badgeRow}>
            <span style={styles.badge}>Logged in: {user?.email || 'unknown'}</span>
            <span style={styles.badge}>Assessments: {availableAssessments.length}</span>
            <span style={styles.badge}>{loading ? 'Working...' : 'Ready'}</span>
          </div>

          <div style={styles.heroAccentLine} />

          <div style={styles.sectionSwitchRow}>
            {[
              { id: 'assessments', label: 'Assessments & Activity' },
              { id: 'workspace', label: 'Assessment Workspace' },
              { id: 'notifications', label: 'Notifications', badge: unreadNotificationCount },
              { id: 'interviews', label: 'My Interviews', badge: myInterviews.length }
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
              {actionNotice.message
                ? actionNotice.message
                : `Unread notifications: ${myNotifications.filter((item) => !item.read).length}`}
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

        {activeSection === 'assessments' ? (
        <div style={splitLayoutStyle}>
          <div style={styles.mainColumn}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Available Assessments</h2>
            <p style={styles.panelCopy}>
              Click a card to load the assessment ID automatically. That keeps the flow
              beginner-friendly and helps you practice the relationship between list views
              and action forms.
            </p>

            <div style={styles.stacked}>
              {availableAssessments.length === 0 ? (
                <div style={styles.emptyState}>No assessments found yet.</div>
              ) : (
                availableAssessments.map((assessment, index) => (
                  <button
                    key={assessment._id}
                    type="button"
                    onClick={() => handleAssessmentSelect(assessment)}
                    style={{
                      ...styles.assessmentCard,
                      animationDelay: `${Math.min(index * 45, 360)}ms`
                    }}
                  >
                    <strong style={styles.assessmentTitle}>{assessment.title}</strong>
                    <div style={styles.assessmentMeta}>
                      Duration: {assessment.durationMinutes} minutes
                      <br />
                      Passing score: {assessment.passingScore}
                      <br />
                      Challenges: {assessment.challenges?.length || 0}
                    </div>

                    {assessment.description ? (
                      <div style={{ ...styles.assessmentMeta, marginTop: 8 }}>
                        {assessment.description}
                      </div>
                    ) : null}

                    {assessment.challenges?.length ? (
                      <div style={styles.challengeTags}>
                        {assessment.challenges.map((item) => (
                          <span key={item.challenge?._id || item.order} style={styles.challengeTag}>
                            {item.challenge?.title || 'Challenge'}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                ))
              )}
            </div>

            {selectedAssessment ? (
              <div style={styles.selectedBox}>
                <h3 style={styles.selectedTitle}>Selected assessment</h3>
                <div style={styles.assessmentMeta}>
                  <strong>{selectedAssessment.title}</strong>
                  <br />
                  {selectedAssessment.description || 'No description provided yet.'}
                </div>
                <div style={styles.challengeTags}>
                  {selectedAssessment.challenges?.map((item) => (
                    <span key={item.challenge?._id || item.order} style={styles.challengeTag}>
                      {item.challenge?.title || 'Challenge'} · {item.points} pts
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div style={styles.subPanel}>
              <h3 style={styles.subPanelTitle}>How this flow works</h3>
              <p style={styles.panelCopy}>
                Pick an assessment card, let the workspace auto-fill the IDs, start the
                attempt, submit output, then reload the saved attempt summary.
              </p>
            </div>

          </section>
          </div>

          {shouldShowRail ? (
          <aside style={railColumnStyle}>
            <div style={railStickyStyle}>
              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Session Pulse</h3>
                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Assessments</p>
                    <p style={styles.statValue}>{availableAssessments.length}</p>
                  </div>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Interviews</p>
                    <p style={styles.statValue}>{myInterviews.length}</p>
                  </div>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Notifications</p>
                    <p style={styles.statValue}>{myNotifications.length}</p>
                  </div>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Status</p>
                    <p style={styles.statValue}>{loading ? 'Busy' : 'Ready'}</p>
                  </div>
                </div>
              </section>

              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Quick Route</h3>
                <p style={styles.panelCopy}>
                  Use this rail to jump directly into the coding workspace after selecting your assessment.
                </p>
                <div style={styles.actionRow}>
                  <button
                    type="button"
                    onClick={() => setActiveSection('workspace')}
                    style={styles.primaryButton}
                  >
                    Open Workspace
                  </button>
                </div>
              </section>
            </div>
          </aside>
          ) : null}

        </div>
        ) : null}

        {activeSection === 'workspace' ? (
        <div style={splitLayoutStyle}>
          <div style={styles.mainColumn}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Workspace</h2>
            <p style={styles.panelCopy}>
              This workspace now shows each challenge as a clear prompt. Read the question,
              check public examples, write your answer in the editor, then submit.
            </p>

            <div style={styles.selectedBox}>
              <h3 style={styles.selectedTitle}>Current selection</h3>
              <div style={styles.assessmentMeta}>
                <strong>Assessment ID:</strong> {currentAssessmentDisplay}
                <br />
                <strong>Challenge ID:</strong> {currentChallengeDisplay}
                <br />
                <strong>Challenge position:</strong>{' '}
                {selectedChallengeIndex >= 0
                  ? `${selectedChallengeIndex + 1} of ${selectedAssessmentChallenges.length}`
                  : 'Not selected'}
              </div>
            </div>

            {selectedAssessmentChallenges.length ? (
              <section style={{ ...styles.resultPanel, borderColor: 'rgba(125,211,252,0.4)' }}>
                <h3 style={styles.resultTitle}>Challenge navigator</h3>
                <p style={styles.panelCopy}>
                  Choose one challenge to focus on. Your submission is for the selected challenge only.
                </p>
                <div style={styles.chipRow}>
                  {selectedAssessmentChallenges.map((item, index) => {
                    const challengeId = resolveChallengeId(item.challenge);
                    const challengeTitle =
                      challengeDetailsById[challengeId]?.title || item.challenge?.title || `Challenge ${index + 1}`;
                    const isActive = challengeId === challengeIdInput.trim();

                    return (
                      <button
                        key={challengeId || index}
                        type="button"
                        onClick={() => handleSelectChallenge(challengeId)}
                        style={{
                          ...styles.secondaryButton,
                          ...(isActive
                            ? {
                                borderColor: 'rgba(96,165,250,0.8)',
                                background: 'rgba(37,99,235,0.22)'
                              }
                            : null)
                        }}
                      >
                        {index + 1}. {challengeTitle}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {selectedChallenge ? (
              <section style={{ ...styles.resultPanel, borderColor: 'rgba(96,165,250,0.42)' }}>
                <h3 style={styles.resultTitle}>Question</h3>
                <p style={styles.panelCopy}>
                  <strong>{selectedChallenge.title || 'Selected challenge'}</strong>
                </p>
                <p style={styles.panelCopy}>{challengeQuestionText}</p>
                <p style={styles.panelCopy}>
                  <strong>What to submit:</strong> Enter your answer in the editor as output text.
                  If multiple lines are required, place one output line per test case in order.
                </p>
                {visibleSelectedChallengeTests.length ? (
                  <div style={styles.chipRow}>
                    {visibleSelectedChallengeTests.map((testCase, index) => (
                      <span key={`${testCase.input}-${index}`} style={styles.chip}>
                        Example {index + 1}: input {parseInputPreview(testCase.input)} {'->'} expected {testCase.expectedOutput}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={styles.panelCopy}>No public examples are available for this challenge.</p>
                )}
                {selectedChallenge?.starterCode ? (
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => setSubmittedOutput(selectedChallenge.starterCode)}
                    >
                      Load starter template into editor
                    </button>
                  </div>
                ) : null}
                <div style={{ ...styles.actionRow, marginTop: 10 }}>
                  <button
                    type="button"
                    style={{
                      ...styles.secondaryButton,
                      ...(canGoToPreviousChallenge ? null : styles.disabledButton)
                    }}
                    disabled={!canGoToPreviousChallenge}
                    onClick={handleGoToPreviousChallenge}
                  >
                    Previous challenge
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.secondaryButton,
                      ...(canGoToNextChallenge ? null : styles.disabledButton)
                    }}
                    disabled={!canGoToNextChallenge}
                    onClick={handleGoToNextChallenge}
                  >
                    Next challenge
                  </button>
                </div>
              </section>
            ) : null}

            <div style={styles.formGrid}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel} htmlFor="assessment-id-input">
                  Assessment ID
                </label>
                <FieldHelp text="Choose from a card on the left, or paste an assessment id manually when testing API flows." />
              </div>
              <input
                id="assessment-id-input"
                value={assessmentIdInput}
                onChange={(e) => setAssessmentIdInput(e.target.value)}
                placeholder="Assessment ID"
                style={styles.input}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel} htmlFor="challenge-id-input">
                  Challenge ID
                </label>
                <FieldHelp text="This should match one challenge in the selected assessment. Auto-fills from the first challenge." />
              </div>
              <input
                id="challenge-id-input"
                value={challengeIdInput}
                onChange={(e) => {
                  setChallengeIdInput(e.target.value);
                  setHintResult(null);
                }}
                placeholder="Challenge ID"
                style={styles.input}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <label style={styles.formLabel} htmlFor="submitted-output-input">
                  Answer editor
                </label>
                <FieldHelp text="This is a VS Code-style editor for your answer. For current grading, submit expected output lines matching the public tests order." />
              </div>
              <div id="submitted-output-input" style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden' }}>
                <Editor
                  height="320px"
                  language={selectedChallengeLanguage}
                  value={submittedOutput}
                  onChange={(value) => setSubmittedOutput(value || '')}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2
                  }}
                />
              </div>
              {submissionFormatCheck ? (
                <div
                  style={{
                    borderRadius: 12,
                    padding: '10px 12px',
                    border:
                      submissionFormatCheck.status === 'ok'
                        ? '1px solid rgba(74,222,128,0.4)'
                        : '1px solid rgba(251,191,36,0.45)',
                    background:
                      submissionFormatCheck.status === 'ok'
                        ? 'rgba(22,163,74,0.12)'
                        : 'rgba(251,191,36,0.12)',
                    color:
                      submissionFormatCheck.status === 'ok'
                        ? '#bbf7d0'
                        : '#fde68a',
                    fontSize: 13,
                    lineHeight: 1.5
                  }}
                >
                  {submissionFormatCheck.message}
                </div>
              ) : null}
            </div>

            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={loading || !accessToken || !hasAssessmentSelection || !hasChallengeSelection}
                style={{
                  ...styles.primaryButton,
                  ...(loading || !accessToken || !hasAssessmentSelection || !hasChallengeSelection
                    ? styles.disabledButton
                    : null)
                }}
              >
                Submit This Challenge
              </button>
            </div>

            {selectedAssessment ? (
              <section style={{ ...styles.resultPanel, borderColor: 'rgba(96,165,250,0.42)' }}>
                <h3 style={styles.resultTitle}>Current assignment</h3>
                <p style={styles.panelCopy}>
                  {selectedAssessment.title} · {selectedAssessment.durationMinutes} minutes · Passing score {selectedAssessment.passingScore}
                </p>
                <p style={styles.panelCopy}>{selectedAssessment.description || 'No assignment description yet.'}</p>
                {selectedChallenge ? (
                  <>
                    <p style={styles.panelCopy}>
                      <strong>Active challenge:</strong> {selectedChallenge.title}
                    </p>
                    <p style={styles.panelCopy}>{selectedChallenge.description || 'No challenge description available.'}</p>
                    {visibleSelectedChallengeTests.length ? (
                      <div style={styles.chipRow}>
                        {visibleSelectedChallengeTests.map((testCase, index) => (
                          <span key={`${testCase.input}-${index}`} style={styles.chip}>
                            Test {index + 1}: {testCase.input} {'->'} {testCase.expectedOutput}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </section>
            ) : null}

            {startedAssessment ? (
              <section style={{ ...styles.resultPanel, borderColor: 'rgba(96,165,250,0.4)' }}>
                <h3 style={styles.resultTitle}>Assessment session ready</h3>
                <p style={styles.panelCopy}>
                  Your attempt has started. You can now submit outputs, request hints, and finalize when you are done.
                </p>
              </section>
            ) : null}

            {aiFeedback ? (
              <section style={styles.feedbackPanel}>
                <p style={styles.feedbackLabel}>AI feedback</p>
                <p style={styles.feedbackText}>{aiFeedback}</p>
              </section>
            ) : null}

            {lastSubmissionResult ? (
              <section style={{ ...styles.resultPanel, borderColor: 'rgba(203,213,225,0.4)' }}>
                <h3 style={styles.resultTitle}>Latest submission recorded</h3>
                <p style={styles.panelCopy}>
                  Passed {lastSubmissionResult?.result?.passedTests ?? 0} of {lastSubmissionResult?.result?.totalTests ?? 0} visible tests.
                  {typeof lastSubmissionResult?.result?.scoreEarned === 'number'
                    ? ` Score earned: ${lastSubmissionResult.result.scoreEarned}.`
                    : ''}
                </p>
              </section>
            ) : null}

            {lastFinalizeResult ? (
              <section style={{ ...styles.resultPanel, borderColor: 'rgba(125,211,252,0.4)' }}>
                <h3 style={styles.resultTitle}>Assessment finalized successfully</h3>
                <p style={styles.panelCopy}>
                  Your assessment is complete. Load your attempt summary to review saved scoring details.
                </p>
              </section>
            ) : null}

            {attemptSummary ? (
              <section style={{ ...styles.resultPanel, borderColor: 'rgba(252,211,77,0.4)' }}>
                <h3 style={styles.resultTitle}>Attempt summary loaded</h3>
                <p style={styles.panelCopy}>
                  Status: {attemptSummary.status || 'unknown'}
                  <br />
                  Score: {attemptSummary.totalScoreEarned ?? 0} / {attemptSummary.maxScore ?? 0}
                  <br />
                  Answers saved: {attemptSummary.answers?.length || 0}
                </p>
              </section>
            ) : null}

            {error ? <p style={styles.errorText}>{error}</p> : null}
          </section>
          </div>

          {shouldShowRail ? (
          <aside style={railColumnStyle}>
            <div style={railStickyStyle}>
              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Control Rail</h3>
                <p style={styles.panelCopy}>
                  Core assessment actions are grouped here so your main area stays focused on the prompt and editor.
                </p>
                <div style={styles.actionRow}>
                  <button
                    type="button"
                    onClick={handleStartAssessment}
                    disabled={loading || !accessToken || !hasAssessmentSelection}
                    style={{
                      ...styles.primaryButton,
                      ...(loading || !accessToken || !hasAssessmentSelection ? styles.disabledButton : null)
                    }}
                  >
                    Start Assessment
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizeAssessment}
                    disabled={loading || !accessToken || !hasAssessmentSelection}
                    style={{
                      ...styles.secondaryButton,
                      ...(loading || !accessToken || !hasAssessmentSelection ? styles.disabledButton : null)
                    }}
                  >
                    Finalize Assessment
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadMyAttempt}
                    disabled={loading || !accessToken || !hasAssessmentSelection}
                    style={{
                      ...styles.secondaryButton,
                      ...(loading || !accessToken || !hasAssessmentSelection ? styles.disabledButton : null)
                    }}
                  >
                    Load My Attempt
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestHint}
                    disabled={loading || !accessToken || !assessmentIdInput.trim() || !challengeIdInput.trim()}
                    style={{
                      ...styles.secondaryButton,
                      ...(loading || !accessToken || !assessmentIdInput.trim() || !challengeIdInput.trim()
                        ? styles.disabledButton
                        : null)
                    }}
                  >
                    Get AI Hint
                  </button>
                </div>

                {hintResult?.hint ? (
                  <section style={{ ...styles.resultPanel, borderColor: 'rgba(251,191,36,0.4)', marginTop: 6 }}>
                    <h3 style={styles.resultTitle}>AI Hint</h3>
                    <p style={styles.panelCopy}>{hintResult.hint}</p>
                    <p style={styles.panelCopy}>
                      Hints used: {hintResult.hintCount ?? 0}/{hintResult.hintLimit ?? 0}
                    </p>
                  </section>
                ) : null}
              </section>

              <section style={styles.panel}>
                <h3 style={styles.subPanelTitle}>Live Selection</h3>
                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Assessment</p>
                    <p style={styles.statValue}>{hasAssessmentSelection ? 'Set' : 'None'}</p>
                  </div>
                  <div style={styles.statCard}>
                    <p style={styles.statLabel}>Challenge</p>
                    <p style={styles.statValue}>{hasChallengeSelection ? 'Set' : 'None'}</p>
                  </div>
                </div>
              </section>
            </div>
          </aside>
          ) : null}
        </div>
        ) : null}

        {activeSection === 'notifications' ? (
        <div style={splitLayoutStyle}>
          <div style={styles.mainColumn}>
            <section style={styles.panel}>
              <h2 style={styles.panelTitle}>Notifications</h2>
              <p style={styles.panelCopy}>
                Keep track of assessment updates, interview updates, and system messages here.
              </p>

              <div style={styles.actionRow}>
                <button
                  type="button"
                  onClick={handleMarkAllNotificationsRead}
                  disabled={!myNotifications.length || !accessToken}
                  style={{
                    ...styles.secondaryButton,
                    ...(!myNotifications.length || !accessToken ? styles.disabledButton : null)
                  }}
                >
                  Mark All Read
                </button>
              </div>

              {myNotifications.length === 0 ? (
                <div style={styles.emptyState}>No notifications yet.</div>
              ) : (
                <div style={styles.stacked}>
                  {myNotifications.slice(0, 8).map((item, index) => (
                    <div
                      key={item._id}
                      style={{
                        ...styles.listCard,
                        animationDelay: `${Math.min(index * 55, 320)}ms`
                      }}
                    >
                      <strong style={styles.listTitle}>
                        {item.read ? 'Read' : 'Unread'} · {item.title}
                      </strong>
                      <div style={styles.listMeta}>{item.message}</div>
                      <div style={styles.actionRow}>
                        {!item.read ? (
                          <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={() => handleMarkNotificationRead(item._id)}
                          >
                            Mark Read
                          </button>
                        ) : null}
                        {item.read ? (
                          <button
                            type="button"
                            style={{
                              ...styles.secondaryButton,
                              borderColor: 'rgba(248,113,113,0.34)',
                              background: 'linear-gradient(145deg, rgba(69,10,10,0.92) 0%, rgba(24,4,4,0.88) 100%)',
                              color: '#fecaca'
                            }}
                            onClick={() => handleDeleteNotification(item._id)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
        ) : null}

        {activeSection === 'interviews' ? (
        <div style={splitLayoutStyle}>
          <div style={styles.mainColumn}>
            <section style={styles.panel}>
              <h2 style={styles.panelTitle}>My Interviews</h2>
              <p style={styles.panelCopy}>
                Join scheduled interviews directly by room ID or use the invite data from your recruiter.
              </p>

              <div style={styles.formGrid}>
                <input
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="Paste room ID from recruiter email"
                  style={styles.input}
                />
              </div>

              <div style={styles.actionRow}>
                <button
                  type="button"
                  onClick={() => handleJoinRoomById(roomIdInput)}
                  disabled={loading || !accessToken || !roomIdInput.trim()}
                  style={{
                    ...styles.secondaryButton,
                    ...(loading || !accessToken || !roomIdInput.trim() ? styles.disabledButton : null)
                  }}
                >
                  Join Room With ID
                </button>
              </div>

              {myInterviews.length === 0 ? (
                <div style={styles.emptyState}>No interviews scheduled yet.</div>
              ) : (
                <div style={styles.stacked}>
                  {myInterviews.slice(0, 6).map((item, index) => (
                    <div
                      key={item._id}
                      style={{
                        ...styles.listCard,
                        animationDelay: `${Math.min(index * 55, 300)}ms`
                      }}
                    >
                      <strong style={styles.listTitle}>{item.assessment?.title || 'Interview'}</strong>
                      <div style={styles.listMeta}>
                        Status: {item.status}
                        <br />
                        Scheduled: {new Date(item.scheduledAt).toLocaleString()}
                        <br />
                        Room ID: {item.roomId || 'Waiting for recruiter'}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          disabled={!item.roomId}
                          onClick={() => handleJoinRoomById(item.roomId || '')}
                        >
                          Join This Interview Room
                        </button>
                        {item.status === 'completed' ? (
                          <button
                            type="button"
                            style={{
                              ...styles.secondaryButton,
                              marginLeft: 10,
                              borderColor: 'rgba(248,113,113,0.34)',
                              background: 'linear-gradient(145deg, rgba(69,10,10,0.92) 0%, rgba(24,4,4,0.88) 100%)',
                              color: '#fecaca'
                            }}
                            onClick={() => handleDeleteInterview(item._id)}
                          >
                            Delete Interview
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
};

export default CandidatePortalPage;
