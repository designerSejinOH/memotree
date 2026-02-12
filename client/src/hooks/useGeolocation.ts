'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type PermissionState = 'unknown' | 'granted' | 'prompt' | 'denied'
export type Loc = {
  lat: number
  lng: number
  accuracy?: number
  heading?: number | null
  speed?: number | null
  timestamp: number
}

export function useGeolocation() {
  const [permission, setPermission] = useState<PermissionState>('unknown')
  const [loc, setLoc] = useState<Loc | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // 초기 권한 상태 질의
  useEffect(() => {
    let mounted = true
    if ('permissions' in navigator && (navigator as any).permissions?.query) {
      ;(navigator as any).permissions
        .query({ name: 'geolocation' })
        .then((r: any) => mounted && setPermission(r.state as PermissionState))
        .catch(() => mounted && setPermission('unknown'))
    } else {
      setPermission('unknown')
    }
    return () => {
      mounted = false
    }
  }, [])

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 기능을 지원하지 않습니다.')
      return
    }
    setError(null)

    // 기본값: 고정밀 on, 3초 캐시 허용, 15초 타임아웃
    const opts: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000,
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords
        setLoc({
          lat: latitude,
          lng: longitude,
          accuracy,
          heading,
          speed,
          timestamp: pos.timestamp,
        })
        setPermission('granted')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermission('denied')
        setError(err.message || '위치 정보를 가져오지 못했어요.')
      },
      opts,
    )
  }, [])

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  return { permission, loc, error, startWatch, stopWatch }
}
