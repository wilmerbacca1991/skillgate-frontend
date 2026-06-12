import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import CollabRoomPage from '../../pages/CollabRoomPage';
import CandidatePortalPage from '../../pages/CandidatePortalPage';
import RecruiterDashboardPage from '../../pages/RecruiterDashboardPage';
import LiveInterviewRoomPage from '../../pages/LiveInterviewRoomPage';
import { clearSession, setSession } from '../../features/auth/authSlice';
import { getMeRequest } from '../../services/apiClient';

const decodeJwtPayload = (token) => {
  const parts = String(token || '').split('.');

  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(paddedBase64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isJwtExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return Date.now() >= payload.exp * 1000;
};

const AuthBootstrapGate = ({ children }) => {
  const accessToken = useSelector((state) => state.auth.accessToken);

  return <SessionVerifier key={accessToken || 'empty'}>{children}</SessionVerifier>;
};

const SessionVerifier = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [checked, setChecked] = useState(() => !accessToken);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!accessToken) {
        if (active) {
          setChecked(true);
        }
        return;
      }

      if (isJwtExpired(accessToken)) {
        dispatch(clearSession());
        if (active) {
          setChecked(true);
        }
        return;
      }

      try {
        const response = await getMeRequest(accessToken);
        if (!active) {
          return;
        }

        if (!user || user.email !== response.user.email || user.role !== response.user.role) {
          dispatch(setSession({ accessToken, user: response.user }));
        }
      } catch {
        dispatch(clearSession());

        if (active) {
          const redirectTarget = `${location.pathname}${location.search}`;
          if (redirectTarget !== '/login') {
            navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
          }
        }
      } finally {
        if (active) {
          setChecked(true);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken, dispatch, location.pathname, location.search, navigate, user]);

  if (!checked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#06111f',
          color: '#e2e8f0',
          fontFamily: '"Space Grotesk", "Manrope", "Segoe UI", sans-serif',
        }}
      >
        Verifying session...
      </div>
    );
  }

  return children;
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const user = useSelector((state) => state.auth.user);

  if (!accessToken) {
    const redirectTarget = `${window.location.pathname}${window.location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTarget)}`} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/collab" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthBootstrapGate>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/collab"
          element={
            <ProtectedRoute>
              <CollabRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate"
          element={
            <ProtectedRoute allowedRoles={['candidate', 'admin', 'recruiter']}>
              <CandidatePortalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
              <RecruiterDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-room"
          element={
            <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}>
              <LiveInterviewRoomPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthBootstrapGate>
    </BrowserRouter>
  );
};

export default AppRouter;