import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import assessmentReducer from '../../features/assessments/assessmentSlice';

export const store = configureStore({
reducer: {
		auth: authReducer,
		assessments: assessmentReducer
}
});