const getTheme = (variant) => {
  if (variant === 'recruiter') {
    return {
      shellBackground:
        'radial-gradient(85% 72% at 100% 0%, rgba(255,145,77,0.26) 0%, transparent 64%), radial-gradient(64% 58% at 0% 22%, rgba(37,210,197,0.22) 0%, transparent 60%), linear-gradient(154deg, #06111f 0%, #0b1f36 52%, #113459 100%)',
      heroBackground: 'linear-gradient(150deg, rgba(12,31,52,0.92) 0%, rgba(7,20,34,0.92) 100%)',
      primaryButtonBg: 'linear-gradient(135deg, #ff934d 0%, #ff6b35 100%)',
      primaryGlow: 'rgba(255,107,53,0.34)',
      secondaryGlow: 'rgba(37,210,197,0.24)',
      feedbackBg: 'linear-gradient(150deg, rgba(255,147,77,0.2) 0%, rgba(17,46,77,0.62) 100%)',
      feedbackBorder: 'rgba(255,173,120,0.46)'
    };
  }

  return {
    shellBackground:
      'radial-gradient(82% 68% at 0% 0%, rgba(37,210,197,0.24) 0%, transparent 64%), radial-gradient(65% 56% at 100% 10%, rgba(255,147,77,0.2) 0%, transparent 62%), linear-gradient(154deg, #06111f 0%, #0b1f36 52%, #113459 100%)',
    heroBackground: 'linear-gradient(150deg, rgba(10,30,50,0.92) 0%, rgba(7,20,34,0.92) 100%)',
    primaryButtonBg: 'linear-gradient(135deg, #25d2c5 0%, #1593bb 54%, #ff934d 100%)',
    primaryGlow: 'rgba(37,210,197,0.3)',
    secondaryGlow: 'rgba(255,147,77,0.24)',
    feedbackBg: 'linear-gradient(150deg, rgba(37,210,197,0.18) 0%, rgba(17,46,77,0.62) 100%)',
    feedbackBorder: 'rgba(104,235,222,0.46)'
  };
};

