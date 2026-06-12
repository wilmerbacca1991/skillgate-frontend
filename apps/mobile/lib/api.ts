const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};

async function requestJson<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed with status ${response.status}`);
  }

  return payload as T;
}

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'admin';
  profileImageUrl?: string;
};

type LoginResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'candidate' | 'recruiter';
};

export type ChallengePreview = {
  _id: string;
  title: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
  tags?: string[];
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }[];
};

export type AssessmentSummary = {
  _id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore?: number;
  challenges?: {
    points: number;
    order: number;
    challenge: string | ChallengePreview;
  }[];
  createdAt?: string;
};

export type ChallengeDetails = {
  _id: string;
  title: string;
  description: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
  starterCode?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }[];
};

export type AttemptSummary = {
  _id: string;
  status: 'in_progress' | 'submitted' | 'expired';
  startedAt: string;
  submittedAt?: string;
  updatedAt?: string;
  totalScoreEarned: number;
  maxScore: number;
  answers: {
    submittedOutput?: string;
    passedTests?: number;
    totalTests?: number;
    scoreEarned: number;
    feedback?: string;
    aiFeedback?: string;
    challenge: {
      _id: string;
      title: string;
      difficulty?: string;
      language?: string;
    };
  }[];
  assessment: {
    _id: string;
    title: string;
    durationMinutes: number;
    passingScore: number;
  };
};

export type InterviewSummary = {
  _id: string;
  roomId?: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone?: string;
  meetingLink?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  assessment?: {
    _id: string;
    title: string;
  };
  recruiter?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  candidate?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type NotificationSummary = {
  _id: string;
  type: 'interview_scheduled' | 'interview_updated' | 'interview_cancelled' | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedInterview?: {
    _id: string;
    scheduledAt: string;
    status: string;
    meetingLink?: string;
    timezone?: string;
  };
};

export type RecruiterDashboardMetrics = {
  totalAssessments: number;
  totalAttempts: number;
  submittedAttempts: number;
  completionRate: number;
  upcomingInterviews: number;
  scheduledThisWeek: number;
};

export type RecruiterCandidate = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type RecruiterAttemptSummary = {
  _id: string;
  status: 'in_progress' | 'submitted' | 'expired';
  startedAt: string;
  submittedAt?: string;
  totalScoreEarned: number;
  maxScore: number;
  candidate?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  answers: {
    scoreEarned: number;
    challenge?: {
      _id: string;
      title: string;
      difficulty?: string;
      language?: string;
    };
  }[];
};

export async function loginRequest(email: string, password: string) {
  return requestJson<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(payload: RegisterPayload) {
  return requestJson<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAssessments(token: string) {
  return requestJson<{ assessments: AssessmentSummary[] }>('/api/assessments', {
    method: 'GET',
    token,
  });
}

export async function getChallengeById(token: string, challengeId: string) {
  return requestJson<{ challenge: ChallengeDetails }>(`/api/challenges/${challengeId}`, {
    method: 'GET',
    token,
  });
}

export async function startAssessmentRequest(token: string, assessmentId: string) {
  return requestJson<{ message: string; attemptId: string; startedAt: string }>(
    `/api/assessments/${assessmentId}/start`,
    {
      method: 'POST',
      token,
    }
  );
}

export async function submitChallengeAnswerRequest(
  token: string,
  assessmentId: string,
  challengeId: string,
  submittedOutput: string
) {
  return requestJson<{
    message: string;
    totalScoreEarned: number;
    result: {
      passedTests: number;
      totalTests: number;
      scoreEarned: number;
      feedback?: string;
      aiFeedback?: string;
    };
    grading?: {
      percentage: number;
      passedPublic: number;
      publicTotal: number;
      passedHidden: number;
      hiddenTotal: number;
      publicFailures: {
        index: number;
        input: string;
        expected: string;
        actual: string;
      }[];
      hiddenFailedCount: number;
    };
  }>(`/api/assessments/${assessmentId}/challenges/${challengeId}/submit`, {
    method: 'POST',
    token,
    body: JSON.stringify({ submittedOutput }),
  });
}

export async function finalizeAssessmentRequest(token: string, assessmentId: string) {
  return requestJson<{
    message: string;
    totalScoreEarned: number;
    maxScore: number;
  }>(`/api/assessments/${assessmentId}/finalize`, {
    method: 'POST',
    token,
  });
}

export async function getMyAssessmentAttempt(token: string, assessmentId: string) {
  return requestJson<{ attempt: AttemptSummary }>(`/api/assessments/${assessmentId}/attempt`, {
    method: 'GET',
    token,
  });
}

export async function getMeRequest(token: string) {
  return requestJson<{ user: AuthUser }>('/api/auth/me', {
    method: 'GET',
    token,
  });
}

export async function uploadProfileImageRequest(
  token: string,
  image: { uri: string; name: string; type: string }
) {
  const formData = new FormData();
  formData.append('image', image as any);

  const response = await fetch(`${API_BASE_URL}/api/auth/profile-image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed with status ${response.status}`);
  }

  return payload as { message: string; profileImageUrl: string; user: AuthUser };
}

export async function getChallengeHintRequest(
  token: string,
  assessmentId: string,
  challengeId: string,
  submittedOutput: string
) {
  return requestJson<{
    message: string;
    hint: string;
    hintCount: number;
    hintLimit: number;
    remainingHints: number;
  }>(`/api/assessments/${assessmentId}/challenges/${challengeId}/hint`, {
    method: 'POST',
    token,
    body: JSON.stringify({ submittedOutput }),
  });
}

export async function getMyInterviewsRequest(token: string) {
  return requestJson<{ interviews: InterviewSummary[] }>('/api/interviews/mine', {
    method: 'GET',
    token,
  });
}

export async function getMyNotificationsRequest(token: string) {
  return requestJson<{ notifications: NotificationSummary[]; unreadCount: number }>(
    '/api/notifications/mine',
    {
      method: 'GET',
      token,
    }
  );
}

export async function markNotificationReadRequest(token: string, notificationId: string) {
  return requestJson<{ message: string }>(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    token,
  });
}

export async function markAllNotificationsReadRequest(token: string) {
  return requestJson<{ message: string }>('/api/notifications/mine/read-all', {
    method: 'PATCH',
    token,
  });
}

export async function deleteNotificationRequest(token: string, notificationId: string) {
  return requestJson<{ message: string }>(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getRecruiterSummaryRequest(token: string) {
  return requestJson<{ metrics: RecruiterDashboardMetrics }>(
    '/api/recruiter/dashboard-summary',
    {
      method: 'GET',
      token,
    }
  );
}

export async function getRecruiterCandidatesRequest(token: string) {
  return requestJson<{ candidates: RecruiterCandidate[] }>('/api/recruiter/candidates', {
    method: 'GET',
    token,
  });
}

export async function deleteRecruiterCandidateRequest(token: string, candidateId: string) {
  return requestJson<{ message: string; deletedCandidateId: string; removedCounts?: Record<string, number> }>(
    `/api/recruiter/candidates/${candidateId}`,
    {
      method: 'DELETE',
      token,
    }
  );
}

export async function scheduleInterviewRequest(
  token: string,
  payload: {
    candidateId?: string;
    candidateName?: string;
    candidateEmail?: string;
    assessmentId?: string;
    scheduledAt: string;
    durationMinutes?: number;
    timezone?: string;
    roomId?: string;
    meetingLink?: string;
    notes?: string;
  }
) {
  return requestJson<{
    message: string;
    interview: InterviewSummary;
    emailDelivery?: {
      sent: boolean;
      reason?: string;
    };
  }>('/api/interviews', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateInterviewStatusRequest(
  token: string,
  interviewId: string,
  status: 'scheduled' | 'completed' | 'cancelled'
) {
  return requestJson<{ message: string; interview: InterviewSummary }>(
    `/api/interviews/${interviewId}/status`,
    {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    }
  );
}

export async function getChallenges(token: string) {
  return requestJson<{ challenges: ChallengePreview[] }>('/api/challenges', {
    method: 'GET',
    token,
  });
}

export async function createChallengeRequest(
  token: string,
  payload: {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    language: string;
    starterCode?: string;
    tags?: string[];
    testCases: {
      input: string;
      expectedOutput: string;
      isHidden?: boolean;
    }[];
  }
) {
  return requestJson<{ message: string; challenge: ChallengePreview }>('/api/challenges', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}


    export async function deleteInterviewRequest(token: string, interviewId: string) {
      return requestJson<{ message: string }>(`/api/interviews/${interviewId}`, {
        method: 'DELETE',
        token,
      });
    }
export async function updateChallengeRequest(
  token: string,
  challengeId: string,
  payload: {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    language: string;
    starterCode?: string;
    tags?: string[];
    testCases: {
      input: string;
      expectedOutput: string;
      isHidden?: boolean;
    }[];
  }
) {
  return requestJson<{ message: string; challenge: ChallengePreview }>(
    `/api/challenges/${challengeId}`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteChallengeRequest(token: string, challengeId: string) {
  return requestJson<{ message: string }>(`/api/challenges/${challengeId}`, {
    method: 'DELETE',
    token,
  });
}

export async function createAssessmentRequest(
  token: string,
  payload: {
    title: string;
    description: string;
    durationMinutes: number;
    passingScore: number;
    assignedCandidates: string[];
    challenges: {
      challenge: string;
      points: number;
      order: number;
    }[];
  }
) {
  return requestJson<{ message: string; assessment: AssessmentSummary }>('/api/assessments', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteAssessmentRequest(token: string, assessmentId: string) {
  return requestJson<{ message: string }>(`/api/assessments/${assessmentId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getAssessmentAttemptsForRecruiterRequest(token: string, assessmentId: string) {
  return requestJson<{ attempts: RecruiterAttemptSummary[] }>(
    `/api/recruiter/assessments/${assessmentId}/attempts`,
    {
      method: 'GET',
      token,
    }
  );
}

export async function generateInterviewRoomRequest(token: string, interviewId: string) {
  return requestJson<{
    message: string;
    roomId: string;
    meetingLink: string;
    interview: InterviewSummary;
  }>(`/api/interviews/${interviewId}/room`, {
    method: 'PATCH',
    token,
  });
}

export async function getInterviewByRoomIdRequest(token: string, roomId: string) {
  return requestJson<{
    roomId: string;
    meetingLink?: string;
    interview: InterviewSummary;
  }>(`/api/interviews/room/${encodeURIComponent(roomId)}`, {
    method: 'GET',
    token,
  });
}