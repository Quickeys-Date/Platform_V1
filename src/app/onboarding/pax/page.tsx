'use client'
// src/app/onboarding/pax/page.tsx
// S-05 Welcome, S-06 Meet Pax Intro, S-07 Mini Example, S-08 Pax Responds
// All copy is LOCKED per spec.
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const PAX_INTRO_ORIENTATION_TEXT = `When we're disappointed, it's easy to make ourselves the explanation.\n\nSometimes the most useful first step is recognizing there may not be enough information yet to draw a conclusion.`

type Step = 'welcome' | 'intro' | 'example' | 'responds'

export default function PaxOnboardingPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [selected, setSelected] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('first_name').eq('id', user.id).single()
          .then(({ data }) => { if (data?.first_name) setFirstName(data.first_name) })
      }
    })
  }, []) // eslint-disable-line

  const finish = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ pax_onboarded: true }).eq('id', user.id)
    }
    // Use window.location.href so session cookie is sent with next request
    window.location.href = '/feed'
  }

  if (step === 'welcome') return (
    <div className="flex flex-col min-h-svh items-center justify-center px-8 text-center animate-fade-up">
      <div className="text-6xl mb-6">🗝️</div>
      <h1 className="text-[28px] font-black tracking-tight mb-3">
        Welcome to QuicKeys™, {firstName || 'there'}.
      </h1>
      <p className="text-gray-500 text-lg leading-relaxed mb-12">
        Before you meet anyone, we want to introduce you to Pax.
      </p>
      <button onClick={() => setStep('intro')}
        className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base">
        Meet Pax
      </button>
    </div>
  )

  if (step === 'intro') return (
    <div className="pax-screen animate-fade-up">
      <div className="font-black text-lg mb-8" style={{ color: '#C9A84C' }}>Pax™</div>
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xl font-medium leading-relaxed tracking-tight text-white">
          I'm Pax.<br /><br />
          Most dating apps help you find people.<br /><br />
          I help you think clearly about the people you meet.<br /><br />
          Sometimes a conversation feels exciting. Sometimes confusing. Sometimes disappointing.<br /><br />
          When that happens, I'm here to help you slow down, see things more clearly, and decide what matters next.
        </p>
      </div>
      <button onClick={() => setStep('example')}
        className="w-full bg-white text-black py-4 rounded-xl font-semibold text-base mt-8">
        Continue
      </button>
    </div>
  )

  if (step === 'example') return (
    <div className="pax-screen animate-fade-up">
      <div className="font-black text-lg mb-6" style={{ color: '#C9A84C' }}>Pax™</div>
      <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
        Here's an example of how Pax works.
      </p>
      <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Situation:</p>
      <p className="text-xl font-semibold leading-snug tracking-tight text-white mb-8">
        Someone you've enjoyed talking with suddenly stops responding.<br /><br />
        What is your first thought?
      </p>
      <div className="space-y-3 flex-1">
        {[
          { key: 'A', text: 'Something is wrong with me' },
          { key: 'B', text: 'Maybe something changed on their side' },
        ].map(opt => (
          <button key={opt.key} onClick={() => setSelected(opt.key)}
            className={`w-full text-left px-5 py-4 rounded-xl border-[1.5px] transition-all text-white font-medium text-sm
              ${selected === opt.key ? 'border-[#C9A84C] bg-white/15' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}>
            <span style={{ color: '#C9A84C', marginRight: 8, fontWeight: 700 }}>{opt.key}</span>
            {opt.text}
          </button>
        ))}
      </div>
      <button disabled={!selected} onClick={() => setStep('responds')}
        className={`w-full py-4 rounded-xl font-semibold text-base mt-6 transition-all
          ${selected ? 'bg-white text-black' : 'bg-white/20 text-white/40'}`}>
        Continue
      </button>
    </div>
  )

  if (step === 'responds') return (
    <div className="pax-screen animate-fade-up">
      <div className="font-black text-lg mb-6" style={{ color: '#C9A84C' }}>Pax™</div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="rounded-xl p-6"
          style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
          {PAX_INTRO_ORIENTATION_TEXT.split('\n\n').map((para, i) => (
            <p key={i} className={`text-lg leading-relaxed tracking-tight text-white ${i > 0 ? 'mt-4' : ''}`}>
              {para}
            </p>
          ))}
        </div>
      </div>
      <button onClick={finish}
        className="w-full bg-white text-black py-4 rounded-xl font-semibold text-base mt-8">
        I Understand
      </button>
    </div>
  )

  return null
}
