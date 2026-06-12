import { createSlice } from '@reduxjs/toolkit';

const SESSION_KEY = 'skillgate.web.session';

const loadPersistedSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { accessToken: '', user: null };
    return JSON.parse(raw);
  } catch {
    return { accessToken: '', user: null };
  }
};

const persistSession = (accessToken, user) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ accessToken, user }));
  } catch {
    // storage unavailable
  }
};

const removePersistedSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};

const initialState = loadPersistedSession();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      persistSession(action.payload.accessToken, action.payload.user);
    },
    clearSession(state) {
      state.accessToken = '';
      state.user = null;
      removePersistedSession();
    }
  }
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
