const hasBearerToken = (options = {}) => Boolean(getAuthorizationToken(options.headers || {}));
import { API_BASE_URL } from '../config/env';

const SESSION_KEY = 'skillgate.web.session';

const readPersistedSession = () => {
	try {
		const raw = localStorage.getItem(SESSION_KEY);
		if (!raw) {
			return null;
		}

		return JSON.parse(raw);
	} catch {
		return null;
	}
};

let latestAccessToken = String(readPersistedSession()?.accessToken || '');

class ApiError extends Error {
	constructor(message, status) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

const persistAccessToken = (accessToken) => {
	try {
		latestAccessToken = String(accessToken || '');
		const current = readPersistedSession();
		if (!current?.user) {
			return;
		}

		localStorage.setItem(
			SESSION_KEY,
			JSON.stringify({
				accessToken,
				user: current.user
			})
		);
	} catch {
		// Ignore storage failures.
	}
};

const clearPersistedSession = () => {
	try {
		latestAccessToken = '';
		localStorage.removeItem(SESSION_KEY);
	} catch {
		// Ignore storage failures.
	}
};

const buildOptionsWithCredentials = (options = {}) => ({
	...options,
	credentials: 'include'
});

const replaceAuthorizationHeader = (options = {}, refreshedToken) => {
	const headers = {
		...(options.headers || {}),
		Authorization: `Bearer ${refreshedToken}`
	};

	return {
		...options,
		headers
	};
};

const getAuthorizationToken = (headers = {}) => {
	const authHeader = headers.Authorization || headers.authorization;
	if (!authHeader || typeof authHeader !== 'string') {
		return '';
	}

	const match = authHeader.match(/^Bearer\s+(.+)$/i);
	return match?.[1] || '';
};

const withLatestAuthorizationHeader = (options = {}) => {
	const currentToken = getAuthorizationToken(options.headers || {});
	const freshestToken = getLatestKnownAccessToken();
	if (!currentToken || !freshestToken || currentToken === freshestToken) {
		return options;
	}

	return replaceAuthorizationHeader(options, freshestToken);
};
const getLatestKnownAccessToken = () => {
	if (latestAccessToken) {
		return latestAccessToken;
	}

	const persisted = String(readPersistedSession()?.accessToken || '');
	if (persisted) {
		latestAccessToken = persisted;
	}

	return persisted;
};

let refreshPromise = null;

const refreshAccessToken = async () => {
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = (async () => {
		const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include'
		});

		let data = null;
		try {
			data = await response.json();
		} catch (parseError) {
			void parseError;
		}

		if (!response.ok || !data?.accessToken) {
			throw new ApiError(data?.message || 'Session expired. Please log in again.', response.status);
		}

		persistAccessToken(data.accessToken);
		return data.accessToken;
	})();

	try {
		return await refreshPromise;
	} finally {
		refreshPromise = null;
	}
};

const buildAuthHeaders = (accessToken) => ({
	'Content-Type': 'application/json',
	Authorization: `Bearer ${accessToken}`
});

const normalizeNetworkError = (error) => {
	if (!(error instanceof Error)) {
		return new Error('Unexpected network error.');
	}

	if (error.name === 'AbortError') {
		return new Error('Request timed out. Please try again.');
	}

	const lowerMessage = error.message.toLowerCase();
	if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('networkerror')) {
		return new Error(
			`Cannot reach backend at ${API_BASE_URL}. Start the backend server and retry.`
		);
	}

	return error;
};

const parseJsonResponse = async (response) => {
	let data = null;
	try {
		data = await response.json();
	} catch (parseError) {
		void parseError;
	}

	if (!response.ok) {
		throw new ApiError(data?.message || `Request failed with status ${response.status}`, response.status);
	}

	return data;
};

const requestJson = async (path, options, hasRetried = false) => {
	try {
		let requestOptions = withLatestAuthorizationHeader(options);

		if (!hasBearerToken(requestOptions)) {
			throw new ApiError('Authentication required. Please log in again.', 401);
		}

		const response = await fetch(`${API_BASE_URL}${path}`, buildOptionsWithCredentials(requestOptions));
		return parseJsonResponse(response);
	} catch (error) {
		if (
			error instanceof ApiError &&
			error.status === 401 &&
			!hasRetried &&
			options?.headers?.Authorization
		) {
			try {
				const refreshedToken = await refreshAccessToken();
				const retryOptions = replaceAuthorizationHeader(options, refreshedToken);
				return requestJson(path, retryOptions, true);
			} catch (refreshError) {
				clearPersistedSession();
				if (typeof window !== 'undefined') {
					const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
					window.location.assign(`/login?redirect=${redirectTarget}`);
				}
				throw normalizeNetworkError(refreshError);
			}
		}

		throw normalizeNetworkError(error);
	}
};

export const createChallengeRequest = async (accessToken, payload) => {
	return requestJson('/api/challenges', {
		method: 'POST',
		headers: buildAuthHeaders(accessToken),
		body: JSON.stringify(payload)
	});
};

