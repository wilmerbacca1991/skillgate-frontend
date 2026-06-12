import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getMeRequest, loginRequest, registerRequest, type AuthUser } from './api';

const TOKEN_KEY = 'skillgate.mobile.accessToken';
const USER_KEY = 'skillgate.mobile.user';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signingIn: boolean;
  signingUp: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'candidate' | 'recruiter';
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (nextUser: AuthUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function saveAuthState(token: string, user: AuthUser) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

async function clearAuthState() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);

        if (!active) {
          return;
        }

        if (!storedToken || !storedUser) {
          setToken(null);
          setUser(null);
          return;
        }

        try {
          const response = await getMeRequest(storedToken);

          if (!active) {
            return;
          }

          setToken(storedToken);
          setUser(response.user);
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
        } catch {
          await clearAuthState();

          if (!active) {
            return;
          }

          setToken(null);
          setUser(null);
        }
      } catch {
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAuth();

    return () => {
      active = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setSigningIn(true);
    setError(null);

    try {
      const response = await loginRequest(email, password);
      await saveAuthState(response.accessToken, response.user);
      setToken(response.accessToken);
      setUser(response.user);
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Login failed';
      setError(message);
      throw loginError;
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    await clearAuthState();
    setToken(null);
    setUser(null);
    setError(null);
  };

  const signUp = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'candidate' | 'recruiter';
  }) => {
    setSigningUp(true);
    setError(null);

    try {
      const response = await registerRequest(payload);
      await saveAuthState(response.accessToken, response.user);
      setToken(response.accessToken);
      setUser(response.user);
    } catch (registerError) {
      const message = registerError instanceof Error ? registerError.message : 'Registration failed';
      setError(message);
      throw registerError;
    } finally {
      setSigningUp(false);
    }
  };

  const updateUser = async (nextUser: AuthUser) => {
    if (!token) {
      return;
    }

    await saveAuthState(token, nextUser);
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        signingIn,
        signingUp,
        error,
        signIn,
        signUp,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}