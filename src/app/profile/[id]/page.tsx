'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import toast from 'react-hot-toast'

function getAge(dob: string | null | undefined): string {
  if (!dob) return ''
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600000))
  return age > 0 ? `, ${age}` : ''
}

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
    supabase.from('profiles').select('*').eq('id', id).neq('status', 'DEACTIVATED').single()
      .then(({ data, error }) => {
        if (error || !data) { router.push('/feed'); return }
        setProfile(data)
        Promise.all(
          (data.photos || []).map(async (path: string) => {
            const { data: signed } = await supabase.storage.from('photos').createSignedUrl(path, 3600)
            return signed?.signedUrl || ''
          })
        ).then(urls => setPhotoUrls(urls.filter(Boolean)))
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
    window.location.href = `/chat/${data.conversation.id}`
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', background: '#0A0A0A' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #0FB7BF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (!profile) return null

  const photos = photoUrls
  const hasMultiple = photos.length > 1

  return (
    <div className="flex flex-col min-h-svh" style={{ background: '#0A0A0A' }}>
      {/* Photo hero */}
      <div style={{ position: 'relative', width: '100%', maxHeight: '60svh', aspectRatio: '3/4', flexShrink: 0 }}>
        {photos[photoIndex] ? (
          <img src={photos[photoIndex]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #043538, #0A0A0A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: 'rgba(255,255,255,0.2)' }}>👤</div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.3) 40%, transparent 70%)' }} />

        {/* Back button */}
        <button onClick={() => router.back()} style={{
          position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>←</button>

        {/* Report button */}
        <button onClick={() => window.location.href = `/report?reported_id=${id}&source=Connection+Profile`}
          style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚑</button>

        {/* Photo navigation */}
        {hasMultiple && photoIndex > 0 && (
          <button onClick={() => setPhotoIndex(i => i - 1)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        )}
        {hasMultiple && photoIndex < photos.length - 1 && (
          <button onClick={() => setPhotoIndex(i => i + 1)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        )}

        {/* Photo dots */}
        {hasMultiple && (
          <div style={{ position: 'absolute', bottom: 72, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {photos.map((_, i) => (
              <button key={i} onClick={() => setPhotoIndex(i)} style={{ width: 6, height: 6, borderRadius: '50%', background: i === photoIndex ? '#FFC766' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer' }} />
            ))}
          </div>
        )}

        {/* Name overlay */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {profile.first_name}{getAge(profile.date_of_birth)}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{profile.city}, {profile.state}</p>
        </div>
      </div>

      {/* Profile details */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
        {profile.bio && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>About</div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{profile.bio}</p>
          </div>
        )}
        {profile.connection_prompt && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>What matters most to them</div>
            <div style={{ background: 'rgba(15,183,191,0.08)', border: '1px solid rgba(15,183,191,0.2)', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.6 }}>"{profile.connection_prompt}"</p>
            </div>
          </div>
        )}

        <button disabled={starting} onClick={startConversation} style={{
          width: '100%', padding: 16, borderRadius: 14, marginBottom: 12,
          background: starting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #FFC766, #D99B34)',
          color: starting ? 'rgba(255,255,255,0.4)' : '#0A0A0A',
          fontWeight: 700, fontSize: 16, cursor: starting ? 'default' : 'pointer', border: 'none',
          boxShadow: starting ? 'none' : '0 4px 20px rgba(217,155,52,0.3)',
        }}>
          {starting ? 'Starting…' : 'Start Conversation'}
        </button>

        <button onClick={() => window.location.href = `/report?reported_id=${id}&source=Connection+Profile`}
          style={{ width: '100%', padding: 14, borderRadius: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer' }}>
          Report User
        </button>
      </div>
    </div>
  )
}
