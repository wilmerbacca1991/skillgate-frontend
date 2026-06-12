import { useState } from 'react';

const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  button: {
    width: 18,
    height: 18,
    borderRadius: 999,
    border: '1px solid rgba(251,146,60,0.5)',
    background: 'rgba(251,146,60,0.15)',
    color: '#fdba74',
    fontSize: 12,
    fontWeight: 800,
    lineHeight: '16px',
    textAlign: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  tooltip: {
    position: 'absolute',
    top: '125%',
    right: 0,
    minWidth: 220,
    maxWidth: 300,
    zIndex: 20,
    borderRadius: 10,
    border: '1px solid rgba(251,146,60,0.3)',
    background: 'rgba(2,6,23,0.96)',
    color: '#e2e8f0',
    padding: '10px 12px',
    fontSize: 12,
    lineHeight: 1.5,
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  },
};

const FieldHelp = ({ text }) => {
  const [open, setOpen] = useState(false);

  return (
    <span style={styles.wrapper}>
      <button type="button" style={styles.button} onClick={() => setOpen((v) => !v)} aria-label="Field help">
        !
      </button>
      {open ? <span style={styles.tooltip}>{text}</span> : null}
    </span>
  );
};

export default FieldHelp;
