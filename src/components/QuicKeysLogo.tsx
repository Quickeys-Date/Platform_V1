// src/components/QuicKeysLogo.tsx
// Matches brand guide: teal glossy heart + gold ornate key diagonal

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showWordmark?: boolean
  showTagline?: boolean
}

export function QuicKeysLogo({ size = 'md', showWordmark = true, showTagline = false }: LogoProps) {
  const iconSize = { sm: 40, md: 60, lg: 88, xl: 120 }[size]
  const wordSize = { sm: 22, md: 32, lg: 44, xl: 58 }[size]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Teal heart gradient — glossy enamel effect */}
          <radialGradient id="heartFill" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#0FB7BF" />
            <stop offset="35%" stopColor="#0A6469" />
            <stop offset="75%" stopColor="#043538" />
            <stop offset="100%" stopColor="#021415" />
          </radialGradient>
          {/* Heart highlight (glass shine) */}
          <radialGradient id="heartShine" cx="35%" cy="25%" r="50%">
            <stop offset="0%" stopColor="#66F6FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#66F6FF" stopOpacity="0" />
          </radialGradient>
          {/* Gold key gradient */}
          <linearGradient id="goldKey" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE7B1" />
            <stop offset="30%" stopColor="#FFC766" />
            <stop offset="65%" stopColor="#D99B34" />
            <stop offset="100%" stopColor="#8A5A12" />
          </linearGradient>
          {/* Gold shine */}
          <linearGradient id="goldShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          {/* Outer glow filter */}
          <filter id="tealGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.06  0 0 0 0 0.71  0 0 0 0 0.75  0 0 0 0.6 0" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 1  0 0 0 0 0.78  0 0 0 0 0.4  0 0 0 0.5 0" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Outer dark circle bg */}
        <circle cx="100" cy="100" r="96" fill="#061B1E" />
        <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(15,183,191,0.2)" strokeWidth="1.5" />

        {/* Heart — filled glossy teal */}
        <path
          d="M100 162 C100 162 30 122 30 72 C30 50 47 34 66 34 C78 34 89 40 100 52 C111 40 122 34 134 34 C153 34 170 50 170 72 C170 122 100 162 100 162Z"
          fill="url(#heartFill)"
          filter="url(#tealGlow)"
        />
        {/* Heart outline */}
        <path
          d="M100 162 C100 162 30 122 30 72 C30 50 47 34 66 34 C78 34 89 40 100 52 C111 40 122 34 134 34 C153 34 170 50 170 72 C170 122 100 162 100 162Z"
          fill="none"
          stroke="#0FB7BF"
          strokeWidth="2.5"
        />
        {/* Heart glass shine */}
        <path
          d="M100 162 C100 162 30 122 30 72 C30 50 47 34 66 34 C78 34 89 40 100 52 C111 40 122 34 134 34 C153 34 170 50 170 72 C170 122 100 162 100 162Z"
          fill="url(#heartShine)"
        />

        {/* Gold ornate key — diagonal, bottom-left to upper-right */}
        <g transform="translate(100,100) rotate(-38) translate(-100,-100)" filter="url(#goldGlow)">
          {/* Key ring circle */}
          <circle cx="72" cy="76" r="20" fill="none" stroke="url(#goldKey)" strokeWidth="6" />
          {/* Key ring inner hole */}
          <circle cx="72" cy="76" r="11" fill="#043538" />
          {/* Key ring specular */}
          <circle cx="66" cy="70" r="5" fill="url(#goldShine)" opacity="0.6" />

          {/* Key shaft */}
          <rect x="89" y="71" width="52" height="9" rx="4.5" fill="url(#goldKey)" />
          {/* Shaft shine */}
          <rect x="89" y="71" width="52" height="4" rx="2" fill="url(#goldShine)" opacity="0.4" />

          {/* Key teeth (3) */}
          <rect x="108" y="80" width="6" height="13" rx="3" fill="url(#goldKey)" />
          <rect x="120" y="80" width="6" height="10" rx="3" fill="url(#goldKey)" />
          <rect x="132" y="80" width="6" height="15" rx="3" fill="url(#goldKey)" />

          {/* Ornamental clover at base of key ring */}
          <circle cx="60" cy="92" r="6" fill="none" stroke="url(#goldKey)" strokeWidth="3.5" />
          <circle cx="72" cy="100" r="6" fill="none" stroke="url(#goldKey)" strokeWidth="3.5" />
          <circle cx="84" cy="92" r="6" fill="none" stroke="url(#goldKey)" strokeWidth="3.5" />
          <circle cx="72" cy="84" r="6" fill="none" stroke="url(#goldKey)" strokeWidth="3.5" />
        </g>
      </svg>

      {showWordmark && (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontSize: wordSize,
            fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            background: 'linear-gradient(135deg, #FFE7B1 0%, #FFC766 40%, #D99B34 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.01em',
            display: 'block',
            lineHeight: 1.1,
          }}>
            QuicKeys
          </span>
          {showTagline && (
            <span style={{
              display: 'block',
              fontSize: Math.max(10, wordSize * 0.27),
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: 6,
              fontWeight: 500,
            }}>
              A dating app that goes beyond dating
            </span>
          )}
        </div>
      )}
    </div>
  )
}
