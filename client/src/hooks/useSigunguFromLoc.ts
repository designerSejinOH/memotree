'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Loc } from '@/hooks/useGeolocation'
import { fetchSigunguByPoint } from '@/lib/api/sigungu'
import toast from 'react-hot-toast'

type State =
  | {
      status: 'idle'
      geojson?: GeoJSON.FeatureCollection
      address?: { sig_cd?: number; sig_eng_nm?: string; full_nm?: string; sig_kor_nm?: string }
    }
  | {
      status: 'loading'
      geojson?: GeoJSON.FeatureCollection
      address?: { sig_cd?: number; sig_eng_nm?: string; full_nm?: string; sig_kor_nm?: string }
    }
  | {
      status: 'success'
      sigCd: string
      geojson: GeoJSON.FeatureCollection
      address?: { sig_cd?: number; sig_eng_nm?: string; full_nm?: string; sig_kor_nm?: string }
    }
  | {
      status: 'error'
      error: string
      geojson?: GeoJSON.FeatureCollection
      address?: { sig_cd?: number; sig_eng_nm?: string; full_nm?: string; sig_kor_nm?: string }
    }

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

// GeoJSON Polygon을 Google Maps LatLng 배열로 변환
function extractPolygonCoords(fc: GeoJSON.FeatureCollection): google.maps.LatLng[] | null {
  const f0 = fc.features?.[0]
  if (!f0 || !f0.geometry) return null

  // Polygon 또는 MultiPolygon 처리
  if (f0.geometry.type === 'Polygon') {
    const coords = (f0.geometry as GeoJSON.Polygon).coordinates[0] // 외부 링만 사용
    return coords.map(([lng, lat]) => new google.maps.LatLng(lat, lng))
  } else if (f0.geometry.type === 'MultiPolygon') {
    // MultiPolygon인 경우 첫 번째 Polygon만 사용
    const coords = (f0.geometry as GeoJSON.MultiPolygon).coordinates[0][0]
    return coords.map(([lng, lat]) => new google.maps.LatLng(lat, lng))
  }

  return null
}

// 점이 Polygon 내부에 있는지 체크
function isPointInPolygon(lat: number, lng: number, polygon: google.maps.LatLng[]): boolean {
  if (!google?.maps?.geometry?.poly) return false
  const point = new google.maps.LatLng(lat, lng)
  return google.maps.geometry.poly.containsLocation(point, new google.maps.Polygon({ paths: polygon }))
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

  // 🎯 현재 시군구의 Polygon 경계를 저장 (경계 내부에 있으면 API 요청 스킵)
  const currentPolygonRef = useRef<google.maps.LatLng[] | null>(null)

  // 🔧 모바일 캐시 문제 해결: loc이 null에서 non-null로 변경되거나, 컴포넌트 마운트 시 ref 초기화
  const prevLocRef = useRef<Loc | null>(null)
  useEffect(() => {
    // loc이 null에서 non-null로 변경되면 캐시 초기화
    if (!prevLocRef.current && loc) {
      lastSigCdRef.current = null
      lastKeyRef.current = null
      currentPolygonRef.current = null
    }
    prevLocRef.current = loc
  }, [loc])

  useEffect(() => {
    if (!snapped) return

    // (옵션) 정확도 너무 나쁘면 조회 안 함 (너무 자주 흔들리는 케이스 방지)
    if (typeof snapped.accuracy === 'number' && snapped.accuracy > 200) {
      return
    }

    const key = `${snapped.lat},${snapped.lng}`
    // 스냅 결과가 같으면 아예 재실행 안 하도록 가드
    if (lastKeyRef.current === key) return

    // 🎯 현재 시군구 경계 내부에 있는지 체크 (있으면 API 요청 스킵)
    if (currentPolygonRef.current) {
      const isInside = isPointInPolygon(snapped.lat, snapped.lng, currentPolygonRef.current)
      if (isInside) {
        // 경계 내부에 있으므로 API 요청 하지 않음
        return
      }
    }

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
            toast.error('시군구 정보를 불러오는 중 오류가 발생했습니다.')
          }
          return
        }

        const sigCd = extractSigCd(fc)
        if (!sigCd) {
          if (!cancelled) {
            setState({ status: 'error', error: 'sig_cd not found in GeoJSON properties' })
            toast.error('시군구 정보를 불러오는 중 오류가 발생했습니다.')
          }
          return
        }

        // 🎯 시군구 경계(Polygon) 추출
        const polygon = extractPolygonCoords(fc)

        // ✅ (스킵) 같은 시군구면 업데이트/리렌더 최소화
        if (lastSigCdRef.current === sigCd) {
          if (!cancelled) {
            setState((prev) =>
              prev.status === 'success'
                ? prev
                : {
                    status: 'success',
                    sigCd,
                    geojson: fc,
                    address: {
                      sig_cd: fc.features[0]?.properties?.sig_cd,
                      sig_eng_nm: fc.features[0]?.properties?.sig_eng_nm,
                      full_nm: fc.features[0]?.properties?.full_nm,
                      sig_kor_nm: fc.features[0]?.properties?.sig_kor_nm,
                    },
                  },
            )
            toast.success(`현재 계신 동네는 ${fc.features[0]?.properties?.full_nm}입니다.`)
          }
          return
        }
        lastSigCdRef.current = sigCd
        currentPolygonRef.current = polygon // 🎯 경계 저장

        if (!cancelled) {
          setState({
            status: 'success',
            sigCd,
            geojson: fc,
            address: {
              sig_cd: fc.features[0]?.properties?.sig_cd,
              sig_eng_nm: fc.features[0]?.properties?.sig_eng_nm,
              full_nm: fc.features[0]?.properties?.full_nm,
              sig_kor_nm: fc.features[0]?.properties?.sig_kor_nm,
            },
          })
          toast.success(`현재 계신 동네는 ${fc.features[0]?.properties?.full_nm}입니다.`)
        }
      } catch (e: any) {
        if (!cancelled) {
          setState({ status: 'error', error: e?.message || 'Failed' })
          toast.error('시군구 정보를 불러오는 중 오류가 발생했습니다.')
        }
      }
    }, 700) // ✅ 디바운스(ms) — watchPosition 떨림 흡수

    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [snapped?.lat, snapped?.lng, snapped?.accuracy])

  return state
}
