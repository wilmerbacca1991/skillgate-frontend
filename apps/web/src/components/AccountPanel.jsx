import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { clearSession, setSession } from '../features/auth/authSlice';
import { API_BASE_URL } from '../config/env';
import { logoutRequest, uploadProfileImageRequest } from '../services/apiClient';

const styles = {
  card: {
    display: 'grid',
    gap: 10,
    justifyItems: 'end',
    minWidth: 0,
    width: '100%',
    maxWidth: 330,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    objectFit: 'cover',
    border: '2px solid rgba(251,146,60,0.5)',
    background: 'rgba(255,255,255,0.08)',
  },
  avatarButton: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    borderRadius: 999,
    cursor: 'zoom-in',
  },
  initials: {
    width: 44,
    height: 44,
    borderRadius: 999,
    display: 'grid',
    placeItems: 'center',
    border: '2px solid rgba(251,146,60,0.5)',
    background: 'rgba(251,146,60,0.15)',
    color: '#fed7aa',
    fontWeight: 800,
    fontSize: 14,
  },
  email: {
    color: '#e2e8f0',
    fontSize: 12,
    maxWidth: 220,
    textAlign: 'right',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  uploadButton: {
    border: '1px solid rgba(251,146,60,0.4)',
    borderRadius: 12,
    padding: '8px 12px',
    color: '#fdba74',
    background: 'rgba(251,146,60,0.12)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  signOutButton: {
    border: '1px solid rgba(248,113,113,0.35)',
    borderRadius: 12,
    padding: '8px 12px',
    color: '#fecaca',
    background: 'rgba(248,113,113,0.12)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  status: {
    color: 'rgba(226,232,240,0.75)',
    fontSize: 12,
  },
  hiddenInput: {
    display: 'none',
  },
  lightboxOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2,6,23,0.82)',
    backdropFilter: 'blur(6px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 2147483647,
    padding: 24,
  },
  lightboxCard: {
    width: 'min(92vw, 760px)',
    borderRadius: 20,
    border: '1px solid rgba(56,189,248,0.35)',
    background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.9) 100%)',
    boxShadow: '0 28px 70px rgba(0,0,0,0.45)',
    padding: 16,
    display: 'grid',
    gap: 12,
  },
  lightboxImage: {
    width: '100%',
    maxHeight: '72vh',
    objectFit: 'contain',
    borderRadius: 14,
    border: '1px solid rgba(251,146,60,0.3)',
    background: 'rgba(2,6,23,0.72)',
  },
  lightboxClose: {
    justifySelf: 'end',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.06)',
    color: '#e2e8f0',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

const absoluteImageUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const normalizedPath = String(value).startsWith('/') ? value : `/${value}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const initialsFromUser = (user) => {
  const first = String(user?.firstName || '').charAt(0).toUpperCase();
  const last = String(user?.lastName || '').charAt(0).toUpperCase();
  return `${first}${last}` || 'U';
};

const AccountPanel = ({ accessToken, user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    if (!showImagePreview) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowImagePreview(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showImagePreview]);

  const avatarUrl = useMemo(() => {
    if (localPreviewUrl) {
      return localPreviewUrl;
    }
    return absoluteImageUrl(user?.profileImageUrl);
  }, [localPreviewUrl, user?.profileImageUrl]);

  const handleSignOut = async () => {
    setBusy(true);
    setStatus('');

    try {
      await logoutRequest();
    } catch {
      // still clear local session even if API logout fails
    }

    dispatch(clearSession());
    navigate('/login');
    setBusy(false);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !accessToken || !user) return;

    setBusy(true);
    setStatus('Uploading image...');

    try {
      const response = await uploadProfileImageRequest(accessToken, file);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(URL.createObjectURL(file));
      dispatch(
        setSession({
          accessToken,
          user: response.user
        })
      );
      setStatus('Profile image updated.');
    } catch (error) {
      setStatus(error.message || 'Upload failed.');
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setBusy(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        {avatarUrl ? (
            <button
              type="button"
              style={styles.avatarButton}
              onClick={() => setShowImagePreview(true)}
              aria-label="Open profile photo"
            >
              <img
                src={avatarUrl}
                alt="Profile"
                style={styles.avatar}
                onError={() => setStatus('Could not load profile photo. Try uploading again.')}
              />
            </button>
        ) : (
          <div style={styles.initials}>{initialsFromUser(user)}</div>
        )}
        <div style={styles.email}>{user?.email || 'No account email'}</div>
      </div>

      <div style={styles.actions}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={styles.hiddenInput}
          onChange={handleFileChange}
        />
        <button
          type="button"
          style={styles.uploadButton}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Upload Photo
        </button>
        <button type="button" style={styles.signOutButton} disabled={busy} onClick={handleSignOut}>
          Sign out
        </button>
      </div>

      {status ? <div style={styles.status}>{status}</div> : null}

      {showImagePreview && avatarUrl
        ? createPortal(
            <div style={styles.lightboxOverlay} onClick={() => setShowImagePreview(false)}>
              <div style={styles.lightboxCard} onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  style={styles.lightboxClose}
                  onClick={() => setShowImagePreview(false)}
                >
                  Close
                </button>
                <img src={avatarUrl} alt="Profile preview" style={styles.lightboxImage} />
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default AccountPanel;
