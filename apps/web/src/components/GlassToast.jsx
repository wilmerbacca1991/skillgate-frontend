import { useEffect, useState } from 'react';

const baseStyle = {
  position: 'fixed',
  top: 18,
  right: 18,
  zIndex: 9999,
  maxWidth: 420,
  width: 'min(420px, calc(100vw - 36px))',
  borderRadius: 16,
  padding: '12px 14px',
  border: '1px solid rgba(74,222,128,0.52)',
  color: '#dcfce7',
  background: 'linear-gradient(150deg, rgba(7,34,28,0.96) 0%, rgba(9,20,39,0.92) 100%)',
  boxShadow: '0 20px 46px rgba(2,6,23,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
  backdropFilter: 'blur(18px)',
  transform: 'translateY(0)',
  transition: 'opacity 180ms ease, transform 180ms ease',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: 1.4
};

const errorStyle = {
  border: '1px solid rgba(248,113,113,0.52)',
  color: '#fee2e2',
  background: 'linear-gradient(150deg, rgba(56,19,28,0.96) 0%, rgba(9,20,39,0.94) 100%)'
};

const closeButtonStyle = {
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  fontSize: 16,
  lineHeight: 1,
  cursor: 'pointer',
  padding: 0,
  marginLeft: 12
};

const GlassToast = ({ notice, onClose, durationMs = 3800 }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!notice?.message || !onClose) {
      return undefined;
    }

    const resetFrame = window.requestAnimationFrame(() => {
      setIsClosing(false);
    });

    const timerId = window.setTimeout(() => {
      setIsClosing(true);
    }, durationMs);

    const closeId = window.setTimeout(() => {
      onClose();
    }, durationMs + 220);

    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.clearTimeout(timerId);
      window.clearTimeout(closeId);
    };
  }, [notice?.message, onClose, durationMs]);

  const handleDismiss = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      onClose();
    }, 180);
  };

  if (!notice?.message) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        ...baseStyle,
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? 'translateY(-8px) scale(0.98)' : 'translateY(0) scale(1)',
        ...(notice.type === 'error' ? errorStyle : null)
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span>{notice.message}</span>
        <button type="button" onClick={handleDismiss} aria-label="Dismiss notification" style={closeButtonStyle}>
          x
        </button>
      </div>
    </div>
  );
};

export default GlassToast;
