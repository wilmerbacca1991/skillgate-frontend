import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	createdChallenge: null,
	createdAssessment: null,
	currentAssessmentId: '',
	currentChallengeId: '',
	lastSubmissionResult: null,
	lastFinalizeResult: null,
	loading: false,
	error: ''
};

const assessmentSlice = createSlice({
	name: 'assessments',
	initialState,
	reducers: {
		setLoading(state, action) {
			state.loading = action.payload;
		},
		setError(state, action) {
			state.error = action.payload;
		},
		setCreatedChallenge(state, action) {
			state.createdChallenge = action.payload;
			state.currentChallengeId = action.payload?._id || '';
		},
		setCreatedAssessment(state, action) {
			state.createdAssessment = action.payload;
			state.currentAssessmentId = action.payload?._id || '';
		},
		setCurrentAssessmentId(state, action) {
			state.currentAssessmentId = action.payload;
		},
		setCurrentChallengeId(state, action) {
			state.currentChallengeId = action.payload;
		},
		setLastSubmissionResult(state, action) {
			state.lastSubmissionResult = action.payload;
		},
		setLastFinalizeResult(state, action) {
			state.lastFinalizeResult = action.payload;
		}
	}
});

export const {
	setLoading,
	setError,
	setCreatedChallenge,
	setCreatedAssessment,
	setCurrentAssessmentId,
	setCurrentChallengeId,
	setLastSubmissionResult,
	setLastFinalizeResult
} = assessmentSlice.actions;

export default assessmentSlice.reducer;
