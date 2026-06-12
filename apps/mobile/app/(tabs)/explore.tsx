import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import SkillGateBrand from '@/skillgate-brand';
import GlassToast from '@/components/glass-toast';
import AnimatedReveal from '@/components/animated-reveal';
import {
  API_BASE_URL,
  getAssessments,
  getInterviewByRoomIdRequest,
  deleteNotificationRequest,
  deleteInterviewRequest,
  getMyInterviewsRequest,
  getMyAssessmentAttempt,
  getMyNotificationsRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  uploadProfileImageRequest,
  type InterviewSummary,
  type NotificationSummary,
  type AttemptSummary,
  type AssessmentSummary,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

type AttemptActivityItem = {
  assessmentId: string;
  assessmentTitle: string;
  attempt: AttemptSummary;
};

export default function ActivityScreen() {
  const router = useRouter();
  const { token, user, signOut, updateUser } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [attempts, setAttempts] = useState<AttemptActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'interviews' | 'activity'>('account');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | ''; message: string }>({
    type: '',
    message: '',
  });

  useEffect(() => {
    let active = true;

    const loadActivity = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setError(null);

        const assessmentResponse = await getAssessments(token);
        if (!active) return;

        const visibleAssessments = assessmentResponse.assessments ?? [];
        setAssessments(visibleAssessments);

        const [interviewsResponse, notificationsResponse] = await Promise.all([
          getMyInterviewsRequest(token),
          getMyNotificationsRequest(token),
        ]);

        if (!active) return;
        setInterviews(
          (interviewsResponse.interviews ?? []).filter(
            (interview) => interview?.status !== 'cancelled'
          )
        );
        setNotifications(notificationsResponse.notifications ?? []);

        const attemptResults = await Promise.all(
          visibleAssessments.map(async (assessment) => {
            try {
              const response = await getMyAssessmentAttempt(token, assessment._id);
              return {
                assessmentId: assessment._id,
                assessmentTitle: assessment.title,
                attempt: response.attempt,
              };
            } catch (attemptError) {
              const message =
                attemptError instanceof Error ? attemptError.message.toLowerCase() : '';

              if (message.includes('attempt not found')) {
                return null;
              }

              throw attemptError;
            }
          })
        );

        if (!active) return;

        const completedAttemptItems = attemptResults
          .filter(Boolean)
          .sort((left, right) => {
            const leftDate = new Date(left!.attempt.updatedAt ?? left!.attempt.startedAt).getTime();
            const rightDate = new Date(right!.attempt.updatedAt ?? right!.attempt.startedAt).getTime();
            return rightDate - leftDate;
          }) as AttemptActivityItem[];

        setAttempts(completedAttemptItems);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load activity.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadActivity();

    return () => {
      active = false;
    };
  }, [token]);

  const handleSignOut = async () => {
    await signOut();
  };

  const profileImageUrl = user?.profileImageUrl
    ? user.profileImageUrl.startsWith('http')
      ? user.profileImageUrl
      : `${API_BASE_URL}${user.profileImageUrl.startsWith('/') ? user.profileImageUrl : `/${user.profileImageUrl}`}`
    : '';

  const handleUploadProfileImage = async () => {
    if (!token || !user) {
      return;
    }

    setUploadStatus(null);
    setActionNotice({ type: '', message: '' });

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setUploadStatus('Media access is required to upload a profile photo.');
      setActionNotice({ type: 'error', message: 'Media access is required to upload a profile photo.' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    const mimeType = asset.mimeType || 'image/jpeg';
    const fileName = asset.fileName || `profile-${Date.now()}.jpg`;

    setUploadingImage(true);
    setUploadStatus('Uploading image...');

    try {
      const response = await uploadProfileImageRequest(token, {
        uri,
        name: fileName,
        type: mimeType,
      });
      await updateUser(response.user);
      setUploadStatus('Profile photo updated.');
      setActionNotice({ type: 'success', message: 'Profile photo updated successfully.' });
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed.';
      setUploadStatus(message);
      setActionNotice({ type: 'error', message });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!token) return;

    const interview = interviews.find((item) => item._id === interviewId);
    if (!interview || interview.status !== 'completed') {
      return;
    }

    Alert.alert(
      'Delete interview',
      'This will remove the completed interview from your dashboard permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionNotice({ type: '', message: '' });

            try {
              await deleteInterviewRequest(token, interviewId);
              setInterviews((current) => current.filter((item) => item._id !== interviewId));
              setActionNotice({ type: 'success', message: 'Interview deleted.' });
            } catch (deleteError) {
              const message =
                deleteError instanceof Error ? deleteError.message : 'Failed to delete interview.';
              setError(message);
              setActionNotice({ type: 'error', message });
            }
          },
        },
      ]
    );
  };

  const submittedAttempts = useMemo(
    () => attempts.filter((item) => item.attempt.status === 'submitted').length,
    [attempts]
  );

  const inProgressAttempts = useMemo(
    () => attempts.filter((item) => item.attempt.status === 'in_progress').length,
    [attempts]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const handleMarkNotificationRead = async (notificationId: string) => {
    if (!token) return;

    setActionNotice({ type: '', message: '' });

    try {
      await markNotificationReadRequest(token, notificationId);
      setNotifications((current) =>
        current.map((item) => (item._id === notificationId ? { ...item, read: true } : item))
      );
      setActionNotice({ type: 'success', message: 'Notification marked as read.' });
    } catch (markError) {
      const message = markError instanceof Error ? markError.message : 'Failed to mark notification.';
      setError(message);
      setActionNotice({ type: 'error', message });
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;

    setActionNotice({ type: '', message: '' });

    try {
      await markAllNotificationsReadRequest(token);
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setActionNotice({ type: 'success', message: 'All notifications marked as read.' });
    } catch (markError) {
      const message = markError instanceof Error ? markError.message : 'Failed to mark notifications.';
      setError(message);
      setActionNotice({ type: 'error', message });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!token) return;

    const notification = notifications.find((item) => item._id === notificationId);
    if (!notification || !notification.read) {
      return;
    }

    Alert.alert(
      'Delete notification',
      'This will remove the read notification from your dashboard permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionNotice({ type: '', message: '' });

            try {
              await deleteNotificationRequest(token, notificationId);
              const notificationsResponse = await getMyNotificationsRequest(token);
              setNotifications(notificationsResponse.notifications ?? []);
              setActionNotice({ type: 'success', message: 'Notification deleted.' });
            } catch (deleteError) {
              const message =
                deleteError instanceof Error ? deleteError.message : 'Failed to delete notification.';
              setError(message);
              setActionNotice({ type: 'error', message });
            }
          },
        },
      ]
    );
  };

  const handleJoinRoomById = async (value: string) => {
    if (!token) return;

    setActionNotice({ type: '', message: '' });

    const linkMatch = String(value || '').trim().match(/[?&]roomId=([^&#]+)/i);
    const roomId = (linkMatch?.[1] ? decodeURIComponent(linkMatch[1]) : String(value || ''))
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');

    if (!roomId) {
      setError('Room ID is required.');
      setActionNotice({ type: 'error', message: 'Room ID is required.' });
      return;
    }

    try {
      await getInterviewByRoomIdRequest(token, roomId);
      setActionNotice({ type: 'success', message: 'Interview room validated. Joining now...' });
      router.push({
        pathname: '/interview-room' as never,
        params: { roomId },
      });
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : 'Failed to join interview room.';
      setError(message);
      setActionNotice({ type: 'error', message });
    }
  };

  const getRoomIdFromMeetingLink = (meetingLink?: string) => {
    if (!meetingLink) {
      return '';
    }

    const match = meetingLink.match(/[?&]roomId=([^&#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GlassToast notice={actionNotice} onClose={() => setActionNotice({ type: '', message: '' })} />
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedReveal delay={20} duration={340} style={styles.hero}>
          <SkillGateBrand size="section" tagline="Assessment activity" />
          <Text style={styles.heroCopy}>
            Review your saved assessment activity, current progress, and recent feedback from live backend data.
          </Text>

          <View style={styles.sectionTabsRow}>
            {[
              { id: 'account', label: 'Account' },
              { id: 'notifications', label: 'Notifications', badge: unreadNotifications },
              { id: 'interviews', label: 'Interviews', badge: interviews.length },
              { id: 'activity', label: 'Activity' },
            ].map((section) => (
              <TouchableOpacity activeOpacity={0.82}
                key={section.id}
                style={[
                  styles.sectionTabButton,
                  activeSection === section.id ? styles.sectionTabButtonActive : null,
                ]}
                onPress={() => setActiveSection(section.id as 'account' | 'notifications' | 'interviews' | 'activity')}
              >
                <Text style={styles.sectionTabText}>{section.label}</Text>
                {typeof section.badge === 'number' && section.badge > 0 ? (
                  <Text style={styles.sectionTabBadge}>
                    {section.badge > 99 ? '99+' : section.badge}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

        </AnimatedReveal>

        {activeSection === 'account' ? (
        <AnimatedReveal delay={90} duration={380} style={styles.panel}>
          <Text style={styles.panelTitle}>Account</Text>
          <View style={styles.accountRow}>
            {profileImageUrl ? (
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => setShowImagePreview(true)}
                accessibilityRole="button"
              >
                <Image
                  source={{ uri: profileImageUrl }}
                  style={styles.avatarImage}
                  onError={() => setUploadStatus('Could not load profile photo. Try uploading again.')}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U'}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.panelCopy}>
                {user ? `${user.firstName} ${user.lastName} · ${user.role}` : 'No user loaded yet.'}
              </Text>
              {uploadStatus ? <Text style={styles.uploadStatus}>Photo status: {uploadStatus}</Text> : null}
            </View>
          </View>

          <View style={styles.accountActions}>
            <TouchableOpacity activeOpacity={0.82}
              style={styles.uploadButton}
              disabled={uploadingImage}
              onPress={handleUploadProfileImage}
            >
              <Text style={styles.uploadButtonText}>
                {uploadingImage ? 'Uploading...' : 'Upload Photo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.82} style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </AnimatedReveal>
        ) : null}

        {activeSection === 'activity' ? (
        <AnimatedReveal delay={110} duration={390} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{attempts.length}</Text>
            <Text style={styles.statLabel}>Saved attempts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{submittedAttempts}</Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{inProgressAttempts}</Text>
            <Text style={styles.statLabel}>In progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{unreadNotifications}</Text>
            <Text style={styles.statLabel}>Unread alerts</Text>
          </View>
        </AnimatedReveal>
        ) : null}

        {activeSection === 'notifications' ? (
        <View style={styles.panel}>
          <View style={styles.notificationHeader}>
            <Text style={styles.panelTitle}>Notifications</Text>
            <TouchableOpacity activeOpacity={0.82} style={styles.uploadButton} onPress={handleMarkAllRead}>
              <Text style={styles.uploadButtonText}>Mark all read</Text>
            </TouchableOpacity>
          </View>
          {notifications.length === 0 ? (
            <Text style={styles.panelCopy}>No notifications yet.</Text>
          ) : (
            notifications.slice(0, 6).map((item, index) => (
              <AnimatedReveal
                key={item._id}
                delay={150 + Math.min(index * 40, 260)}
                duration={360}
                style={styles.card}
              >
                <Text style={styles.cardTitle}>
                  {item.read ? 'Read' : 'Unread'} · {item.title}
                </Text>
                <Text style={styles.cardCopy}>{item.message}</Text>
                <View style={styles.cardActionRow}>
                  {!item.read ? (
                    <TouchableOpacity activeOpacity={0.82}
                      style={styles.inlineButton}
                      onPress={() => handleMarkNotificationRead(item._id)}
                    >
                      <Text style={styles.inlineButtonText}>Mark read</Text>
                    </TouchableOpacity>
                  ) : null}
                  {item.read ? (
                    <TouchableOpacity activeOpacity={0.82}
                      style={[styles.inlineButton, styles.deleteButton]}
                      onPress={() => handleDeleteNotification(item._id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </AnimatedReveal>
            ))
          )}
        </View>
        ) : null}

        {activeSection === 'interviews' ? (
        <AnimatedReveal delay={110} duration={390} style={styles.panel}>
          <Text style={styles.panelTitle}>Interviews</Text>
          <TextInput
            value={roomIdInput}
            onChangeText={setRoomIdInput}
            placeholder="Paste room ID from recruiter email"
            placeholderTextColor="rgba(148,163,184,0.75)"
            style={styles.roomInput}
            autoCapitalize="none"
          />
          <TouchableOpacity activeOpacity={0.82} style={styles.inlineButton} onPress={() => handleJoinRoomById(roomIdInput)}>
            <Text style={styles.inlineButtonText}>Join Room By ID</Text>
          </TouchableOpacity>

          {interviews.length === 0 ? (
            <Text style={styles.panelCopy}>No interviews scheduled yet.</Text>
          ) : (
            interviews.slice(0, 4).map((item, index) => (
              <AnimatedReveal
                key={item._id}
                delay={140 + Math.min(index * 45, 260)}
                duration={360}
                style={styles.card}
              >
                <Text style={styles.cardTitle}>{item.assessment?.title || 'Interview session'}</Text>
                <Text style={styles.cardCopy}>
                  Status: {item.status} · {new Date(item.scheduledAt).toLocaleString()}
                </Text>
                <Text style={styles.cardMeta}>Room ID: {item.roomId || 'Not available yet'}</Text>
                <View style={styles.cardActionRow}>
                  {item.meetingLink || item.roomId ? (
                    <TouchableOpacity activeOpacity={0.82}
                      style={styles.inlineButton}
                      onPress={() => {
                        const resolvedRoomId = item.roomId || getRoomIdFromMeetingLink(item.meetingLink);
                        if (!resolvedRoomId) {
                          setError('Room ID is not available for this interview yet.');
                          setActionNotice({ type: 'error', message: 'Room ID is not available for this interview yet.' });
                          return;
                        }

                        router.push({
                          pathname: '/interview-room' as never,
                          params: { roomId: resolvedRoomId },
                        });
                      }}
                    >
                      <Text style={styles.inlineButtonText}>Join Interview</Text>
                    </TouchableOpacity>
                  ) : null}
                  {item.status === 'completed' ? (
                    <TouchableOpacity activeOpacity={0.82}
                      style={[styles.inlineButton, styles.deleteButton]}
                      onPress={() => handleDeleteInterview(item._id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </AnimatedReveal>
            ))
          )}
        </AnimatedReveal>
        ) : null}

        {activeSection === 'activity' ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Visible assessments</Text>
          <Text style={styles.panelCopy}>
            You currently have access to {assessments.length} assessment{assessments.length === 1 ? '' : 's'}.
          </Text>
        </View>
        ) : null}

        {activeSection === 'activity' && loading ? (
          <View style={styles.panel}>
            <Text style={styles.panelCopy}>Loading activity...</Text>
          </View>
        ) : activeSection === 'activity' && error ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Could not load activity</Text>
            <Text style={styles.panelCopy}>{error}</Text>
          </View>
        ) : activeSection === 'activity' && attempts.length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>No saved attempts yet</Text>
            <Text style={styles.panelCopy}>
              Start an assigned assessment from the Home tab and your activity will appear here.
            </Text>
          </View>
        ) : activeSection === 'activity' ? (
          attempts.map((item, index) => {
            const aiFeedback = item.attempt.answers?.[0]?.aiFeedback ?? '';
            const updatedAt = item.attempt.submittedAt ?? item.attempt.startedAt;

            return (
              <AnimatedReveal
                key={item.attempt._id}
                delay={160 + Math.min(index * 35, 260)}
                duration={360}
                style={styles.card}
              >
                <Text style={styles.cardTitle}>{item.assessmentTitle}</Text>
                <Text style={styles.cardCopy}>
                  Status: {item.attempt.status} · Score: {item.attempt.totalScoreEarned} / {item.attempt.maxScore}
                </Text>
                <Text style={styles.cardMeta}>
                  Last updated: {new Date(updatedAt).toLocaleString()}
                </Text>

                {aiFeedback ? (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>Latest AI feedback</Text>
                    <Text style={styles.feedbackText}>{aiFeedback}</Text>
                  </View>
                ) : (
                  <Text style={styles.cardMeta}>No AI feedback saved for this attempt yet.</Text>
                )}
              </AnimatedReveal>
            );
          })
        ) : null}

        <Modal
          visible={showImagePreview && Boolean(profileImageUrl)}
          animationType="fade"
          transparent
          statusBarTranslucent
          presentationStyle="overFullScreen"
          onRequestClose={() => setShowImagePreview(false)}
        >
          <View style={styles.imageModalOverlay}>
            <View style={styles.imageModalCard}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.imageModalClose}
                onPress={() => setShowImagePreview(false)}
              >
                <Text style={styles.imageModalCloseText}>Close</Text>
              </TouchableOpacity>
              {profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={styles.imageModalImage} />
              ) : null}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071524',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 26,
    gap: 14,
  },
  hero: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: 'rgba(11,32,52,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(103,230,220,0.26)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  heroCopy: {
    marginTop: 14,
    color: 'rgba(203,213,225,0.8)',
    lineHeight: 22,
    fontSize: 14,
  },
  noticeCard: {
    marginTop: 12,
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
  sectionTabsRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
  },
  sectionTabButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
    backgroundColor: 'rgba(9,24,40,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sectionTabButtonActive: {
    borderColor: 'rgba(37,210,197,0.66)',
    backgroundColor: 'rgba(37,210,197,0.2)',
    shadowColor: '#25d2c5',
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTabText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionTabBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  panel: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: 'rgba(9,24,40,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
    shadowColor: '#020617',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  panelTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  panelCopy: {
    marginTop: 8,
    color: 'rgba(203,213,225,0.78)',
    lineHeight: 22,
    fontSize: 14,
  },
  accountRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(251,146,60,0.5)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(251,146,60,0.5)',
    backgroundColor: 'rgba(251,146,60,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fdba74',
    fontSize: 16,
    fontWeight: '800',
  },
  accountActions: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  uploadButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(251,146,60,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.35)',
  },
  uploadButtonText: {
    color: '#fed7aa',
    fontSize: 14,
    fontWeight: '800',
  },
  uploadStatus: {
    marginTop: 6,
    color: 'rgba(226,232,240,0.72)',
    fontSize: 12,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(9,24,40,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,173,120,0.24)',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 6,
    color: 'rgba(203,213,225,0.74)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(9,24,40,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
    shadowColor: '#020617',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
  },
  cardCopy: {
    marginTop: 8,
    color: 'rgba(203,213,225,0.78)',
    lineHeight: 22,
    fontSize: 14,
  },
  cardMeta: {
    marginTop: 8,
    color: 'rgba(148,163,184,0.86)',
    fontSize: 12,
    lineHeight: 18,
  },
  inlineButton: {
    marginTop: 10,
    borderRadius: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37,210,197,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(37,210,197,0.38)',
    paddingHorizontal: 12,
  },
  roomInput: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(5,9,20,0.88)',
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  inlineButtonText: {
    color: '#9ef4ee',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  deleteButton: {
    backgroundColor: 'rgba(127,29,29,0.95)',
    borderColor: 'rgba(248,113,113,0.34)',
  },
  deleteButtonText: {
    color: '#fecaca',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  feedbackBox: {
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(37,210,197,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(103,230,220,0.3)',
  },
  feedbackLabel: {
    color: '#9ef4ee',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  feedbackText: {
    marginTop: 8,
    color: '#f8fafc',
    lineHeight: 20,
    fontSize: 14,
  },
  signOutButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.22)',
  },
  signOutText: {
    color: '#fecaca',
    fontSize: 14,
    fontWeight: '800',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  imageModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)',
    backgroundColor: 'rgba(15,23,42,0.94)',
    padding: 14,
    gap: 10,
  },
  imageModalImage: {
    width: '100%',
    height: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.3)',
    backgroundColor: 'rgba(2,6,23,0.72)',
    resizeMode: 'contain',
  },
  imageModalClose: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageModalCloseText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
});
