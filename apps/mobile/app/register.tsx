import { Link, Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import SkillGateBrand from '@/skillgate-brand';
import GlassToast from '@/components/glass-toast';
import FieldHelp from '@/components/field-help';
import AnimatedReveal from '@/components/animated-reveal';
import SpringPressable from '@/components/spring-pressable';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function RegisterScreen() {
  const { signUp, signingUp, error, user, token } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [localError, setLocalError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | ''; message: string }>({
    type: '',
    message: '',
  });

  const effectiveError = localError ?? error;

  const apiHint = useMemo(() => {
    if (API_BASE_URL.includes('localhost')) {
      return 'Using localhost. On a real phone, set EXPO_PUBLIC_API_URL to your computer LAN IP.';
    }
    return `Using API: ${API_BASE_URL}`;
  }, []);

  if (token && user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleRegister = async () => {
    setLocalError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      const message = 'Please complete all required fields.';
      setLocalError(message);
      setActionNotice({ type: 'error', message });
      return;
    }

    if (password.length < 8) {
      const message = 'Password must be at least 8 characters long.';
      setLocalError(message);
      setActionNotice({ type: 'error', message });
      return;
    }

    if (password !== confirmPassword) {
      const message = 'Passwords do not match.';
      setLocalError(message);
      setActionNotice({ type: 'error', message });
      return;
    }

    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
      });
    } catch (registerError) {
      const message = registerError instanceof Error ? registerError.message : 'Registration failed.';
      if (message.toLowerCase().includes('failed to fetch')) {
        setLocalError(
          'Could not reach backend API. Verify server is running and EXPO_PUBLIC_API_URL is correct.'
        );
        setActionNotice({
          type: 'error',
          message: 'Could not reach backend API. Verify server is running and EXPO_PUBLIC_API_URL is correct.',
        });
      } else {
        setActionNotice({ type: 'error', message });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GlassToast notice={actionNotice} onClose={() => setActionNotice({ type: '', message: '' })} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AnimatedReveal delay={30} duration={360} style={styles.hero}>
            <SkillGateBrand size="hero" tagline="Create your account" />
            <Text style={styles.copy}>
              Register as a candidate or recruiter and go straight into the live SkillGate experience.
            </Text>
          </AnimatedReveal>

          <AnimatedReveal delay={110} duration={430} style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Register</Text>
              <Text style={styles.sectionCopy}>Create a secure account and continue directly into the app.</Text>
            </View>

            <Text style={styles.helperText}>{apiHint}</Text>

            <View style={styles.splitRow}>
              <View style={styles.splitColumn}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>First Name</Text>
                  <FieldHelp text="Your first name is shown across interview and dashboard views." />
                </View>
                <TextInput
                  placeholder="First name"
                  placeholderTextColor="rgba(148,163,184,0.8)"
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={styles.splitColumn}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Last Name</Text>
                  <FieldHelp text="Your last name is stored with the account profile." />
                </View>
                <TextInput
                  placeholder="Last name"
                  placeholderTextColor="rgba(148,163,184,0.8)"
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={[styles.labelRow, styles.labelSpacing]}>
              <Text style={styles.label}>Email</Text>
              <FieldHelp text="Use the email you want to use for future login." />
            </View>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="candidate@example.com"
              placeholderTextColor="rgba(148,163,184,0.8)"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <View style={[styles.labelRow, styles.labelSpacing]}>
              <Text style={styles.label}>Role</Text>
              <FieldHelp text="Candidate is for taking assessments. Recruiter is for building and managing them." />
            </View>
            <View style={styles.roleRow}>
              {['candidate', 'recruiter'].map((option) => (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.82}
                  style={[styles.roleButton, role === option ? styles.roleButtonActive : null]}
                  onPress={() => setRole(option as 'candidate' | 'recruiter')}
                >
                  <Text style={styles.roleButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.labelRow, styles.labelSpacing]}>
              <Text style={styles.label}>Password</Text>
              <FieldHelp text="Passwords must be at least 8 characters long." />
            </View>
            <TextInput
              autoCapitalize="none"
              autoComplete="password-new"
              placeholder="Create password"
              placeholderTextColor="rgba(148,163,184,0.8)"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <View style={[styles.labelRow, styles.labelSpacing]}>
              <Text style={styles.label}>Confirm Password</Text>
              <FieldHelp text="Repeat the password to prevent setup mistakes." />
            </View>
            <TextInput
              autoCapitalize="none"
              placeholder="Confirm password"
              placeholderTextColor="rgba(148,163,184,0.8)"
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {effectiveError ? <Text style={styles.errorText}>{effectiveError}</Text> : null}

                <SpringPressable
              activeOpacity={0.82}
              accessibilityRole="button"
              disabled={signingUp}
              style={[styles.button, signingUp ? styles.buttonDisabled : null]}
              onPress={handleRegister}
            >
              {signingUp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
                </SpringPressable>

            <Link href="/login" asChild>
                  <SpringPressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Back to login</Text>
                  </SpringPressable>
            </Link>
          </AnimatedReveal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#071524',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingVertical: 24,
    justifyContent: 'center',
    gap: 14,
  },
  hero: {
    borderRadius: 30,
    padding: 20,
    backgroundColor: 'rgba(11,32,52,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(103,230,220,0.24)',
    shadowColor: '#020617',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 6,
  },
  copy: {
    marginTop: 16,
    color: 'rgba(229,239,247,0.84)',
    lineHeight: 22,
    fontSize: 14,
  },
  formCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: 'rgba(10,26,43,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
    shadowColor: '#020617',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
    gap: 2,
  },
  sectionHeader: {
    marginTop: 2,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(249,115,22,0.55)',
    paddingLeft: 10,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  sectionCopy: {
    marginTop: 8,
    color: 'rgba(203,213,225,0.78)',
    fontSize: 14,
    lineHeight: 22,
  },
  helperText: {
    color: 'rgba(203,213,225,0.78)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitColumn: {
    flex: 1,
  },
  label: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labelSpacing: {
    marginTop: 12,
  },
  input: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.22)',
    backgroundColor: 'rgba(6,18,31,0.94)',
    color: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  },
  roleRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.22)',
    backgroundColor: 'rgba(6,18,31,0.84)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonActive: {
    borderColor: 'rgba(37,210,197,0.52)',
    backgroundColor: 'rgba(37,210,197,0.18)',
  },
  roleButtonText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  errorText: {
    marginTop: 12,
    color: '#fb7185',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#25d2c5',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'rgba(192,255,248,0.35)',
    shadowColor: '#25d2c5',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#062434',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(158,213,255,0.2)',
    backgroundColor: 'rgba(8,22,36,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 14,
  },
});