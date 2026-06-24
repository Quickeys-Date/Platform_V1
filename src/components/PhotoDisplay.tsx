// src/components/PhotoDisplay.tsx
// Uses signed URLs — photos are NOT publicly accessible per security spec
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  photos: string[]
  size?: number
  className?: string
  fill?: boolean
}

export function PhotoDisplay({ photos, size = 44, className = '', fill = false }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!photos || photos.length === 0) return
    const supabase = createClient()
    supabase.storage.from('photos').createSignedUrl(photos[0], 3600)
      .then(({ data }) => { if (data?.signedUrl) setSignedUrl(data.signedUrl) })
  }, [photos])

  if (!photos || photos.length === 0 || !signedUrl) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center text-gray-400 font-semibold flex-shrink-0 ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : { width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.4 }}>👤</span>
      </div>
    )
  }

  if (fill) {
    return (
      <img
        src={signedUrl}
        alt=""
        className={`object-cover ${className}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    )
  }

  return (
    <div className={`relative overflow-hidden flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img src={signedUrl} alt="" className="w-full h-full object-cover" />
    </div>
  )
}
