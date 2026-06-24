// src/hooks/useUsageTracking.ts
// Tracks login timestamps, screen views, session duration per spec
'use client'
import { useEffect, useRef } from 'react'

export function useUsageTracking(screenName: string) {
  const enterTime = useRef<number>(Date.now())

  useEffect(() => {
    // Track screen view
    fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'SCREEN_VIEW', screen: screenName }),
    }).catch(() => {}) // fire and forget

    enterTime.current = Date.now()

    // Track session duration on unmount
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
