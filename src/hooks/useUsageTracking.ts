// src/hooks/useUsageTracking.ts
'use client'
import { useEffect, useRef } from 'react'

export function useUsageTracking(screenName: string) {
  const enterTime = useRef<number>(Date.now())

  useEffect(() => {
    fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'SCREEN_VIEW', screen: screenName }),
    }).catch(() => {})

    enterTime.current = Date.now()

    return () => {
      const duration = Math.round((Date.now() - enterTime.current) / 1000)
      if (duration > 1) {
        fetch('/api/usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'SESSION_END',
            screen: screenName,
            session_duration_seconds: duration,
          }),
        }).catch(() => {})
      }
    }
  }, [screenName])
}

export function trackLogin() {
  fetch('/api/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'LOGIN' }),
  }).catch(() => {})
}
