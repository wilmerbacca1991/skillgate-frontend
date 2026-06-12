import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { io, type Socket } from 'socket.io-client';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  type MediaStream,
} from 'react-native-webrtc';

import SkillGateBrand from '@/skillgate-brand';
import GlassToast from '@/components/glass-toast';
import { API_BASE_URL, getInterviewByRoomIdRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type RoomParticipant = {
  socketId: string;
  userId: string;
  role: string;
};

type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

const parseIceServers = (): IceServer[] => {
  const rawConfig = process.env.EXPO_PUBLIC_WEBRTC_ICE_SERVERS;

  if (rawConfig) {
    try {
      const parsed = JSON.parse(rawConfig);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback to explicit vars if JSON parsing fails.
    }
  }

  const fallback: IceServer[] = [];
  const stunUrl = process.env.EXPO_PUBLIC_WEBRTC_STUN_URL;
  const turnUrl = process.env.EXPO_PUBLIC_WEBRTC_TURN_URL;
  const turnUsername = process.env.EXPO_PUBLIC_WEBRTC_TURN_USERNAME;
  const turnCredential = process.env.EXPO_PUBLIC_WEBRTC_TURN_CREDENTIAL;

  if (stunUrl) {
    fallback.push({ urls: stunUrl });
  }

  if (turnUrl) {
    fallback.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  if (fallback.length > 0) {
    return fallback;
  }

  return [{ urls: 'stun:stun.l.google.com:19302' }];
};

const ICE_SERVERS = parseIceServers();
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || API_BASE_URL;

export default function InterviewRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomId?: string | string[] }>();
  const { token, user } = useAuth();

  const initialRoomId = useMemo(() => {
    const value = params.roomId;
    if (Array.isArray(value)) {
      return value[0] ?? '';
    }
    return value ?? '';
  }, [params.roomId]);

  const [roomIdInput, setRoomIdInput] = useState(initialRoomId);
  const [resolvedRoomId, setResolvedRoomId] = useState('');
  const [statusText, setStatusText] = useState('Connecting to interview server...');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | ''; message: string }>({
    type: '',
    message: '',
  });
  const [isJoining, setIsJoining] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef('');
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoTrackRef = useRef<any>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<any>(null);

  const cleanupPeer = () => {
    if (!peerRef.current) {
      return;
    }

    peerRef.current.ontrack = null;
    peerRef.current.onicecandidate = null;
    peerRef.current.onconnectionstatechange = null;
    peerRef.current.close();
    peerRef.current = null;
  };

  const replaceOutgoingVideoTrack = useCallback(async (nextTrack: any) => {
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

  const stopLocalStream = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    screenTrackRef.current = null;
    cameraVideoTrackRef.current = null;
    setPreviewStream(null);
    setIsScreenSharing(false);

    if (!localStreamRef.current) {
      return;
    }

    localStreamRef.current.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setIsMediaReady(false);
  };

  const ensurePermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const cameraPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    const micPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );

    return (
      cameraPermission === PermissionsAndroid.RESULTS.GRANTED &&
      micPermission === PermissionsAndroid.RESULTS.GRANTED
    );
  }, []);

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      setIsMediaReady(true);
      return localStreamRef.current;
    }

    if (!mediaDevices?.getUserMedia) {
      throw new Error('Camera is not available in this runtime. Use a development build instead of Expo Go.');
    }

    const permissionGranted = await ensurePermissions();
    if (!permissionGranted) {
      throw new Error('Camera and microphone permissions are required to join.');
    }

    const stream = await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        facingMode: 'user',
      },
    });

    localStreamRef.current = stream;
    cameraVideoTrackRef.current = stream.getVideoTracks?.()[0] || null;
    setLocalStream(stream);
    setIsMediaReady(true);
    return stream;
  }, [ensurePermissions]);

  const stopScreenShare = useCallback(async (source: 'manual' | 'ended' = 'manual') => {
    if (!isScreenSharing) {
      return;
    }

    const cameraTrack = cameraVideoTrackRef.current || localStreamRef.current?.getVideoTracks?.()[0] || null;
    await replaceOutgoingVideoTrack(cameraTrack);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    screenTrackRef.current = null;
    setPreviewStream(null);
    setIsScreenSharing(false);

    if (source === 'ended') {
      setActionNotice({ type: 'success', message: 'Screen sharing ended. Camera feed restored.' });
    }
  }, [isScreenSharing, replaceOutgoingVideoTrack]);

  const startScreenShare = useCallback(async () => {
    setActionNotice({ type: '', message: '' });

    try {
      await ensureLocalMedia();

      const displayMediaFn = (mediaDevices as any)?.getDisplayMedia;
      if (typeof displayMediaFn !== 'function') {
        throw new Error('Screen sharing is not supported in this mobile runtime/build.');
      }

      const stream = await displayMediaFn.call(mediaDevices, {
        video: true,
        audio: false,
      });

      const [track] = stream.getVideoTracks();
      if (!track) {
        throw new Error('No screen video track was provided by this device.');
      }

      track.onended = () => {
        stopScreenShare('ended');
      };

      screenStreamRef.current = stream;
      screenTrackRef.current = track;
      await replaceOutgoingVideoTrack(track);

      setPreviewStream(stream);
      setIsScreenSharing(true);
      setStatusText('You are sharing your screen.');
      setActionNotice({ type: 'success', message: 'Screen sharing started.' });
    } catch (shareError) {
      setActionNotice({
        type: 'error',
        message: shareError instanceof Error ? shareError.message : 'Could not start screen sharing.',
      });
    }
  }, [ensureLocalMedia, replaceOutgoingVideoTrack, stopScreenShare]);

  const setupPeer = useCallback((targetSocketId: string) => {
    cleanupPeer();

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    peerRef.current = pc;

    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !roomIdRef.current || !socketRef.current) {
        return;
      }

      socketRef.current.emit('interview:webrtc-ice-candidate', {
        roomId: roomIdRef.current,
        targetSocketId,
        candidate: event.candidate,
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStatusText('Live video connected.');
      }

      if (pc.connectionState === 'failed') {
        setStatusText('Peer connection failed. Please rejoin the room.');
      }
    };

    return pc;
  }, []);

  const startOffer = useCallback(async (roomId: string, targetSocketId: string) => {
    const pc = setupPeer(targetSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit('interview:webrtc-offer', {
      roomId,
      targetSocketId,
      sdp: offer,
    });
  }, [setupPeer]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(`${SOCKET_URL}/interview`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
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
      setRemoteStream(null);
    });

    socket.on('connect_error', (eventError) => {
      setActionNotice({ type: 'error', message: eventError?.message || 'Could not connect to interview server.' });
    });

    socket.on('interview:error', (payload) => {
      setActionNotice({ type: 'error', message: payload?.message || 'Interview room error.' });
      setIsJoining(false);
      setIsInRoom(false);
    });

    socket.on('interview:room-state', async (payload) => {
      const roomId = payload?.roomId || '';
      const participants: RoomParticipant[] = payload?.participants || [];
      const me = socket.id;

      setResolvedRoomId(roomId);
      roomIdRef.current = roomId;
      setIsJoining(false);
      setIsInRoom(true);
      setStatusText(`Joined room ${roomId}. Waiting for peer...`);

      const peers = participants.filter((participant) => participant.socketId !== me);
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

      const participants: RoomParticipant[] = payload?.participants || [];
      const me = socket.id;
      const peers = participants.filter((participant) => participant.socketId !== me);

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
        sdp: answer,
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
        setStatusText('Network is unstable. Trying to recover ICE...');
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      cleanupPeer();
      setRemoteStream(null);
      stopScreenShare();
      stopLocalStream();
    };
  }, [token, setupPeer, startOffer, stopScreenShare]);

  useEffect(() => {
    if (!token || !initialRoomId) {
      return;
    }

    setRoomIdInput(initialRoomId);
  }, [token, initialRoomId]);

  if (!token || !user) {
    return <Redirect href="/login" />;
  }

  const handleJoinRoom = async () => {
    setActionNotice({ type: '', message: '' });
    setIsJoining(true);

    try {
      const roomId = roomIdInput.trim();
      if (!roomId) {
        throw new Error('Room ID is required.');
      }

      await getInterviewByRoomIdRequest(token, roomId);

      const stream = await ensureLocalMedia();

      stream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });

      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });

      setResolvedRoomId(roomId);
      roomIdRef.current = roomId;
      socketRef.current?.emit('interview:join-room', { roomId });
      setActionNotice({ type: 'success', message: 'Room validated. Joining now...' });
    } catch (joinError) {
      setActionNotice({
        type: 'error',
        message: joinError instanceof Error ? joinError.message : 'Failed to join room.',
      });
      setIsJoining(false);
    }
  };

  const handlePrepareMedia = async () => {
    setActionNotice({ type: '', message: '' });

    try {
      await ensureLocalMedia();
      setStatusText('Camera and microphone are ready. You can now join the room.');
      setActionNotice({ type: 'success', message: 'Camera and microphone are ready.' });
    } catch (prepareError) {
      setActionNotice({
        type: 'error',
        message: prepareError instanceof Error ? prepareError.message : 'Failed to access camera.',
      });
    }
  };

  const toggleCamera = () => {
    if (isScreenSharing) {
      setActionNotice({ type: 'error', message: 'Stop screen sharing before toggling camera.' });
      return;
    }

    if (!localStreamRef.current) {
      setActionNotice({ type: 'error', message: 'Enable camera first, then toggle camera state.' });
      return;
    }

    const next = !isCameraOn;
    setIsCameraOn(next);

    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
  };

  const toggleMic = () => {
    if (!localStreamRef.current) {
      setActionNotice({ type: 'error', message: 'Enable camera/microphone first, then toggle mute.' });
      return;
    }

    const next = !isMicOn;
    setIsMicOn(next);

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
  };

  const leaveRoom = () => {
    if (resolvedRoomId) {
      socketRef.current?.emit('interview:presence', {
        roomId: resolvedRoomId,
        state: 'offline',
      });

      if (user.role === 'recruiter') {
        socketRef.current?.emit('interview:end', {
          roomId: resolvedRoomId,
        });
      }
    }

    setIsInRoom(false);
    setIsJoining(false);
    setResolvedRoomId('');
    roomIdRef.current = '';
    cleanupPeer();
    setRemoteStream(null);
    stopScreenShare();
    stopLocalStream();
    setStatusText('You left the room.');
    setActionNotice({ type: 'success', message: 'You left the room.' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GlassToast notice={actionNotice} onClose={() => setActionNotice({ type: '', message: '' })} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <SkillGateBrand size="section" tagline="In-app interview room" />
          <Text style={styles.heroCopy}>
            Join with room ID and run live camera/mic interview directly inside the mobile app.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Room access</Text>
          <TextInput
            style={styles.input}
            value={roomIdInput}
            onChangeText={setRoomIdInput}
            placeholder="Enter room ID"
            placeholderTextColor="rgba(148,163,184,0.8)"
            autoCapitalize="none"
            editable={!isJoining}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.button} onPress={handlePrepareMedia}>
              <Text style={styles.buttonText}>{localStream ? 'Camera Ready' : 'Enable Camera'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, isJoining ? styles.disabled : null]}
              disabled={isJoining || isInRoom}
              onPress={handleJoinRoom}
            >
              <Text style={styles.buttonText}>{isJoining ? 'Joining...' : 'Join Room'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.status}>{statusText}</Text>
          {resolvedRoomId ? <Text style={styles.meta}>Current room: {resolvedRoomId}</Text> : null}
          <Text style={styles.meta}>Media: {isMediaReady ? 'ready' : 'not-ready'}</Text>
          <Text style={styles.meta}>Mic: {isMicOn ? 'unmuted' : 'muted'}</Text>
          <Text style={styles.meta}>Screen: {isScreenSharing ? 'sharing' : 'off'}</Text>
        </View>

        <View style={styles.videoGrid}>
          <View style={styles.videoCard}>
            <Text style={styles.videoTitle}>You</Text>
            {localStream || previewStream ? (
              <RTCView style={styles.video} streamURL={(previewStream || localStream)!.toURL()} objectFit="cover" />
            ) : (
              <View style={styles.videoPlaceholder}>
                <ActivityIndicator color="#fb923c" />
                <Text style={styles.placeholderCopy}>Camera stream appears after joining.</Text>
              </View>
            )}
          </View>

          <View style={styles.videoCard}>
            <Text style={styles.videoTitle}>Peer</Text>
            {remoteStream ? (
              <RTCView style={styles.video} streamURL={remoteStream.toURL()} objectFit="cover" />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.placeholderCopy}>Waiting for the other participant...</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Controls</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.button} onPress={toggleCamera} disabled={!localStream}>
              <Text style={styles.buttonText}>{isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={toggleMic} disabled={!localStream}>
              <Text style={styles.buttonText}>{isMicOn ? 'Mute Mic' : 'Unmute Mic'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, !isInRoom ? styles.disabled : null]}
              onPress={isScreenSharing ? () => stopScreenShare() : startScreenShare}
              disabled={!isInRoom}
            >
              <Text style={styles.buttonText}>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={leaveRoom}
              disabled={!isInRoom && !localStream}
            >
              <Text style={styles.buttonText}>Leave Room</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#040a16',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  hero: {
    gap: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(10,15,26,0.92)',
    padding: 16,
  },
  heroCopy: {
    color: 'rgba(191,219,254,0.9)',
    lineHeight: 21,
    fontSize: 13,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(11,19,36,0.88)',
    padding: 16,
    gap: 10,
  },
  panelTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(5,9,20,0.88)',
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.6)',
    backgroundColor: 'rgba(14,116,144,0.32)',
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dangerButton: {
    borderColor: 'rgba(248,113,113,0.7)',
    backgroundColor: 'rgba(185,28,28,0.32)',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  status: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  noticeCard: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.45)',
    backgroundColor: 'rgba(22,163,74,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeCardError: {
    borderColor: 'rgba(248,113,113,0.45)',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  noticeTextSuccess: {
    color: '#bbf7d0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  noticeTextError: {
    color: '#fecaca',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  meta: {
    color: '#93c5fd',
    fontSize: 12,
  },
  videoGrid: {
    gap: 12,
  },
  videoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(11,19,36,0.88)',
    padding: 14,
    gap: 8,
  },
  videoTitle: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 13,
  },
  video: {
    width: '100%',
    height: 210,
    borderRadius: 12,
    backgroundColor: '#020617',
  },
  videoPlaceholder: {
    width: '100%',
    height: 210,
    borderRadius: 12,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  placeholderCopy: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
});
