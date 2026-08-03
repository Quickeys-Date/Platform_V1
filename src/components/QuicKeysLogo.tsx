import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showWordmark?: boolean
  showTagline?: boolean
}

/** Official QuiKeys brand lockup supplied by the brand team. */
export function QuicKeysLogo({ size = 'md', showWordmark = true, showTagline = false }: LogoProps) {
  const iconSize = { sm: 44, md: 68, lg: 96, xl: 130 }[size]
  const wordmarkWidth = { sm: 118, md: 162, lg: 218, xl: 286 }[size]
  const wordmarkHeight = Math.round(wordmarkWidth / 4)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: iconSize, height: iconSize, position: 'relative', flexShrink: 0 }}>
        <Image
          src="/quikeys-logo.png"
          alt="QuiKeys heart and key logo"
          fill
          sizes={`${iconSize}px`}
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      {showWordmark && (
        <div style={{ textAlign: 'center', width: wordmarkWidth }}>
          <div style={{ width: wordmarkWidth, height: wordmarkHeight, overflow: 'hidden', position: 'relative' }}>
            <Image
              src="/quikeys-wordmark-tm.png"
              alt="QuiKeys™"
              fill
              sizes={`${wordmarkWidth}px`}
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          {showTagline && (
            <span style={{
              display: 'block',
              fontSize: Math.max(9, wordmarkWidth * 0.065),
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
