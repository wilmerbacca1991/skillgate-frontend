import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%'
  },
  trigger: {
    width: '100%',
    minHeight: 56,
    boxSizing: 'border-box',
    border: '1px solid rgba(148,163,184,0.28)',
    borderRadius: 20,
    padding: '12px 14px',
    fontSize: 14,
    background: 'rgba(7,20,34,0.94)',
    color: '#eff6ff',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -10px 16px rgba(2,6,23,0.45)',
    transition: 'border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    textAlign: 'left'
  },
  triggerText: {
    minWidth: 0,
    flex: 1,
    display: 'grid',
    gap: 4
  },
  triggerLabel: {
    display: 'block',
    overflow: 'visible',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    lineHeight: 1.35
  },
  triggerMeta: {
    display: 'block',
    color: 'rgba(203,213,225,0.7)',
    fontSize: 12,
    lineHeight: 1.35,
    overflow: 'visible',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere'
  },
  caret: {
    flexShrink: 0,
    color: '#fdba74',
    fontSize: 14,
    lineHeight: 1
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    zIndex: 40,
    borderRadius: 18,
    border: '1px solid rgba(251,146,60,0.28)',
    background: 'linear-gradient(180deg, rgba(10,20,34,0.98) 0%, rgba(4,10,21,0.98) 100%)',
    boxShadow: '0 24px 60px rgba(2,6,23,0.55)',
    overflow: 'hidden',
    maxHeight: 320,
    display: 'grid'
  },
  menuScroll: {
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin'
  },
  option: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    padding: '14px 14px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'grid',
    gap: 6,
    borderBottom: '1px solid rgba(148,163,184,0.12)',
    transition: 'background-color 160ms ease, transform 160ms ease'
  },
  optionActive: {
    background: 'linear-gradient(90deg, rgba(251,146,60,0.14) 0%, rgba(37,210,197,0.12) 100%)'
  },
  optionLabelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minWidth: 0,
    flexWrap: 'wrap'
  },
  optionLabel: {
    color: '#f8fafc',
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.35,
    overflow: 'visible',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    flex: '1 1 220px'
  },
  optionMeta: {
    color: 'rgba(203,213,225,0.74)',
    fontSize: 12,
    lineHeight: 1.4,
    overflow: 'visible',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere'
  },
  optionBadge: {
    flexShrink: 0,
    padding: '4px 8px',
    borderRadius: 999,
    background: 'rgba(251,146,60,0.14)',
    border: '1px solid rgba(251,146,60,0.22)',
    color: '#fdba74',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  },
  optionSelectedMark: {
    color: '#9ef4ee',
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  }
};

const normalizeOption = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return { value: String(option), label: String(option) };
  }

  return {
    value: String(option.value),
    label: String(option.label ?? option.value),
    description: String(option.description ?? ''),
    badge: String(option.badge ?? '')
  };
};

const BrandedSelect = ({ value, options, onChange, placeholder = 'Select one', disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);

  const normalizedOptions = useMemo(() => (options || []).map(normalizeOption), [options]);
  const selectedOption = normalizedOptions.find((option) => option.value === String(value)) || null;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const updateMenuPosition = useCallback(() => {
    const rootElement = rootRef.current;
    if (!rootElement) {
      return;
    }

    const rect = rootElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(180, Math.min(360, openAbove ? spaceAbove : spaceBelow));

    setMenuStyle({
      position: 'fixed',
      left: Math.max(12, Math.min(rect.left, viewportWidth - rect.width - 12)),
      top: openAbove ? Math.max(12, rect.top - availableHeight - 8) : rect.bottom + 8,
      width: rect.width,
      zIndex: 9999,
      maxHeight: availableHeight
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleScroll = () => updateMenuPosition();
    const handleResize = () => updateMenuPosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, updateMenuPosition]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
    setMenuStyle(null);
  };

  const handleTriggerClick = () => {
    if (disabled) {
      return;
    }

    if (open) {
      setOpen(false);
      setMenuStyle(null);
      return;
    }

    updateMenuPosition();
    setOpen(true);
  };

  return (
    <div ref={rootRef} style={styles.wrapper}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleTriggerClick}
        style={{
          ...styles.trigger,
          ...(disabled ? { opacity: 0.68, cursor: 'not-allowed' } : null),
          ...(open
            ? {
                borderColor: 'rgba(251,146,60,0.55)',
                boxShadow:
                  '0 0 0 3px rgba(251,146,60,0.08), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -10px 16px rgba(2,6,23,0.45)'
              }
            : null)
        }}
      >
        <span style={styles.triggerText}>
          <span style={styles.triggerLabel}>{selectedOption?.label || placeholder}</span>
          {selectedOption?.description ? (
            <span style={styles.triggerMeta}>{selectedOption.description}</span>
          ) : null}
        </span>
        <span style={styles.caret}>v</span>
      </button>

      {open && menuStyle && typeof document !== 'undefined'
        ? createPortal(
            <div ref={menuRef} style={{ ...styles.menu, ...menuStyle }}>
              <div style={{ ...styles.menuScroll, maxHeight: menuStyle.maxHeight }}>
                {normalizedOptions.map((option) => {
                  const isSelected = option.value === String(value);

                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      style={{
                        ...styles.option,
                        ...(isSelected ? styles.optionActive : null)
                      }}
                    >
                      <span style={styles.optionLabelRow}>
                        <span style={styles.optionLabel}>{option.label}</span>
                        {option.badge ? <span style={styles.optionBadge}>{option.badge}</span> : null}
                      </span>
                      {option.description ? <span style={styles.optionMeta}>{option.description}</span> : null}
                      {isSelected ? <span style={styles.optionSelectedMark}>Selected</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default BrandedSelect;