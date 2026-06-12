import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import SkillGateBrand from '../components/SkillGateBrand';
import { SOCKET_URL } from '../config/env';
import AccountPanel from '../components/AccountPanel';

const styles = {
  shell: {
    minHeight: '100vh',
    padding: 24,
    background:
      'radial-gradient(70% 60% at 0% 0%, rgba(34,211,238,0.22) 0%, transparent 60%), radial-gradient(60% 52% at 100% 8%, rgba(249,115,22,0.2) 0%, transparent 60%), linear-gradient(160deg, #030712 0%, #071326 56%, #0b1b33 100%)',
    fontFamily: '"SF Pro Display", "Avenir Next", "Segoe UI", sans-serif',
    color: '#e2e8f0'
  },
  container: {
    maxWidth: 1280,
    margin: '0 auto'
  },
  hero: {
    padding: 24,
    borderRadius: 28,
    background: 'linear-gradient(160deg, rgba(12,23,44,0.9) 0%, rgba(7,14,28,0.92) 100%)',
    border: '1px solid rgba(148,163,184,0.24)',
    boxShadow: '0 28px 70px rgba(2,6,23,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    marginBottom: 18
  },
  heroCopy: {
    marginTop: 12,
    color: 'rgba(226,232,240,0.76)',
    lineHeight: 1.6
  },
  heroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  },
  statusRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 18
  },
  statusBadge: {
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0',
    fontSize: 12,
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  },
  toolbar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
    padding: 18,
    borderRadius: 22,
    background: 'linear-gradient(150deg, rgba(10,20,38,0.88) 0%, rgba(6,12,24,0.92) 100%)',
    border: '1px solid rgba(148,163,184,0.24)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
  },
  roomLabel: {
    color: 'rgba(203,213,225,0.8)',
    fontSize: 13
  },
  roomId: {
    color: '#e2e8f0',
    fontWeight: 700,
    fontFamily: 'monospace',
    background: 'rgba(5,12,25,0.84)',
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 13
  },
  button: {
    border: 'none',
    borderRadius: 14,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 52%, #f97316 100%)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 18px 35px rgba(37,99,235,0.22)'
  },
  participants: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    background: 'linear-gradient(150deg, rgba(10,20,38,0.88) 0%, rgba(6,12,24,0.92) 100%)',
    border: '1px solid rgba(148,163,184,0.24)',
    color: '#cbd5e1'
  },
  participantChip: {
    display: 'inline-block',
    marginRight: 8,
    marginTop: 4,
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.2)',
    color: '#bae6fd',
    fontSize: 12
  },
  error: {
    color: '#fdba74'
  }
};

const buildRoomId = (user) => {
  if (!user?.id) return 'collab-room';
  return `room-${user.id}`;
};

const CollabRoomPage = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const user = useSelector((state) => state.auth.user);

  const socketRef = useRef(null);
  const roomId = buildRoomId(user);

  const [code, setCode] = useState('// Start typing...');
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [socketError, setSocketError] = useState('');

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setSocketError('');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setHasJoined(false);
    });

    socket.on('connect_error', (error) => {
      setSocketError(error.message || 'Socket connection failed');
    });

    socket.on('room:state', (payload) => {
      setCode(payload.code || '');
      setHasJoined(true);
    });

    socket.on('room:participants', (payload) => {
      setParticipants(payload.participants || []);
    });

    socket.on('code:update', (payload) => {
      setCode(payload.code || '');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setHasJoined(false);
    };
  }, [accessToken]);

  const joinRoom = () => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    socket.emit('room:join', {
      roomId,
      initialCode: code,
      language: 'javascript'
    });
  };

  const handleCodeChange = (value) => {
    const next = value || '';
    setCode(next);

    const socket = socketRef.current;
    if (socket && isConnected && hasJoined) {
      socket.emit('code:change', { roomId, code: next });
    }
  };

  return (
    <div style={styles.shell}>
      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.heroTop}>
            <div>
              <SkillGateBrand size="section" subtitle="Realtime collaborative coding" />
              <p style={styles.heroCopy}>
                This workspace supports live interview collaboration with synchronized
                code editing and participant presence. Share your room ID with collaborators to work together.
              </p>
            </div>
            <AccountPanel accessToken={accessToken} user={user} />
          </div>
          <div style={styles.statusRow}>
            <span style={styles.statusBadge}>Logged in: {user?.email || 'unknown'}</span>
            <span style={styles.statusBadge}>
              Socket: {isConnected ? 'connected' : 'disconnected'}
            </span>
            <span style={styles.statusBadge}>Participants: {participants.length}</span>
            <span style={styles.statusBadge}>
              Room: {hasJoined ? 'joined' : 'not joined'}
            </span>
          </div>
          {socketError ? <p style={styles.error}>Socket error: {socketError}</p> : null}
        </section>

        <div style={styles.toolbar}>
          <span style={styles.roomLabel}>Your room ID:</span>
          <span style={styles.roomId}>{roomId}</span>
          <button
            onClick={joinRoom}
            disabled={!isConnected || hasJoined}
            style={styles.button}
          >
            {hasJoined ? 'Joined' : 'Join Room'}
          </button>
        </div>

        <div style={styles.participants}>
          <strong>Participants:</strong>{' '}
          {participants.length === 0
            ? 'none yet'
            : participants.map((p) => (
                <span key={p.socketId || p.userId} style={styles.participantChip}>
                  {p.role || 'user'}
                </span>
              ))}
        </div>

        <Editor
          height="60vh"
          defaultLanguage="javascript"
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          loading={<div style={{ padding: 16, color: '#e2e8f0' }}>Loading editor...</div>}
        />
      </div>
    </div>
  );
};

export default CollabRoomPage;