const createPortalStyles = (variant = 'candidate') => {
  const theme = getTheme(variant);

  return {
    shell: {
      minHeight: '100vh',
      padding: '26px 18px 44px',
      background: theme.shellBackground,
      backgroundSize: '140% 140%',
      animation: 'portalGradientShift 18s ease-in-out infinite',
      fontFamily: '"Space Grotesk", "Manrope", "Segoe UI", sans-serif',
      color: '#e2e8f0'
    },
    container: {
      maxWidth: 1320,
      margin: '0 auto'
    },
    hero: {
      background: theme.heroBackground,
      color: '#f8fafc',
      borderRadius: 40,
      padding: 34,
      border: '1px solid rgba(173,228,255,0.24)',
      backdropFilter: 'blur(26px)',
      boxShadow:
        variant === 'recruiter'
          ? '0 36px 96px rgba(2,10,28,0.58), inset 0 1px 0 rgba(255,255,255,0.12), inset -120px 0 160px rgba(255,147,77,0.12), inset 0 -16px 30px rgba(7,20,34,0.42)'
          : '0 36px 96px rgba(2,10,28,0.58), inset 0 1px 0 rgba(255,255,255,0.12), inset -120px 0 160px rgba(37,210,197,0.12), inset 0 -16px 30px rgba(7,20,34,0.42)',
      marginBottom: 24,
      position: 'relative',
      overflow: 'hidden',
      animation: 'portalLiftIn 360ms ease both'
    },
    heroAccentLine: {
      marginTop: 14,
      height: 4,
      width: '100%',
      borderRadius: 999,
      background:
        variant === 'recruiter'
          ? 'linear-gradient(90deg, rgba(255,147,77,0.95) 0%, rgba(37,210,197,0.7) 100%)'
          : 'linear-gradient(90deg, rgba(37,210,197,0.9) 0%, rgba(255,147,77,0.72) 100%)'
    },
    heroTop: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 18,
      flexWrap: 'wrap',
      alignItems: 'flex-start'
    },
    heroTitle: {
      margin: 0,
      fontSize: 34,
      lineHeight: 1.1
    },
    heroCopy: {
      margin: '10px 0 0',
      maxWidth: 700,
      color: 'rgba(226,232,240,0.76)',
      lineHeight: 1.6
    },
    badgeRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 18
    },
    badge: {
      padding: '8px 13px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(251,146,60,0.24)',
      color: '#e2e8f0',
      fontSize: 12,
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 20,
      alignItems: 'start'
    },
    splitLayout: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 0.8fr)',
      gap: 20,
      alignItems: 'start'
    },
    mainColumn: {
      display: 'grid',
      gap: 18,
      minWidth: 0
    },
    railColumn: {
      display: 'grid',
      gap: 14,
      minWidth: 0
    },
    railSticky: {
      position: 'sticky',
      top: 16,
      display: 'grid',
      gap: 14
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 10
    },
    statCard: {
      padding: '12px 14px',
      borderRadius: 16,
      background: 'linear-gradient(160deg, rgba(4,10,21,0.86) 0%, rgba(10,20,38,0.92) 100%)',
      border: '1px solid rgba(148,163,184,0.24)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
    },
    statLabel: {
      margin: 0,
      fontSize: 11,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'rgba(203,213,225,0.72)'
    },
    statValue: {
      margin: '6px 0 0',
      fontSize: 18,
      color: '#f8fafc',
      fontWeight: 800
    },
    panel: {
      background:
        variant === 'recruiter'
          ? 'linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(2,6,23,0.78) 100%), linear-gradient(135deg, rgba(249,115,22,0.36) 0%, rgba(59,130,246,0.34) 100%) border-box'
          : 'linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(2,6,23,0.78) 100%), linear-gradient(135deg, rgba(59,130,246,0.38) 0%, rgba(249,115,22,0.32) 100%) border-box',
      borderRadius: 32,
      padding: 24,
      border: '1px solid transparent',
      backgroundClip: 'padding-box, border-box',
      backgroundOrigin: 'padding-box, border-box',
      backdropFilter: 'blur(30px)',
      boxShadow:
        variant === 'recruiter'
          ? '0 28px 72px rgba(2,6,23,0.5), inset 0 1px 0 rgba(255,255,255,0.08), inset -80px 0 120px rgba(249,115,22,0.06), inset 0 -14px 30px rgba(8,15,29,0.42), 0 0 0 1px rgba(249,115,22,0.16)'
          : '0 28px 72px rgba(2,6,23,0.5), inset 0 1px 0 rgba(255,255,255,0.08), inset -80px 0 120px rgba(56,189,248,0.06), inset 0 -14px 30px rgba(8,15,29,0.42), 0 0 0 1px rgba(56,189,248,0.16)',
      display: 'grid',
      gap: 14,
      animation: 'portalLiftIn 420ms ease both'
    },
    panelTitle: {
      margin: '0 0 8px',
      fontSize: 24,
      color: '#f8fafc'
    },
    panelCopy: {
      margin: '0 0 16px',
      color: 'rgba(203,213,225,0.72)',
      lineHeight: 1.6
    },
    stacked: {
      display: 'grid',
      gap: 12
    },
    listCard: {
      border: '1px solid transparent',
      borderRadius: 26,
      padding: 18,
      background:
        variant === 'recruiter'
          ? 'linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(10,15,26,0.88) 100%), linear-gradient(125deg, rgba(249,115,22,0.28) 0%, rgba(56,189,248,0.2) 100%) border-box'
          : 'linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(10,15,26,0.88) 100%), linear-gradient(125deg, rgba(56,189,248,0.24) 0%, rgba(249,115,22,0.18) 100%) border-box',
      backgroundClip: 'padding-box, border-box',
      backgroundOrigin: 'padding-box, border-box',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 14px 34px rgba(2,6,23,0.38)',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease',
      animation: 'portalLiftIn 460ms ease both'
    },
    listTitle: {
      display: 'block',
      fontSize: 16,
      marginBottom: 6,
      color: '#f8fafc'
    },
    listMeta: {
      fontSize: 13,
      color: 'rgba(203,213,225,0.72)',
      lineHeight: 1.5
    },
    assessmentCard: {
      border: '1px solid transparent',
      borderRadius: 20,
      padding: 14,
      background:
        variant === 'recruiter'
          ? 'linear-gradient(160deg, rgba(15,23,42,0.84) 0%, rgba(30,41,59,0.92) 100%), linear-gradient(135deg, rgba(251,146,60,0.35) 0%, rgba(56,189,248,0.2) 100%) border-box'
          : 'linear-gradient(160deg, rgba(15,23,42,0.84) 0%, rgba(30,41,59,0.92) 100%), linear-gradient(135deg, rgba(56,189,248,0.3) 0%, rgba(251,146,60,0.2) 100%) border-box',
      backgroundClip: 'padding-box, border-box',
      backgroundOrigin: 'padding-box, border-box',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease',
      animation: 'portalLiftIn 420ms ease both'
    },
    assessmentTitle: {
      display: 'block',
      fontSize: 16,
      marginBottom: 6,
      color: '#f8fafc'
    },
    assessmentMeta: {
      fontSize: 13,
      color: 'rgba(226,232,240,0.82)',
      lineHeight: 1.5
    },
    challengeTags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10
    },
    challengeTag: {
      padding: '6px 10px',
      borderRadius: 999,
      background: 'rgba(37,99,235,0.16)',
      border: '1px solid rgba(96,165,250,0.22)',
      color: '#dbeafe',
      fontSize: 12
    },
    selectedBox: {
      marginTop: 16,
      borderRadius: 20,
      background: 'linear-gradient(150deg, rgba(10,20,38,0.86) 0%, rgba(14,37,70,0.58) 100%)',
      border: '1px solid rgba(96,165,250,0.34)',
      padding: 16
    },
    selectedTitle: {
      margin: '0 0 8px',
      fontSize: 16,
      color: '#f8fafc'
    },
    formLabel: {
      display: 'block',
      fontSize: 13,
      fontWeight: 700,
      color: '#cbd5e1',
      marginBottom: 0
    },
    formGrid: {
      display: 'grid',
      gap: 12
    },
    input: {
      width: '100%',
      boxSizing: 'border-box',
      border: '1px solid rgba(148,163,184,0.28)',
      borderRadius: 20,
      padding: 12,
      fontSize: 14,
      background: 'rgba(7,20,34,0.92)',
      color: '#eff6ff',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -10px 16px rgba(2,6,23,0.45)',
      transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease'
    },
    selectInput: {
      width: '100%',
      boxSizing: 'border-box',
      border: '1px solid rgba(148,163,184,0.28)',
      borderRadius: 20,
      padding: '12px 42px 12px 14px',
      fontSize: 14,
      backgroundColor: 'rgba(7,20,34,0.94)',
      backgroundImage:
        'linear-gradient(45deg, transparent 50%, #fdba74 50%), linear-gradient(135deg, #fdba74 50%, transparent 50%), linear-gradient(to right, rgba(148,163,184,0.2), rgba(148,163,184,0.2))',
      backgroundPosition: 'calc(100% - 18px) 19px, calc(100% - 12px) 19px, calc(100% - 34px) 50%',
      backgroundSize: '6px 6px, 6px 6px, 1px 60%',
      backgroundRepeat: 'no-repeat',
      color: '#eff6ff',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -10px 16px rgba(2,6,23,0.45)',
      transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
      appearance: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      cursor: 'pointer'
    },
    textarea: {
      width: '100%',
      boxSizing: 'border-box',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 18,
      padding: 12,
      fontSize: 14,
      background: 'rgba(2,6,23,0.84)',
      color: '#eff6ff',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      resize: 'vertical',
      transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease'
    },
    actionRow: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      marginTop: 16
    },
    sectionSwitchRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 14
    },
    sectionSwitchButton: {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'rgba(148,163,184,0.24)',
      borderRadius: 18,
      padding: '10px 14px',
      background: 'rgba(4,10,21,0.78)',
      color: '#e2e8f0',
      fontWeight: 700,
      letterSpacing: '0.02em',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease'
    },
    sectionSwitchButtonText: {
      display: 'inline-flex',
      alignItems: 'center'
    },
    sectionSwitchBadge: {
      display: 'inline-grid',
      placeItems: 'center',
      minWidth: 22,
      height: 22,
      padding: '0 7px',
      borderRadius: 999,
      background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
      color: '#fff',
      fontSize: 12,
      fontWeight: 800,
      lineHeight: 1,
      boxShadow: '0 8px 18px rgba(239,68,68,0.28)'
    },
    sectionSwitchButtonActive: {
      borderColor: 'rgba(56,189,248,0.85)',
      background:
        variant === 'recruiter'
          ? 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(56,189,248,0.2) 100%)'
          : 'linear-gradient(135deg, rgba(56,189,248,0.22) 0%, rgba(249,115,22,0.16) 100%)',
      boxShadow: '0 12px 28px rgba(15,23,42,0.38)'
    },
    primaryButton: {
      border: 'none',
      borderRadius: 18,
      padding: '12px 16px',
      background: theme.primaryButtonBg,
      color: '#fff',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: `0 16px 35px ${theme.primaryGlow}`,
      transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease, opacity 180ms ease'
    },
    secondaryButton: {
      border: '1px solid rgba(173,228,255,0.24)',
      borderRadius: 20,
      padding: '12px 16px',
      background: 'linear-gradient(145deg, rgba(10,30,50,0.9) 0%, rgba(6,16,28,0.9) 100%)',
      color: '#e2e8f0',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: `0 16px 32px ${theme.secondaryGlow}`,
      transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease, opacity 180ms ease'
    },
    disabledButton: {
      opacity: 0.6,
      cursor: 'not-allowed'
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
      background: 'rgba(249,115,22,0.12)',
      border: '1px solid rgba(251,146,60,0.22)',
      color: '#ffedd5',
      fontSize: 12
    },
    feedbackPanel: {
      marginTop: 16,
      borderRadius: 16,
      padding: 16,
      background: theme.feedbackBg,
      border: '1px solid ' + theme.feedbackBorder
    },
    feedbackLabel: {
      margin: 0,
      fontSize: 12,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#0369a1'
    },
    feedbackText: {
      margin: '8px 0 0',
      color: '#e5eefc',
      lineHeight: 1.7
    },
    resultPanel: {
      marginTop: 16,
      borderRadius: 20,
      padding: 16,
      background: 'linear-gradient(160deg, rgba(10,20,38,0.84) 0%, rgba(4,10,21,0.92) 100%)',
      border: '1px solid rgba(96,165,250,0.32)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 32px rgba(2,6,23,0.34)'
    },
    resultTitle: {
      margin: 0,
      fontSize: 16,
      color: '#f8fafc'
    },
    resultBody: {
      marginTop: 10,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      background: '#111827',
      color: '#e5e7eb',
      padding: 14,
      borderRadius: 12,
      overflowX: 'auto'
    },
    emptyState: {
      padding: 14,
      borderRadius: 18,
      background: 'rgba(255,255,255,0.04)',
      border: '1px dashed rgba(255,255,255,0.14)',
      color: 'rgba(203,213,225,0.7)'
    },
    errorText: {
      marginTop: 16,
      color: '#b91c1c',
      fontWeight: 700
    },
    subPanel: {
      marginTop: 16,
      borderRadius: 26,
      background:
        variant === 'recruiter'
          ? 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(15,23,42,0.66) 100%), linear-gradient(135deg, rgba(249,115,22,0.25) 0%, rgba(56,189,248,0.18) 100%) border-box'
          : 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(15,23,42,0.66) 100%), linear-gradient(135deg, rgba(56,189,248,0.24) 0%, rgba(249,115,22,0.18) 100%) border-box',
      border: '1px solid transparent',
      backgroundClip: 'padding-box, border-box',
      backgroundOrigin: 'padding-box, border-box',
      padding: 18,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 36px rgba(2,6,23,0.32)'
    },
    subPanelTitle: {
      margin: '0 0 8px',
      fontSize: 18,
      color: '#f8fafc'
    }
  };
};

export { createPortalStyles };