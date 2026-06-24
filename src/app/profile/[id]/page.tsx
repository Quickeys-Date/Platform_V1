'use client'
// src/app/profile/[id]/page.tsx — S-10 Connection Profile
// All photos swipeable (up to 3). Full bio, connection prompt, start conversation, report user.
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import toast from 'react-hot-toast'

export default function ConnectionProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  useEffect(() => {
    supabase.from('profiles')
      .select('*')
      .eq('id', id)
      .neq('status', 'DEACTIVATED')
      .single()
      .then(({ data, error }) => {
        if (error || !data) { router.push('/feed'); return }
        setProfile(data)
        // Generate signed URLs for all photos — not public URLs per security spec
        const urls: string[] = []
        Promise.all(
          (data.photos || []).map(async (path: string) => {
            const { data: signed } = await supabase.storage
              .from('photos')
              .createSignedUrl(path, 3600)
            return signed?.signedUrl || ''
          })
        ).then(resolved => setPhotoUrls(resolved.filter(Boolean)))
        setLoading(false)
      })
  }, [id, router, supabase])

  const startConversation = async () => {
    setStarting(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: id }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error('Could not start conversation'); setStarting(false); return }
    router.push(`/chat/${data.conversation.id}`)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!profile) return null

  const photos = photoUrls.length > 0 ? photoUrls : ['']
  const hasMultiple = photos.length > 1

  return (
    <div className="flex flex-col min-h-svh">
      {/* Swipeable photo hero */}
      <div className="relative w-full flex-shrink-0" style={{ maxHeight: '60svh', aspectRatio: '3/4' }}>
        {photos[photoIndex] ? (
          <img src={photos[photoIndex]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-6xl">👤</div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Nav buttons */}
        <button onClick={() => router.back()}
          className="absolute top-12 left-4 w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ background: 'rgba(0,0,0,0.4)' }}>←</button>
        <button onClick={() => router.push(`/report?reported_id=${id}&source=Connection+Profile`)}
          className="absolute top-12 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ background: 'rgba(0,0,0,0.4)' }}>⚑</button>

        {/* Swipe arrows — only if multiple photos */}
        {hasMultiple && photoIndex > 0 && (
          <button onClick={() => setPhotoIndex(i => i - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(0,0,0,0.4)' }}>‹</button>
        )}
        {hasMultiple && photoIndex < photos.length - 1 && (
          <button onClick={() => setPhotoIndex(i => i + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(0,0,0,0.4)' }}>›</button>
        )}

        {/* Photo dots indicator */}
        {hasMultiple && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setPhotoIndex(i)}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === photoIndex ? 'white' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl font-black text-white tracking-tight">{profile.first_name}, {profile.age}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>{profile.city}, {profile.state}</p>
        </div>
      </div>

      {/* Info — full 250 char bio per spec */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {profile.bio && (
          <div className="mb-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</h2>
            <p className="text-gray-900 leading-relaxed">{profile.bio}</p>
          </div>
        )}
        {profile.connection_prompt && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">What matters most to them in a connection</h2>
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-gray-600 italic leading-relaxed">"{profile.connection_prompt}"</p>
            </div>
          </div>
        )}
        {/* S-10 actions */}
        <button disabled={starting} onClick={startConversation}
          className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base disabled:opacity-40 mb-3">
          {starting ? 'Starting…' : 'Start Conversation'}
        </button>
        <button onClick={() => router.push(`/report?reported_id=${id}&source=Connection+Profile`)}
          className="w-full py-3 text-sm font-medium text-gray-400 border border-gray-200 rounded-xl hover:border-gray-300">
          Report User
        </button>
      </div>
    </div>
  )
}
