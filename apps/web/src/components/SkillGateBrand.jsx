const sizes = {
  hero: {
    frame: 84,
    emblem: 32,
    title: 40,
    subtitle: 13,
    gap: 18
  },
  section: {
    frame: 62,
    emblem: 24,
    title: 28,
    subtitle: 12,
    gap: 14
  },
  compact: {
    frame: 44,
    emblem: 16,
    title: 18,
    subtitle: 11,
    gap: 10
  }
};

const SkillGateBrand = ({ size = 'section', subtitle = 'AI-powered hiring intelligence' }) => {
  const scale = sizes[size] || sizes.section;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: scale.gap }}>
      <div
        className="skillgate-mark"
        style={{
          width: scale.frame,
          height: scale.frame,
          borderRadius: 24,
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(150deg, rgba(255,255,255,0.16) 0%, rgba(11,20,38,0.9) 46%, rgba(5,13,26,1) 100%)',
          border: '1px solid rgba(148,163,184,0.24)',
          boxShadow:
            '0 28px 54px rgba(2, 6, 23, 0.42), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -12px 20px rgba(15, 23, 42, 0.52)'
        }}
      >
        <div
          className="skillgate-glow"
          style={{
            position: 'absolute',
            inset: '12% 12% auto auto',
            width: '52%',
            height: '52%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,146,60,0.95) 0%, rgba(251,146,60,0.08) 72%, transparent 100%)',
            filter: 'blur(6px)',
            opacity: 0.9
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: '18% 18%',
            borderRadius: 18,
            background:
              'linear-gradient(160deg, rgba(15,23,42,0.35), rgba(255,255,255,0.08))',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)'
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: scale.emblem * 1.95,
              height: scale.emblem * 1.6
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: scale.emblem,
                border: '2px solid rgba(255,255,255,0.22)',
                boxShadow: 'inset 0 0 0 1px rgba(251,146,60,0.35)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '18%',
                top: '14%',
                width: scale.emblem * 0.22,
                height: scale.emblem * 1.1,
                borderRadius: 999,
                background: 'linear-gradient(180deg, #fff 0%, #cbd5e1 100%)',
                boxShadow: '0 0 22px rgba(255,255,255,0.22)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '18%',
                top: '14%',
                width: scale.emblem * 0.22,
                height: scale.emblem * 1.1,
                borderRadius: 999,
                background: 'linear-gradient(180deg, #fb923c 0%, #ea580c 100%)',
                boxShadow: '0 0 24px rgba(251,146,60,0.45)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '34%',
                top: '40%',
                width: scale.emblem * 0.7,
                height: scale.emblem * 0.18,
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.88), rgba(251,146,60,0.9))',
                boxShadow: '0 0 18px rgba(251,146,60,0.24)'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 4 }}>
        <div
          style={{
            fontSize: scale.title,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.05em',
            color: '#f8fafc',
            textShadow: '0 10px 22px rgba(0, 0, 0, 0.3)'
          }}
        >
          <span style={{ color: '#f8fafc' }}>Skill</span>
          <span
            style={{
              marginLeft: 2,
              background: 'linear-gradient(135deg, #fb923c 0%, #fdba74 42%, #fff 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            Gate
          </span>
        </div>

        <div
          style={{
            fontSize: scale.subtitle,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: 'rgba(226, 232, 240, 0.76)'
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
};

export default SkillGateBrand;