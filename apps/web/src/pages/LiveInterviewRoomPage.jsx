import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import SkillGateBrand from '../components/SkillGateBrand';
import { SOCKET_URL, WEBRTC_ICE_SERVERS } from '../config/env';
import { getInterviewByRoomIdRequest } from '../services/assessmentApi';
import GlassToast from '../components/GlassToast';

const SESSION_KEY = 'skillgate.web.session';

const getPersistedAccessToken = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return '';
    return JSON.parse(raw)?.accessToken || '';
  } catch {
    return '';
  }
};

const pcConfig = {
  iceServers: WEBRTC_ICE_SERVERS
};

const styles = {
  shell: {
    minHeight: '100vh',
    background:
      'radial-gradient(70% 60% at 0% 0%, rgba(34,211,238,0.2) 0%, transparent 60%), radial-gradient(58% 50% at 100% 8%, rgba(249,115,22,0.18) 0%, transparent 60%), linear-gradient(160deg, #030712 0%, #071326 56%, #0b1b33 100%)',
    color: '#e2e8f0',
    padding: 20
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'grid',
    gap: 16
  },
  panel: {
    border: '1px solid rgba(148,163,184,0.24)',
    borderRadius: 20,
    background: 'linear-gradient(150deg, rgba(10,20,38,0.88) 0%, rgba(6,12,24,0.92) 100%)',
    boxShadow: '0 20px 40px rgba(2,6,23,0.42), inset 0 1px 0 rgba(255,255,255,0.08)',
    padding: 18
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    minWidth: 250,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.3)',
    background: 'rgba(5,12,25,0.9)',
    color: '#e2e8f0'
  },
  button: {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(56,189,248,0.6)',
    background: 'rgba(14,116,144,0.3)',
    color: '#e2e8f0',
    cursor: 'pointer'
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  chip: {
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(5,12,25,0.75)',
    color: '#cbd5e1',
    fontSize: 12,
    letterSpacing: '0.02em'
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  videos: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16
  },
  videoCard: {
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
    background: 'rgba(15,23,42,0.55)'
  },
  video: {
    width: '100%',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: '#020617',
    minHeight: 240
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: 14,
    color: '#93c5fd'
  },
  status: {
    fontSize: 13,
    color: '#cbd5e1'
  },
  noticeCard: {
    marginTop: 10,
    borderRadius: 12,
    border: '1px solid rgba(74,222,128,0.45)',
    background: 'rgba(22,163,74,0.12)',
    padding: '10px 12px'
  },
  noticeCardError: {
    borderColor: 'rgba(248,113,113,0.45)',
    background: 'rgba(239,68,68,0.12)'
  },
  noticeTextSuccess: {
    margin: 0,
    color: '#bbf7d0',
    fontSize: 13,
    fontWeight: 700
  },
  noticeTextError: {
    margin: 0,
    color: '#fecaca',
    fontSize: 13,
    fontWeight: 700
  },
  error: {
    margin: 0,
    color: '#fca5a5'
  }
};

