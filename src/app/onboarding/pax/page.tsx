'use client'
// src/app/onboarding/pax/page.tsx
// S-05 Welcome, S-06 Meet Pax Intro, S-07 Mini Example, S-08 Pax Responds
// CR#7: Back buttons added to S-06, S-07, S-08 (founder approved deviation from original spec)
// CR#8: "Tell Me More" button added to S-08 alongside "I Understand"
// CR#9: Option A and Option B on S-07 produce different Pax responses
//        *** PLACEHOLDER RESPONSES — Ofelia to provide final content for both paths ***
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// S-08 hardcoded copy — PAX_INTRO_ORIENTATION
// CR#9: Two separate responses based on S-07 selection
const PAX_RESPONSE_A = `When we're disappointed, it's easy to make ourselves the explanation.\n\nSometimes the most useful first step is recognizing there may not be enough information yet to draw a conclusion.`

// PLACEHOLDER — Option B response — Ofelia to provide final content
const PAX_RESPONSE_B = `Sometimes the most honest thing we can do is stay curious.\n\nWhen something feels unclear, it often means we're missing context — not that something is wrong with us or with them.`

// Tell Me More content for S-08 (CR#8)
// PLACEHOLDER — Ofelia to provide final content
const PAX_TELL_ME_MORE = `Patterns in how we interpret silence, distance, or slow responses often form early — and they can shape the way we read situations before we have all the facts.\n\nPax is here to help you notice those patterns, not to tell you what they mean.`

type Step = 'welcome' | 'intro' | 'example' | 'responds' | 'tellmemore'

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
    window.location.href = '/feed'
  }

  // S-05 Welcome
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

  // S-06 Meet Pax Introduction — CR#7: back button added
  if (step === 'intro') return (
    <div className="pax-screen animate-fade-up">
      {/* CR#7: Back button */}
      <button onClick={() => setStep('welcome')} className="self-start mb-4 text-white/60 text-sm">← Back</button>
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

  // S-07 Mini Example — CR#7: back button, CR#9: different responses per selection
  if (step === 'example') return (
    <div className="pax-screen animate-fade-up">
      {/* CR#7: Back button */}
      <button onClick={() => setStep('intro')} className="self-start mb-4 text-white/60 text-sm">← Back</button>
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

  // S-08 Pax Responds — CR#7: back, CR#8: Tell Me More button, CR#9: different response per selection
  if (step === 'responds') return (
    <div className="pax-screen animate-fade-up">
      {/* CR#7: Back button */}
      <button onClick={() => setStep('example')} className="self-start mb-4 text-white/60 text-sm">← Back</button>
      <div className="font-black text-lg mb-6" style={{ color: '#C9A84C' }}>Pax™</div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="rounded-xl p-6"
          style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
          {/* CR#9: Different response based on selection */}
          {(selected === 'A' ? PAX_RESPONSE_A : PAX_RESPONSE_B).split('\n\n').map((para, i) => (
            <p key={i} className={`text-lg leading-relaxed tracking-tight text-white ${i > 0 ? 'mt-4' : ''}`}>
              {para}
            </p>
          ))}
        </div>
      </div>
      {/* CR#8: Both buttons — Tell Me More + I Understand */}
      <div className="mt-8 space-y-3">
        <button onClick={() => setStep('tellmemore')}
          className="w-full bg-white/15 text-white py-4 rounded-xl font-semibold text-base border border-white/20">
          Tell Me More
        </button>
        <button onClick={finish}
          className="w-full bg-white text-black py-4 rounded-xl font-semibold text-base">
          I Understand
        </button>
      </div>
    </div>
  )

  // CR#8: Tell Me More screen
  if (step === 'tellmemore') return (
    <div className="pax-screen animate-fade-up">
      <button onClick={() => setStep('responds')} className="self-start mb-4 text-white/60 text-sm">← Back</button>
      <div className="font-black text-lg mb-6" style={{ color: '#C9A84C' }}>Pax™</div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="rounded-xl p-6"
          style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
          {PAX_TELL_ME_MORE.split('\n\n').map((para, i) => (
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
