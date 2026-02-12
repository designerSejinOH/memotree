'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Loc } from '@/hooks/useGeolocation'
import { fetchSigunguByPoint } from '@/lib/api/sigungu'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; sigCd: string; geojson: GeoJSON.FeatureCollection }
  | { status: 'error'; error: string }

// VWorld 응답에서 FeatureCollection이 들어갈 수 있는 경로들을 최대한 흡수
function pickMaybeGeoJson(raw: any) {
  return (
    // vworld 2D Data API에서 흔한 형태
    raw?.response?.result?.featureCollection ??
    raw?.result?.featureCollection ??
    raw?.response?.result ??
    raw?.result ??
    // 혹시 바로 내려오는 형태
    raw?.featureCollection ??
    raw
  )
}

function toFeatureCollection(input: any): GeoJSON.FeatureCollection | null {
  if (!input) return null

  // 1) 이미 FeatureCollection
  if (input.type === 'FeatureCollection' && Array.isArray(input.features)) return input as GeoJSON.FeatureCollection

  // 2) Feature 단일
  if (input.type === 'Feature') {
    return { type: 'FeatureCollection', features: [input] } as any
  }

  // 3) features만 있는 객체
  if (Array.isArray(input.features)) {
    return { type: 'FeatureCollection', features: input.features } as any
  }

  return null
}

function extractSigCd(fc: GeoJSON.FeatureCollection): string | null {
  const f0: any = fc.features?.[0]
  const p = f0?.properties ?? {}

  // 다양한 키 케이스 흡수
  const sigCd = p.sig_cd ?? p.SIG_CD ?? p.sigCd ?? p.SigCd ?? null
  return typeof sigCd === 'string' && sigCd.length > 0 ? sigCd : null
}

export function useSigunguFromLoc(loc: Loc | null) {
  const [state, setState] = useState<State>({ status: 'idle' })

  // ✅ (폭주 방지 1) 스냅: 약 11m 단위 (원하면 3~5 자리 조절)
  const snapped = useMemo(() => {
    if (!loc) return null
    const lat = Number(loc.lat.toFixed(4))
    const lng = Number(loc.lng.toFixed(4))
    return { lat, lng, accuracy: loc.accuracy ?? undefined }
  }, [loc])

  // ✅ (폭주 방지 2) 디바운스 + ✅ (스킵) 같은 sig_cd면 skip
  const lastSigCdRef = useRef<string | null>(null)
  const lastKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!snapped) return

    // (옵션) 정확도 너무 나쁘면 조회 안 함 (너무 자주 흔들리는 케이스 방지)
    if (typeof snapped.accuracy === 'number' && snapped.accuracy > 200) {
      return
    }

    const key = `${snapped.lat},${snapped.lng}`
    // 스냅 결과가 같으면 아예 재실행 안 하도록 가드
    if (lastKeyRef.current === key) return
    lastKeyRef.current = key

    let cancelled = false

    const t = window.setTimeout(async () => {
      setState({ status: 'loading' })

      try {
        const raw = await fetchSigunguByPoint(snapped.lat, snapped.lng)

        // ✅ VWorld 응답 형태별로 GeoJSON 후보를 뽑고 FeatureCollection로 정규화
        const maybe = pickMaybeGeoJson(raw)
        const fc = toFeatureCollection(maybe)

        if (!fc) {
          if (!cancelled) {
            const shape = raw && typeof raw === 'object' ? Object.keys(raw) : typeof raw
            setState({
              status: 'error',
              error: `GeoJSON FeatureCollection not found in response (shape: ${String(shape)})`,
            })
          }
          return
        }

        const sigCd = extractSigCd(fc)
        if (!sigCd) {
          if (!cancelled) setState({ status: 'error', error: 'sig_cd not found in GeoJSON properties' })
          return
        }

        // ✅ (스킵) 같은 시군구면 업데이트/리렌더 최소화
        if (lastSigCdRef.current === sigCd) {
          if (!cancelled) {
            setState((prev) => (prev.status === 'success' ? prev : { status: 'success', sigCd, geojson: fc }))
          }
          return
        }
        lastSigCdRef.current = sigCd

        if (!cancelled) setState({ status: 'success', sigCd, geojson: fc })
      } catch (e: any) {
        if (!cancelled) setState({ status: 'error', error: e?.message ?? 'Failed' })
      }
    }, 700) // ✅ 디바운스(ms) — watchPosition 떨림 흡수

    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [snapped?.lat, snapped?.lng, snapped?.accuracy])

  return state
}
