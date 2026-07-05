// src/components/QuicKeysLogo.tsx
// Uses the actual brand artwork (public/quickeys-icon.png) for pixel-perfect accuracy
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showWordmark?: boolean
  showTagline?: boolean
}

export function QuicKeysLogo({ size = 'md', showWordmark = true, showTagline = false }: LogoProps) {
  const iconSize = { sm: 44, md: 68, lg: 96, xl: 130 }[size]
  const wordSize = { sm: 22, md: 32, lg: 46, xl: 60 }[size]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: iconSize, height: iconSize, borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
        <Image
          src="/quickeys-icon.png"
          alt="QuicKeys"
          width={iconSize}
          height={iconSize}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          priority
        />
      </div>

      {showWordmark && (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontSize: wordSize,
            fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            background: 'linear-gradient(135deg, #FFE7B1 0%, #FFC766 35%, #D99B34 65%, #FFC766 85%, #FFE7B1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.01em',
            display: 'block',
            lineHeight: 1.1,
          }}>
            QuicKeys™
          </span>
          {showTagline && (
            <span style={{
              display: 'block',
              fontSize: Math.max(9, wordSize * 0.25),
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginTop: 6,
              fontWeight: 400,
            }}>
              A dating app that goes beyond dating
            </span>
          )}
        </div>
      )}
    </div>
  )
}
