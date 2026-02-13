'use client'

import { useEffect, useRef, useState } from 'react'
import { useGoogleMap } from '@react-google-maps/api'
import type { LocationStat } from '@/types/database'
import { fetchSigunguByPoint, fetchSidoByPoint } from '@/lib/api/sigungu'

interface TreeStat extends LocationStat {
  avg_lat: number
  avg_lng: number
}

interface PostBoundaryLayerProps {
  stats: TreeStat[]
}

const SIDO_ZOOM_THRESHOLD = 11

function toFeatureCollection(raw: any): GeoJSON.FeatureCollection | null {
  if (!raw) return null
  if (raw.type === 'FeatureCollection' && Array.isArray(raw.features)) return raw
  if (raw.type === 'Feature') return { type: 'FeatureCollection', features: [raw] } as any
  if (Array.isArray(raw.features)) return { type: 'FeatureCollection', features: raw.features } as any
  return null
}

function safeAddGeoJson(layer: google.maps.Data, fc: GeoJSON.FeatureCollection) {
  try {
    layer.addGeoJson(fc)
  } catch {
    if (fc.features) {
      try { layer.addGeoJson({ type: 'FeatureCollection', features: fc.features }) } catch { /* skip */ }
    }
  }
}

export default function PostBoundaryLayer({ stats }: PostBoundaryLayerProps) {
  const map = useGoogleMap()
  const dataLayerRef = useRef<google.maps.Data | null>(null)
  const [zoom, setZoom] = useState<number>(15)

  // 캐시: sig_cd → GeoJSON (구 단위), sido 이름 → GeoJSON (시도 단위)
  const sigunguCacheRef = useRef<Record<string, GeoJSON.FeatureCollection>>({})
  const sidoCacheRef = useRef<Record<string, GeoJSON.FeatureCollection>>({})

  // data layer 마운트 시 1회 생성, 언마운트 시 제거
  useEffect(() => {
    if (!map) return
    const layer = new google.maps.Data()
    layer.setMap(map)
    layer.setStyle({
      fillColor: '#22c55e',
      fillOpacity: 0.07,
      strokeColor: '#16a34a',
      strokeOpacity: 0.4,
      strokeWeight: 1.5,
      clickable: false,
    })
    dataLayerRef.current = layer
    return () => {
      layer.setMap(null)
      dataLayerRef.current = null
    }
  }, [map])

  // zoom 변화 감지
  useEffect(() => {
    if (!map) return
    const listener = map.addListener('zoom_changed', () => {
      setZoom(map.getZoom() ?? 15)
    })
    setZoom(map.getZoom() ?? 15)
    return () => google.maps.event.removeListener(listener)
  }, [map])

  // stats + zoom 변화 시 경계 다시 그리기
  useEffect(() => {
    const layer = dataLayerRef.current
    if (!layer || !stats.length) {
      layer?.forEach((f) => layer.remove(f))
      return
    }

    // 기존 폴리곤 제거
    layer.forEach((f) => layer.remove(f))

    let cancelled = false

    if (zoom < SIDO_ZOOM_THRESHOLD) {
      // 시도 단위: unique 시도 추출 → 각 centroid로 fetch
      const sidoMap: Record<string, { lat: number; lng: number }> = {}
      for (const s of stats) {
        if (!s.avg_lat || !s.avg_lng) continue
        const sidoNm = s.full_nm.split(' ')[0]
        if (!sidoMap[sidoNm]) sidoMap[sidoNm] = { lat: s.avg_lat, lng: s.avg_lng }
      }

      Promise.allSettled(
        Object.entries(sidoMap).map(async ([sidoNm, { lat, lng }]) => {
          if (sidoCacheRef.current[sidoNm]) return sidoCacheRef.current[sidoNm]
          const raw = await fetchSidoByPoint(lat, lng)
          const fc = toFeatureCollection(raw)
          if (fc) sidoCacheRef.current[sidoNm] = fc
          return fc
        }),
      ).then((results) => {
        if (cancelled || !dataLayerRef.current) return
        const l = dataLayerRef.current
        l.forEach((f) => l.remove(f))
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) safeAddGeoJson(l, r.value)
        }
      }).catch(console.error)
    } else {
      // 구(군) 단위: stats 각 항목별 경계 fetch
      Promise.allSettled(
        stats
          .filter((s) => s.avg_lat && s.avg_lng)
          .map(async (s) => {
            const key = String(s.sig_cd)
            if (sigunguCacheRef.current[key]) return sigunguCacheRef.current[key]
            const raw = await fetchSigunguByPoint(s.avg_lat, s.avg_lng)
            const fc = toFeatureCollection(raw)
            if (fc) sigunguCacheRef.current[key] = fc
            return fc
          }),
      ).then((results) => {
        if (cancelled || !dataLayerRef.current) return
        const l = dataLayerRef.current
        l.forEach((f) => l.remove(f))
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) safeAddGeoJson(l, r.value)
        }
      }).catch(console.error)
    }

    return () => { cancelled = true }
  }, [stats, zoom])

  return null
}
