'use client'

import { useEffect } from 'react'

type Tone = 'incoming' | 'outgoing' | null

type AudioWindow = typeof window & { webkitAudioContext?: typeof AudioContext }

let sharedContext: AudioContext | null = null

function getAudioContext() {
  if (sharedContext && sharedContext.state !== 'closed') return sharedContext
  const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext
  if (!AudioContextClass) return null
  sharedContext = new AudioContextClass()
  return sharedContext
}

async function unlockAudio() {
  const context = getAudioContext()
  if (!context) return
  try {
    if (context.state === 'suspended') await context.resume()
    // A silent buffer marks this audio context as user-authorized in Chrome,
    // Safari and mobile browsers. Later incoming calls can then ring without
    // requiring another tap.
    const source = context.createBufferSource()
    source.buffer = context.createBuffer(1, 1, 22050)
    source.connect(context.destination)
    source.start(0)
  } catch {
    // Keep the listeners active so a later interaction can try again.
  }
}

export function useCallTone(tone: Tone) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const prime = () => { void unlockAudio() }
    window.addEventListener('pointerdown', prime, { passive: true })
    window.addEventListener('touchstart', prime, { passive: true })
    window.addEventListener('keydown', prime)
    return () => {
      window.removeEventListener('pointerdown', prime)
      window.removeEventListener('touchstart', prime)
      window.removeEventListener('keydown', prime)
    }
  }, [])

  useEffect(() => {
    if (!tone || typeof window === 'undefined') return
    const context = getAudioContext()
    if (!context) return
    let stopped = false
    const scheduledTimeouts: number[] = []

    const playNote = (frequency: number, delay: number, duration: number) => {
      const timeout = window.setTimeout(async () => {
        if (stopped) return
        try {
          if (context.state === 'suspended') await context.resume()
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          oscillator.type = 'sine'
          oscillator.frequency.value = frequency
          gain.gain.setValueAtTime(0.0001, context.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.025)
          gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
          oscillator.connect(gain)
          gain.connect(context.destination)
          oscillator.start()
          oscillator.stop(context.currentTime + duration + 0.03)
        } catch {
          // Some mobile browsers block sound until the next user interaction.
        }
      }, delay)
      scheduledTimeouts.push(timeout)
    }

    const ring = () => {
      if (tone === 'incoming') {
        playNote(659, 0, 0.34)
        playNote(784, 410, 0.42)
        navigator.vibrate?.([220, 120, 220])
      } else {
        playNote(440, 0, 0.24)
        playNote(554, 285, 0.24)
      }
    }

    ring()
    const interval = window.setInterval(ring, tone === 'incoming' ? 2400 : 1900)

    return () => {
      stopped = true
      window.clearInterval(interval)
      scheduledTimeouts.forEach(window.clearTimeout)
      navigator.vibrate?.(0)
    }
  }, [tone])
}
