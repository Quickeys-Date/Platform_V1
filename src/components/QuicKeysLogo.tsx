// src/components/QuicKeysLogo.tsx
// QuicKeys brand logo — matches the provided brand mockup
// Teal heart (outline style) + gold key + gold serif wordmark

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showWordmark?: boolean
  showTagline?: boolean
}

export function QuicKeysLogo({ size = 'md', showWordmark = true, showTagline = false }: LogoProps) {
  const iconSize = { sm: 36, md: 56, lg: 80, xl: 110 }[size]
  const wordSize = { sm: 22, md: 30, lg: 42, xl: 54 }[size]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Icon */}
      <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="tealGrad" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#0FB7BF" />
            <stop offset="100%" stopColor="#043538" />
          </radialGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE7B1" />
            <stop offset="40%" stopColor="#FFC766" />
            <stop offset="100%" stopColor="#D99B34" />
          </linearGradient>
          <filter id="glowTeal" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Outer circle glow */}
        <circle cx="50" cy="50" r="46" fill="rgba(13,158,166,0.08)" stroke="rgba(15,183,191,0.25)" strokeWidth="1"/>

        {/* Teal heart — filled with gradient */}
        <path
          d="M50 78 C50 78 16 58 16 36 C16 24 25 16 35 16 C42 16 48 20 50 25 C52 20 58 16 65 16 C75 16 84 24 84 36 C84 58 50 78 50 78Z"
          fill="url(#tealGrad)"
          stroke="#0FB7BF"
          strokeWidth="2"
          filter="url(#glowTeal)"
        />

        {/* Inner heart highlight */}
        <path
          d="M50 36 C50 36 34 28 34 36 C34 30 40 25 47 28 C48.5 28.8 50 31 50 33 C50 31 51.5 28.8 53 28 C60 25 66 30 66 36 C66 28 50 36 50 36Z"
          fill="rgba(102,246,255,0.18)"
        />

        {/* Gold key — diagonal across heart */}
        <g transform="translate(50,50) rotate(-40) translate(-50,-50)" filter="url(#glowGold)">
          {/* Key ring */}
          <circle cx="38" cy="40" r="10" fill="none" stroke="url(#goldGrad)" strokeWidth="3.5"/>
          <circle cx="38" cy="40" r="5" fill="url(#goldGrad)" opacity="0.4"/>

          {/* Key shaft */}
          <rect x="46" y="37.5" width="28" height="5" rx="2.5" fill="url(#goldGrad)"/>

          {/* Key teeth */}
          <rect x="60" y="42.5" width="3.5" height="7" rx="1.5" fill="url(#goldGrad)"/>
          <rect x="67" y="42.5" width="3.5" height="5.5" rx="1.5" fill="url(#goldGrad)"/>
          <rect x="72" y="42.5" width="3.5" height="8" rx="1.5" fill="url(#goldGrad)"/>

          {/* Ornamental clover at bottom of key ring */}
          <circle cx="32" cy="52" r="3" fill="none" stroke="url(#goldGrad)" strokeWidth="2"/>
          <circle cx="38" cy="56" r="3" fill="none" stroke="url(#goldGrad)" strokeWidth="2"/>
          <circle cx="44" cy="52" r="3" fill="none" stroke="url(#goldGrad)" strokeWidth="2"/>
          <circle cx="38" cy="48" r="3" fill="none" stroke="url(#goldGrad)" strokeWidth="2"/>
        </g>
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: wordSize,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            background: 'linear-gradient(135deg, #FFE7B1 0%, #FFC766 45%, #D99B34 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            QuicKeys
          </div>
          {showTagline && (
            <div style={{
              fontSize: wordSize * 0.28,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: 6,
              fontWeight: 500,
            }}>
              A dating app that goes beyond dating
            </div>
          )}
        </div>
      )}
    </div>
  )
}
