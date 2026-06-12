import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setSession } from '../features/auth/authSlice';
import { loginRequest } from '../services/apiClient';
import SkillGateBrand from '../components/SkillGateBrand';
import FieldHelp from '../components/FieldHelp';
import GlassToast from '../components/GlassToast';

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '32px 20px',
    background:
      'radial-gradient(85% 72% at 0% 0%, rgba(37,210,197,0.24) 0%, transparent 64%), radial-gradient(64% 58% at 100% 10%, rgba(255,147,77,0.2) 0%, transparent 62%), linear-gradient(154deg, #06111f 0%, #0b1f36 52%, #113459 100%)',
    backgroundSize: '150% 150%',
    animation: 'portalGradientShift 18s ease-in-out infinite',
    fontFamily: '"Space Grotesk", "Manrope", "Segoe UI", sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: 980,
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    borderRadius: 40,
    overflow: 'hidden',
    boxShadow: '0 36px 96px rgba(2, 6, 23, 0.58), inset 0 1px 0 rgba(255,255,255,0.08)',
    border: '1px solid rgba(173,228,255,0.24)',
    background: 'linear-gradient(150deg, rgba(9,24,40,0.94) 0%, rgba(6,18,31,0.92) 100%)',
    backdropFilter: 'blur(30px)',
    animation: 'portalLiftIn 360ms ease both'
  },
  hero: {
    padding: 36,
    background: 'linear-gradient(150deg, rgba(10,30,50,0.94) 0%, rgba(7,20,34,0.94) 100%)',
    color: '#e2e8f0',
    borderRight: '1px solid rgba(37,210,197,0.32)',
    position: 'relative',
    overflow: 'hidden',
    animation: 'portalLiftIn 420ms ease both'
  },
  heroAccentLine: {
    marginTop: 14,
    height: 3,
    width: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, rgba(37,210,197,0.9) 0%, rgba(255,147,77,0.72) 100%)'
  },
  heroCopy: {
    marginTop: 14,
    lineHeight: 1.7,
    maxWidth: 460,
    color: 'rgba(226,232,240,0.78)'
  },
  heroPanel: {
    marginTop: 24,
    padding: 18,
    borderRadius: 22,
    background: 'linear-gradient(145deg, rgba(10,30,50,0.82) 0%, rgba(6,16,28,0.9) 100%)',
    border: '1px solid rgba(103,230,220,0.3)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)'
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22
  },
  badge: {
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(103,230,220,0.3)',
    color: '#e2e8f0',
    fontSize: 12,
    letterSpacing: '0.04em',
    textTransform: 'none'
  },
  formPanel: {
    padding: 36,
    background: 'linear-gradient(180deg, rgba(6,18,31,0.9) 0%, rgba(10,30,50,0.9) 100%)',
    borderLeft: '1px solid rgba(173,228,255,0.24)',
    animation: 'portalLiftIn 500ms ease both'
  },
  formTitle: {
    margin: 0,
    fontSize: 30,
    color: '#f8fafc',
    paddingLeft: 10,
    borderLeft: '3px solid rgba(37,210,197,0.66)'
  },
  formCopy: {
    marginTop: 10,
    color: 'rgba(203,213,225,0.74)',
    lineHeight: 1.6
  },
  form: {
    display: 'grid',
    gap: 14,
    marginTop: 22
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: 700
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 16,
    border: '1px solid rgba(173,228,255,0.26)',
    padding: '12px 14px',
    fontSize: 14,
    outline: 'none',
    background: 'rgba(7,20,34,0.92)',
    color: '#eff6ff'
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 6
  },
  button: {
    border: 'none',
    borderRadius: 16,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #25d2c5 0%, #1593bb 52%, #ff934d 100%)',
    color: '#042433',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 20px 38px rgba(37,210,197,0.28)'
  },
  ghostButton: {
    border: '1px solid rgba(173,228,255,0.24)',
    borderRadius: 16,
    padding: '12px 16px',
    background: 'linear-gradient(150deg, rgba(10,30,50,0.92) 0%, rgba(6,16,28,0.92) 100%)',
    color: '#e2e8f0',
    fontWeight: 700,
    cursor: 'pointer'
  },
  error: {
    color: '#b91c1c',
    marginTop: 12,
    fontWeight: 700
  },
  note: {
    marginTop: 18,
    fontSize: 13,
    color: 'rgba(148,163,184,0.9)',
    lineHeight: 1.6
  },
  poweredBy: {
    marginTop: 18,
    padding: '12px 14px',
    borderRadius: 16,
    background: 'rgba(37,210,197,0.14)',
    border: '1px solid rgba(103,230,220,0.3)',
    color: '#ccfbf5',
    fontSize: 13,
    lineHeight: 1.6
  },
  mobileCard: {
    gridTemplateColumns: '1fr'
  },
  mobileHero: {
    borderRight: 'none',
    borderBottom: '1px solid rgba(37,210,197,0.32)',
    paddingBottom: 30
  }
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState({ type: '', message: '' });

  useEffect(() => {
    if (!error) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setActionNotice({ type: 'error', message: error });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [error]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      const message = 'Please enter both email and password.';
      setError(message);
      setActionNotice({ type: 'error', message });
      return;
    }

    try {
      const data = await loginRequest({
        email: email.trim(),
        password
      });

      dispatch(setSession({ accessToken: data.accessToken, user: data.user }));

      const redirectTarget = searchParams.get('redirect');
      if (redirectTarget) {
        navigate(redirectTarget);
        return;
      }

      if (data.user.role === 'candidate') {
        navigate('/candidate');
      } else {
        navigate('/recruiter');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.shell}>
      <GlassToast notice={actionNotice} onClose={() => setActionNotice({ type: '', message: '' })} />
      <div
        style={{
          ...styles.card,
          ...(window.innerWidth <= 860 ? styles.mobileCard : null),
        }}
      >
        <section
          style={{
            ...styles.hero,
            ...(window.innerWidth <= 860 ? styles.mobileHero : null),
          }}
        >
          <SkillGateBrand size="hero" subtitle="Secure technical interview platform" />
          <p style={styles.heroCopy}>
            A technical interview and hiring platform with role-based access, timed
            assessments, collaborative coding, deterministic output grading, and AI-assisted feedback.
          </p>

          <div style={styles.heroAccentLine} />

          <div style={styles.heroPanel}>
            <p style={styles.heroCopy}>
              Sign in to access recruiter workflows, candidate assessments, and collaborative
              interview features from a single platform.
            </p>
          </div>

          <div style={styles.badgeRow}>
            <span style={styles.badge}>Candidate Portal</span>
            <span style={styles.badge}>Recruiter Dashboard</span>
            <span style={styles.badge}>Socket Collaboration</span>
            <span style={styles.badge}>AI Feedback</span>
          </div>
        </section>

        <section style={styles.formPanel}>
          <h2 style={styles.formTitle}>Sign in</h2>
          <p style={styles.formCopy}>
            Enter your account credentials to continue.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <div style={styles.labelRow}>
                <label style={{ ...styles.label, marginBottom: 0 }}>Email</label>
                <FieldHelp text="Use the email tied to your recruiter or candidate account." />
              </div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="Email"
              />
            </div>

            <div>
              <div style={styles.labelRow}>
                <label style={{ ...styles.label, marginBottom: 0 }}>Password</label>
                <FieldHelp text="Enter your account password. Passwords are never shown on screen." />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="Password"
              />
            </div>

            <div style={styles.buttonRow}>
              <button type="submit" style={styles.button}>
                Login
              </button>
              <button type="button" style={styles.ghostButton} onClick={() => navigate('/register')}>
                Create account
              </button>
            </div>
          </form>

          {error ? <p style={styles.error}>{error}</p> : null}

          <div style={styles.poweredBy}>
            AI feedback uses OpenAI when configured, with fallback coaching text available
            when AI is unavailable. Scoring remains deterministic based on configured test outputs.
          </div>

          <p style={styles.note}>
            Use a recruiter or candidate account created in your backend database.
          </p>

          <p style={styles.note}>
            Need an account first? Use Create account to register as a candidate or recruiter.
          </p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;