const LiveInterviewRoomPage = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialRoomId = searchParams.get('roomId') || '';

  const [roomIdInput, setRoomIdInput] = useState(initialRoomId);
  const [resolvedRoomId, setResolvedRoomId] = useState('');
  const [interviewData, setInterviewData] = useState(null);
  const [actionNotice, setActionNotice] = useState({ type: '', message: '' });
  const [statusText, setStatusText] = useState('Not connected');
  const [isJoining, setIsJoining] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [hasRemoteAudio, setHasRemoteAudio] = useState(false);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteSocketIdRef = useRef('');
  const roomIdRef = useRef('');
  const cameraVideoTrackRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const canJoin = useMemo(() => roomIdInput.trim().length > 0 && !isInRoom, [roomIdInput, isInRoom]);

  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }
  }, []);

  const replaceOutgoingVideoTrack = useCallback(async (nextTrack) => {
    const pc = peerRef.current;
    if (!pc) {
      return;
    }

    const sender = pc.getSenders().find((item) => item.track?.kind === 'video');
    if (!sender) {
      return;
    }

    await sender.replaceTrack(nextTrack || null);
  }, []);

  const stopLocalMedia = useCallback(() => {
    if (!localStreamRef.current) {
      return;
    }

    localStreamRef.current.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setIsMediaReady(false);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    screenTrackRef.current = null;
    cameraVideoTrackRef.current = null;
    setIsScreenSharing(false);
  }, []);

  const ensureLocalMedia = async () => {
    if (localStreamRef.current) {
      setIsMediaReady(true);
      return localStreamRef.current;
    }

    if (!window.isSecureContext) {
      throw new Error('Camera requires a secure context. Use localhost or HTTPS.');
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not support camera access for WebRTC.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    localStreamRef.current = stream;
    cameraVideoTrackRef.current = stream.getVideoTracks()[0] || null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play?.().catch(() => {
        setStatusText('Local preview is ready. If video is paused, tap play in the browser controls.');
      });
    }

    setIsMediaReady(true);

    return stream;
  };

  const stopScreenShare = useCallback(async (source = 'manual') => {
    if (!isScreenSharing) {
      return;
    }

    const cameraTrack = cameraVideoTrackRef.current || localStreamRef.current?.getVideoTracks?.()[0] || null;
    await replaceOutgoingVideoTrack(cameraTrack);

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play?.().catch(() => {
        setStatusText('Camera feed restored. If preview is paused, tap play in the browser controls.');
      });
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    screenTrackRef.current = null;
    setIsScreenSharing(false);

    if (source === 'ended') {
      setActionNotice({ type: 'success', message: 'Screen sharing ended. Camera feed restored.' });
    }
  }, [isScreenSharing, replaceOutgoingVideoTrack]);

  const startScreenShare = useCallback(async () => {
    setActionNotice({ type: '', message: '' });

    try {
      await ensureLocalMedia();

      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in this browser/runtime.');
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const [screenTrack] = screenStream.getVideoTracks();
      if (!screenTrack) {
        throw new Error('No screen video track was provided by the browser.');
      }

      screenTrack.onended = () => {
        stopScreenShare('ended');
      };

      screenStreamRef.current = screenStream;
      screenTrackRef.current = screenTrack;
      await replaceOutgoingVideoTrack(screenTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream([screenTrack]);
        localVideoRef.current.play?.().catch(() => {
          setStatusText('Screen share started. If preview is paused, tap play in the browser controls.');
        });
      }

      setIsScreenSharing(true);
      setStatusText('You are sharing your screen.');
      setActionNotice({ type: 'success', message: 'Screen sharing started.' });
    } catch (shareError) {
      setActionNotice({ type: 'error', message: shareError?.message || 'Could not start screen sharing.' });
    }
  }, [replaceOutgoingVideoTrack, stopScreenShare]);

  const setupPeer = useCallback((targetSocketId) => {
    cleanupPeer();

    const pc = new RTCPeerConnection(pcConfig);
    peerRef.current = pc;
    remoteSocketIdRef.current = targetSocketId;

    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play?.().catch(() => {
          setStatusText('Remote media requires interaction to play audio.');
        });
      }

      setHasRemoteAudio(Boolean(remoteStream?.getAudioTracks?.().length));
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current || !roomIdRef.current) {
        return;
      }

      socketRef.current.emit('interview:webrtc-ice-candidate', {
        roomId: roomIdRef.current,
        targetSocketId,
        candidate: event.candidate
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setStatusText('Peer connection ended.');
      }
      if (pc.connectionState === 'connected') {
        setStatusText('Live video connected.');
      }
    };

    return pc;
  }, [cleanupPeer]);

  const startOffer = useCallback(async (roomId, targetSocketId) => {
    const pc = setupPeer(targetSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit('interview:webrtc-offer', {
      roomId,
      targetSocketId,
      sdp: offer
    });
  }, [setupPeer]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const socket = io(`${SOCKET_URL}/interview`, {
      auth: (cb) => {
        cb({ token: getPersistedAccessToken() || accessToken });
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatusText('Connected to interview server.');
      setActionNotice({ type: 'success', message: 'Connected to interview server.' });
    });

    socket.on('disconnect', () => {
      setStatusText('Disconnected from interview server.');
      setIsInRoom(false);
      setIsJoining(false);
      cleanupPeer();
      stopScreenShare();
    });

    socket.on('connect_error', (eventError) => {
      setActionNotice({ type: 'error', message: eventError.message || 'Socket connection failed.' });
    });

    socket.on('interview:error', (payload) => {
      setActionNotice({ type: 'error', message: payload?.message || 'Interview room error.' });
      setIsJoining(false);
      setIsInRoom(false);
    });

    socket.on('interview:room-state', async (payload) => {
      const roomId = payload?.roomId || '';
      const participants = payload?.participants || [];
      const me = socket.id;

      setResolvedRoomId(roomId);
      roomIdRef.current = roomId;
      setIsJoining(false);
      setIsInRoom(true);
      setHasRemoteAudio(false);
      setStatusText(`Joined room ${roomId}. Waiting for peer...`);

      const peers = participants.filter((item) => item.socketId !== me);
      if (peers.length > 0) {
        const peer = peers[0];
        const shouldOffer = String(me) > String(peer.socketId);
        if (shouldOffer) {
          await startOffer(roomId, peer.socketId);
        }
      }
    });

    socket.on('interview:presence', async (payload) => {
      if (!roomIdRef.current || payload?.roomId !== roomIdRef.current) {
        return;
      }

      const participants = payload?.participants || [];
      const me = socket.id;
      const peers = participants.filter((item) => item.socketId !== me);

      if (payload?.state === 'offline' && payload?.userId) {
        setStatusText('Peer left the room.');
      }

      if (peers.length > 0 && !peerRef.current) {
        const peer = peers[0];
        const shouldOffer = String(me) > String(peer.socketId);
        if (shouldOffer) {
          await startOffer(roomIdRef.current, peer.socketId);
        }
      }
    });

    socket.on('interview:webrtc-offer', async ({ fromSocketId, sdp }) => {
      const pc = setupPeer(fromSocketId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('interview:webrtc-answer', {
        roomId: roomIdRef.current,
        targetSocketId: fromSocketId,
        sdp: answer
      });
    });

    socket.on('interview:webrtc-answer', async ({ sdp }) => {
      if (!peerRef.current) {
        return;
      }

      await peerRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on('interview:webrtc-ice-candidate', async ({ candidate }) => {
      if (!peerRef.current || !candidate) {
        return;
      }

      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        setStatusText('Could not add ICE candidate. Retrying connection...');
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      cleanupPeer();
      stopScreenShare();
      stopLocalMedia();
    };
  }, [accessToken, cleanupPeer, setupPeer, startOffer, stopLocalMedia, stopScreenShare]);

  useEffect(() => {
    if (!accessToken || !initialRoomId) {
      return;
    }

    const autoResolve = async () => {
      try {
        const response = await getInterviewByRoomIdRequest(accessToken, initialRoomId);
        setInterviewData(response.interview || null);
        setResolvedRoomId(initialRoomId);
        roomIdRef.current = initialRoomId;
      } catch {
        // Keep manual join available if room lookup fails.
      }
    };

    autoResolve();
  }, [accessToken, initialRoomId]);

  useEffect(() => {
    if (!localVideoRef.current && !localStreamRef.current) {
      return;
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, []);

  const handleJoinRoom = async () => {
    setActionNotice({ type: '', message: '' });
    setIsJoining(true);

    try {
      const roomId = roomIdInput.trim();
      const response = await getInterviewByRoomIdRequest(accessToken, roomId);
      setInterviewData(response.interview || null);
      setResolvedRoomId(roomId);
      roomIdRef.current = roomId;

      const stream = await ensureLocalMedia();
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });

      setSearchParams({ roomId });
      socketRef.current?.emit('interview:join-room', { roomId });
      setActionNotice({ type: 'success', message: 'Room validated. Joining now...' });
    } catch (joinError) {
      const message = joinError?.message || 'Failed to join interview room.';
      setActionNotice({ type: 'error', message });
      setIsJoining(false);
    }
  };

  const handleEnableCamera = async () => {
    setActionNotice({ type: '', message: '' });

    try {
      await ensureLocalMedia();
      setStatusText('Camera and microphone are ready.');
      setActionNotice({ type: 'success', message: 'Camera and microphone are ready.' });
    } catch (mediaError) {
      setActionNotice({ type: 'error', message: mediaError?.message || 'Could not access camera or microphone.' });
    }
  };

  const toggleCamera = () => {
    if (isScreenSharing) {
      setActionNotice({ type: 'error', message: 'Stop screen sharing before toggling the camera feed.' });
      return;
    }

    if (!localStreamRef.current) {
      setActionNotice({ type: 'error', message: 'Enable camera first, then toggle camera state.' });
      return;
    }

    const next = !isCameraOn;
    setIsCameraOn(next);

    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
    }
  };

  const toggleMic = () => {
    if (!localStreamRef.current) {
      setActionNotice({ type: 'error', message: 'Enable camera/microphone first, then toggle mute.' });
      return;
    }

    const next = !isMicOn;
    setIsMicOn(next);

    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
    }
  };

  const leaveRoom = () => {
    if (resolvedRoomId) {
      socketRef.current?.emit('interview:presence', { roomId: resolvedRoomId, state: 'offline' });
      if (user?.role === 'recruiter') {
        socketRef.current?.emit('interview:end', { roomId: resolvedRoomId });
      }
    }

    setIsInRoom(false);
    setIsJoining(false);
    setResolvedRoomId('');
    roomIdRef.current = '';
    setHasRemoteAudio(false);
    setSearchParams({});
    cleanupPeer();
    stopScreenShare();

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    stopLocalMedia();

    setStatusText('You left the room.');
    setActionNotice({ type: 'success', message: 'You left the room.' });
  };

  return (
    <div style={styles.shell}>
      <GlassToast notice={actionNotice} onClose={() => setActionNotice({ type: '', message: '' })} />
      <div style={styles.container}>
        <section style={styles.panel}>
          <SkillGateBrand size="section" subtitle="Live Interview Room" />
          <p style={styles.status}>
            Join with a room ID from email or use an interview join link. Both recruiter and candidate can turn camera/mic on and see each other in real time.
          </p>

          <div style={styles.chipRow}>
            <span style={styles.chip}>Role: {user?.role || 'unknown'}</span>
            <span style={styles.chip}>Camera: {isCameraOn ? 'on' : 'off'}</span>
            <span style={styles.chip}>Mic: {isMicOn ? 'on' : 'off'}</span>
            <span style={styles.chip}>Screen: {isScreenSharing ? 'sharing' : 'off'}</span>
            <span style={styles.chip}>Peer audio: {hasRemoteAudio ? 'detected' : 'waiting'}</span>
            <span style={styles.chip}>Room: {resolvedRoomId || 'not-joined'}</span>
          </div>

          <div style={styles.row}>
            <input
              value={roomIdInput}
              onChange={(event) => setRoomIdInput(event.target.value)}
              placeholder="Paste room ID"
              style={styles.input}
            />
            <button
              type="button"
              onClick={handleJoinRoom}
              disabled={!canJoin || isJoining}
              style={{ ...styles.button, ...(!canJoin || isJoining ? styles.disabled : null) }}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
            <button type="button" onClick={() => navigate(user?.role === 'candidate' ? '/candidate' : '/recruiter')} style={styles.button}>
              Back to Dashboard
            </button>
          </div>

          {resolvedRoomId ? <p style={styles.status}>Room ID: {resolvedRoomId}</p> : null}
          {interviewData ? (
            <p style={styles.status}>
              Interview: {interviewData.assessment?.title || 'Live interview'} | Recruiter: {interviewData.recruiter?.firstName} {interviewData.recruiter?.lastName}
            </p>
          ) : null}
          <p style={styles.status}>{statusText}</p>
        </section>

        <section style={styles.panel}>
          <div style={styles.row}>
            <button type="button" onClick={handleEnableCamera} style={styles.button}>
              {isMediaReady ? 'Camera Ready' : 'Enable Camera'}
            </button>
            <button type="button" onClick={toggleCamera} style={styles.button}>
              {isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            </button>
            <button type="button" onClick={toggleMic} style={styles.button}>
              {isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            </button>
            <button
              type="button"
              onClick={isScreenSharing ? () => stopScreenShare() : startScreenShare}
              disabled={!isInRoom}
              style={{ ...styles.button, ...(!isInRoom ? styles.disabled : null) }}
            >
              {isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
            </button>
            <button type="button" onClick={leaveRoom} disabled={!isInRoom} style={{ ...styles.button, ...(!isInRoom ? styles.disabled : null) }}>
              Leave Room
            </button>
          </div>

          <div style={styles.videos}>
            <div style={styles.videoCard}>
              <h3 style={styles.title}>You</h3>
              <video ref={localVideoRef} style={styles.video} autoPlay playsInline muted />
            </div>
            <div style={styles.videoCard}>
              <h3 style={styles.title}>Peer</h3>
              <video ref={remoteVideoRef} style={styles.video} autoPlay playsInline />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LiveInterviewRoomPage;