export const updateChallengeRequest = async (accessToken, challengeId, payload) => {
	return requestJson(`/api/challenges/${challengeId}`, {
		method: 'PUT',
		headers: buildAuthHeaders(accessToken),
		body: JSON.stringify(payload)
	});
};

export const deleteChallengeRequest = async (accessToken, challengeId) => {
	return requestJson(`/api/challenges/${challengeId}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const getChallengesRequest = async (accessToken) => {
	return requestJson('/api/challenges', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const createAssessmentRequest = async (accessToken, payload) => {
	return requestJson('/api/assessments', {
		method: 'POST',
		headers: buildAuthHeaders(accessToken),
		body: JSON.stringify(payload)
	});
};

export const deleteAssessmentRequest = async (accessToken, assessmentId) => {
	return requestJson(`/api/assessments/${assessmentId}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const getAssessmentsRequest = async (accessToken) => {
	return requestJson('/api/assessments', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const getChallengeByIdRequest = async (accessToken, challengeId) => {
	return requestJson(`/api/challenges/${challengeId}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const startAssessmentRequest = async (accessToken, assessmentId) => {
	return requestJson(`/api/assessments/${assessmentId}/start`, {
		method: 'POST',
		headers: buildAuthHeaders(accessToken)
	});
};

export const submitChallengeAnswerRequest = async (
	accessToken,
	assessmentId,
	challengeId,
	submittedOutput
) => {
	return requestJson(
		`/api/assessments/${assessmentId}/challenges/${challengeId}/submit`,
		{
			method: 'POST',
			headers: buildAuthHeaders(accessToken),
			body: JSON.stringify({ submittedOutput })
		}
	);
};

export const getChallengeHintRequest = async (
	accessToken,
	assessmentId,
	challengeId,
	submittedOutput
) => {
	return requestJson(
		`/api/assessments/${assessmentId}/challenges/${challengeId}/hint`,
		{
			method: 'POST',
			headers: buildAuthHeaders(accessToken),
			body: JSON.stringify({ submittedOutput })
		}
	);
};

export const finalizeAssessmentRequest = async (accessToken, assessmentId) => {
	return requestJson(`/api/assessments/${assessmentId}/finalize`, {
		method: 'POST',
		headers: buildAuthHeaders(accessToken)
	});
};

export const getMyAttemptRequest = async (accessToken, assessmentId) => {
	return requestJson(`/api/assessments/${assessmentId}/attempt`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const createChallengeAndAssessmentDefaults = {
	title: 'New Challenge',
	description: 'Describe the challenge here',
	difficulty: 'easy',
	language: 'javascript',
	starterCode: '',
	testInput: '1 2',
	expectedOutput: '3'
};

export const getAssessmentAttemptsForRecruiterRequest = async (accessToken, assessmentId) => {
	return requestJson(
		`/api/recruiter/assessments/${assessmentId}/attempts`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		}
	);
};

export const getRecruiterCandidatesRequest = async (accessToken) => {
	return requestJson('/api/recruiter/candidates', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const deleteRecruiterCandidateRequest = async (accessToken, candidateId) => {
	return requestJson(`/api/recruiter/candidates/${candidateId}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const getRecruiterSummaryRequest = async (accessToken) => {
	return requestJson('/api/recruiter/dashboard-summary', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const scheduleInterviewRequest = async (accessToken, payload) => {
	return requestJson('/api/interviews', {
		method: 'POST',
		headers: buildAuthHeaders(accessToken),
		body: JSON.stringify(payload)
	});
};

export const getMyInterviewsRequest = async (accessToken) => {
	return requestJson('/api/interviews/mine', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const updateInterviewStatusRequest = async (accessToken, interviewId, status) => {
	return requestJson(`/api/interviews/${interviewId}/status`, {
		method: 'PATCH',
		headers: buildAuthHeaders(accessToken),
		body: JSON.stringify({ status })
	});
};

export const deleteInterviewRequest = async (accessToken, interviewId) => {
	return requestJson(`/api/interviews/${interviewId}`, {
		method: 'DELETE',
		headers: buildAuthHeaders(accessToken)
	});
};

export const generateInterviewRoomRequest = async (accessToken, interviewId) => {
	return requestJson(`/api/interviews/${interviewId}/room`, {
		method: 'PATCH',
		headers: buildAuthHeaders(accessToken)
	});
};

export const getInterviewByRoomIdRequest = async (accessToken, roomId) => {
	return requestJson(`/api/interviews/room/${encodeURIComponent(roomId)}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const getMyNotificationsRequest = async (accessToken) => {
	return requestJson('/api/notifications/mine', {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const markNotificationReadRequest = async (accessToken, notificationId) => {
	return requestJson(`/api/notifications/${notificationId}/read`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const markAllNotificationsReadRequest = async (accessToken) => {
	return requestJson('/api/notifications/mine/read-all', {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};

export const deleteNotificationRequest = async (accessToken, notificationId) => {
	return requestJson(`/api/notifications/${notificationId}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
};
