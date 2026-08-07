'use client'

import { useEffect } from 'react'

type Tone = 'incoming' | 'outgoing' | null

export function useCallTone(tone: Tone) {
  useEffect(() => {
    if (!tone || typeof window === 'undefined') return

    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const context = new AudioContextClass()
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
      context.close().catch(() => undefined)
    }
  }, [tone])
}
