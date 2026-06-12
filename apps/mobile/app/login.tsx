import { Redirect, useRouter } from 'expo-router';
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
  View,
} from 'react-native';

import SkillGateBrand from '@/skillgate-brand';
import GlassToast from '@/components/glass-toast';
import FieldHelp from '@/components/field-help';
import AnimatedReveal from '@/components/animated-reveal';
import SpringPressable from '@/components/spring-pressable';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signingIn, error, user, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      const message = 'Please provide both email and password.';
      setLocalError(message);
      setActionNotice({ type: 'error', message });
      return;
    }

    try {
      await signIn(email.trim(), password);
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Login failed.';
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
            <SkillGateBrand size="hero" tagline="Secure mobile sign in" />
            <Text style={styles.copy}>
              Sign in to load your assessments, track attempts, and review AI feedback directly
              from live backend data.
            </Text>
          </AnimatedReveal>

          <AnimatedReveal delay={110} duration={420} style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sign in</Text>
              <Text style={styles.sectionCopy}>Access your recruiter or candidate workspace.</Text>
            </View>

            <Text style={styles.helperText}>{apiHint}</Text>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Email</Text>
              <FieldHelp text="Use the email for your recruiter or candidate account." />
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
              <Text style={styles.label}>Password</Text>
              <FieldHelp text="Enter your account password. This field stays hidden." />
            </View>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              placeholder="Enter your password"
              placeholderTextColor="rgba(148,163,184,0.8)"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            {effectiveError ? <Text style={styles.errorText}>{effectiveError}</Text> : null}

            <SpringPressable
              accessibilityRole="button"
              disabled={signingIn}
              style={[styles.button, signingIn ? styles.buttonDisabled : null]}
              onPress={handleLogin}
            >
              {signingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </SpringPressable>

            <SpringPressable
              style={styles.secondaryButton}
              onPress={() => router.push('/register' as any)}
            >
              <Text style={styles.secondaryButtonText}>Create account</Text>
            </SpringPressable>
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
    borderRadius: 18,
    minHeight: 54,
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