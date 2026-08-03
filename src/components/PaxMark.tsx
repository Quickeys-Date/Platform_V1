import Image from 'next/image'
import type { CSSProperties } from 'react'

interface PaxMarkProps {
  className?: string
  style?: CSSProperties
  starSize?: number
}

/** Official Pax label with the supplied star artwork. */
export function PaxMark({ className, style, starSize = 28 }: PaxMarkProps) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        width: 'fit-content',
        color: '#FFC766',
        fontSize: 18,
        fontWeight: 900,
        lineHeight: 1,
        ...style,
      }}
    >
      <span>Pax™</span>
      <Image
        src="/pax-star-whiter.png"
        alt=""
        aria-hidden="true"
        width={starSize}
        height={starSize}
        style={{ width: starSize, height: starSize, objectFit: 'contain', flexShrink: 0 }}
      />
    </div>
  )
}
