import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSession } from '../features/auth/authSlice';
import { registerRequest } from '../services/apiClient';
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
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12
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
  roleRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },
  roleButton: {
    border: '1px solid rgba(173,228,255,0.22)',
    borderRadius: 16,
    padding: '12px 16px',
    background: 'linear-gradient(150deg, rgba(10,30,50,0.92) 0%, rgba(6,16,28,0.92) 100%)',
    color: '#e2e8f0',
    fontWeight: 700,
    cursor: 'pointer'
  },
  roleButtonActive: {
    border: '1px solid rgba(37,210,197,0.5)',
    background: 'rgba(37,210,197,0.18)',
    color: '#ccfbf5'
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
  },
  mobileRow: {
    gridTemplateColumns: '1fr'
  }
};

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('candidate');
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

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      const message = 'Please complete all required fields.';
      setError(message);
      setActionNotice({ type: 'error', message });
      return;
    }

    if (password.length < 8) {
      const message = 'Password must be at least 8 characters long.';
      setError(message);
      setActionNotice({ type: 'error', message });
      return;
    }

    if (password !== confirmPassword) {
      const message = 'Passwords do not match.';
      setError(message);
      setActionNotice({ type: 'error', message });
      return;
    }

    try {
      const data = await registerRequest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role
      });

      dispatch(setSession({ accessToken: data.accessToken, user: data.user }));
      navigate(data.user.role === 'candidate' ? '/candidate' : '/recruiter');
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
          <SkillGateBrand size="hero" subtitle="Create your SkillGate account" />
          <p style={styles.heroCopy}>
            Set up a recruiter or candidate account to access assessments, interview rooms,
            collaboration features, and AI-assisted feedback from the same platform.
          </p>

          <div style={styles.heroAccentLine} />

          <div style={styles.heroPanel}>
            <p style={styles.heroCopy}>
              Registration starts a secure session immediately so you can land directly in the
              correct workspace without extra setup steps.
            </p>
          </div>

          <div style={styles.badgeRow}>
            <span style={styles.badge}>Candidate Access</span>
            <span style={styles.badge}>Recruiter Access</span>
            <span style={styles.badge}>Interview Rooms</span>
            <span style={styles.badge}>Assessment Workflows</span>
          </div>
        </section>

        <section style={styles.formPanel}>
          <h2 style={styles.formTitle}>Register</h2>
          <p style={styles.formCopy}>
            Create your account and continue directly into the platform.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={{ ...styles.row, ...(window.innerWidth <= 860 ? styles.mobileRow : null) }}>
              <div>
                <div style={styles.labelRow}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>First name</label>
                  <FieldHelp text="Enter the first name you want shown in interview and dashboard views." />
                </div>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={styles.input} placeholder="First name" />
              </div>

              <div>
                <div style={styles.labelRow}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>Last name</label>
                  <FieldHelp text="Enter the last name attached to this account." />
                </div>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={styles.input} placeholder="Last name" />
              </div>
            </div>

            <div>
              <div style={styles.labelRow}>
                <label style={{ ...styles.label, marginBottom: 0 }}>Email</label>
                <FieldHelp text="Use the email you will use for future sign-in." />
              </div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} placeholder="Email" />
            </div>

            <div>
              <div style={styles.labelRow}>
                <label style={{ ...styles.label, marginBottom: 0 }}>Role</label>
                <FieldHelp text="Choose the workspace you need. Candidate is for taking assessments, recruiter is for creating and managing them." />
              </div>
              <div style={styles.roleRow}>
                {['candidate', 'recruiter'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    style={{
                      ...styles.roleButton,
                      ...(role === option ? styles.roleButtonActive : null)
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={styles.labelRow}>
                <label style={{ ...styles.label, marginBottom: 0 }}>Password</label>
                <FieldHelp text="Passwords must be at least 8 characters long." />
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="Create password" />
            </div>

            <div>
              <div style={styles.labelRow}>
                <label style={{ ...styles.label, marginBottom: 0 }}>Confirm password</label>
                <FieldHelp text="Repeat your password to catch typos before submitting." />
              </div>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={styles.input} placeholder="Confirm password" />
            </div>

            <div style={styles.buttonRow}>
              <button type="submit" style={styles.button}>Create account</button>
              <button type="button" style={styles.ghostButton} onClick={() => navigate('/login')}>Back to login</button>
            </div>
          </form>

          {error ? <p style={styles.error}>{error}</p> : null}

          <div style={styles.poweredBy}>
            Registration creates a working session immediately. Recruiters land in the dashboard and candidates land in their assessment workspace.
          </div>

          <p style={styles.note}>
            Admin accounts remain backend-managed and are not exposed through the public register flow.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;