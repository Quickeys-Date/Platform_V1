// src/components/QuicKeysLogo.tsx
// QuicKeys brand logo — heart + key icon + wordmark
// Colors from brand guide: Teal heart, Gold key

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showWordmark?: boolean
  showTagline?: boolean
}

const sizes = {
  sm: { icon: 40, wordmark: 20 },
  md: { icon: 64, wordmark: 28 },
  lg: { icon: 88, wordmark: 36 },
  xl: { icon: 120, wordmark: 48 },
}

export function QuicKeysLogo({ size = 'md', showWordmark = true, showTagline = false }: LogoProps) {
  const s = sizes[size]

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Icon — teal heart with gold key */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="heartGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#0FB7BF" />
            <stop offset="50%" stopColor="#0A6469" />
            <stop offset="100%" stopColor="#043538" />
          </radialGradient>
          <radialGradient id="keyGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFE7B1" />
            <stop offset="40%" stopColor="#FFC766" />
            <stop offset="100%" stopColor="#D99B34" />
          </radialGradient>
          <filter id="heartGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer teal glow ring */}
        <circle cx="60" cy="60" r="56" fill="none" stroke="#0D9EA6" strokeWidth="1" opacity="0.3" />

        {/* Heart shape */}
        <path
          d="M60 98 C60 98 18 72 18 42 C18 28 28 18 42 18 C50 18 57 22 60 28 C63 22 70 18 78 18 C92 18 102 28 102 42 C102 72 60 98 60 98Z"
          fill="url(#heartGrad)"
          filter="url(#heartGlow)"
          stroke="#0FB7BF"
          strokeWidth="1.5"
          opacity="0.95"
        />

        {/* Heart inner highlight */}
        <path
          d="M60 44 C60 44 38 32 38 42 C38 36 44 30 52 32 C55 33 58 36 60 40 C62 36 65 33 68 32 C76 30 82 36 82 42 C82 32 60 44 60 44Z"
          fill="rgba(102, 246, 255, 0.2)"
        />

        {/* Gold key */}
        <g transform="rotate(-35, 60, 60)" filter="url(#goldGlow)">
          {/* Key head (circle) */}
          <circle cx="52" cy="48" r="14" fill="url(#keyGrad)" stroke="#FFE7B1" strokeWidth="1" />
          <circle cx="52" cy="48" r="8" fill="#043538" />
          <circle cx="52" cy="48" r="5" fill="url(#keyGrad)" opacity="0.6" />

          {/* Key shaft */}
          <rect x="62" y="45" width="32" height="6" rx="3" fill="url(#keyGrad)" stroke="#FFE7B1" strokeWidth="0.5" />

          {/* Key teeth */}
          <rect x="76" y="51" width="4" height="8" rx="2" fill="url(#keyGrad)" />
          <rect x="84" y="51" width="4" height="6" rx="2" fill="url(#keyGrad)" />
          <rect x="90" y="51" width="4" height="9" rx="2" fill="url(#keyGrad)" />

          {/* Ornamental ring at bottom of key head */}
          <circle cx="42" cy="62" r="4" fill="none" stroke="url(#keyGrad)" strokeWidth="2" />
          <circle cx="52" cy="68" r="4" fill="none" stroke="url(#keyGrad)" strokeWidth="2" />
          <circle cx="47" cy="60" r="4" fill="none" stroke="url(#keyGrad)" strokeWidth="2" />
        </g>
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <div className="text-center">
          <div
            style={{
              fontSize: s.wordmark,
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              background: 'linear-gradient(135deg, #FFE7B1 0%, #FFC766 40%, #D99B34 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            QuicKeys
          </div>
          {showTagline && (
            <div
              style={{
                fontSize: s.wordmark * 0.32,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginTop: 4,
                fontWeight: 500,
              }}
            >
              A dating app that goes beyond dating
            </div>
          )}
        </div>
      )}
    </div>
  )
}
