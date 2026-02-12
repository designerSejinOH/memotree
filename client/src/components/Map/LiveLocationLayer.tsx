'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleF, MarkerF, useGoogleMap } from '@react-google-maps/api'
import { useGeolocation } from '@/hooks/useGeolocation'
import { AnimatePresence, motion } from 'framer-motion'
import { useSigunguFromLoc } from '@/hooks/useSigunguFromLoc'

type Tracking = false | 'observe' | 'follow'

export default function LiveLocationLayer() {
  const map = useGoogleMap()
  const { permission, loc, error, startWatch, stopWatch } = useGeolocation()
  const [tracking, setTracking] = useState<Tracking>('follow') // 기본값: follow
  const panLock = useRef(false) // 과도한 panTo 방지(간단 스로틀)

  // 지도 드래그하면 follow 해제
  useEffect(() => {
    if (!map) return
    const onDragStart = () => setTracking('observe')
    map.addListener('dragstart', onDragStart)
    return () => google.maps.event.clearListeners(map, 'dragstart')
  }, [map])

  // 권한/워치 시작 (버튼 없이 자동 시작 원치 않으면, 버튼으로 옮기면 됨)
  useEffect(() => {
    // iOS Safari는 사용자 제스처 뒤 요청이 더 안정적이지만, 기본값으로 바로 시도
    startWatch()
    return () => stopWatch()
  }, [startWatch, stopWatch])

  // follow일 때 카메라가 사용자 따라감 (간단 스로틀)
  useEffect(() => {
    if (!map || !loc || tracking !== 'follow') return
    if (panLock.current) return
    panLock.current = true
    map.panTo({ lat: loc.lat, lng: loc.lng })
    const t = setTimeout(() => {
      panLock.current = false
    }, 300) // 300ms 스로틀
    return () => clearTimeout(t)
  }, [map, loc, tracking])

  // 정확도 원 옵션
  const accuracyOpts = useMemo<google.maps.CircleOptions>(() => {
    return {
      radius: 10, // 실제 반경은 radius prop으로 지정
      strokeOpacity: 0.2,
      strokeWeight: 1,
      fillOpacity: 0.1,
      clickable: false,
      draggable: false,
      editable: false,
    }
  }, [])

  const sigungu = useSigunguFromLoc(loc)
  const dataLayerRef = useRef<google.maps.Data | null>(null)

  // geojson을 DataLayer에 반영
  useEffect(() => {
    if (!map) return

    // data layer 생성(1회)
    if (!dataLayerRef.current) {
      const layer = new google.maps.Data()
      layer.setMap(map)
      layer.setStyle({
        // 색 지정 안 한다고 했지만, polygon이 안 보이면 의미가 없어서
        // 최소한의 opacity만 설정해둘게. (원하면 palette 맞춰 바꿔)
        fillOpacity: 0.08,
        strokeOpacity: 0.35,
        strokeWeight: 2,
        clickable: false,
      })
      dataLayerRef.current = layer
    }

    const layer = dataLayerRef.current

    // 성공 상태에서만 반영
    if (sigungu.status !== 'success') return
    const geojson = sigungu.geojson

    // ✅ 기존 폴리곤 제거 후 추가
    layer.forEach((f) => layer.remove(f))

    try {
      // geojson이 FeatureCollection 형태면 그대로 가능
      layer.addGeoJson(geojson)
    } catch (e) {
      // 혹시 result가 features만 내려오는 형태면 감싸서 대응
      if (geojson?.features) {
        layer.addGeoJson({ type: 'FeatureCollection', features: geojson.features })
      }
    }

    // (옵션) 시군구 바뀔 때만 bounds 맞추기
    const bounds = new google.maps.LatLngBounds()
    layer.forEach((feature) => {
      const geom = feature.getGeometry()
      geom?.forEachLatLng((latLng) => bounds.extend(latLng))
    })
    // 너무 자주 fitBounds 하면 UX 깨져서, follow 모드에서는 하지 말고 observe에서만 하는 게 좋음
    // map.fitBounds(bounds)
  }, [map, sigungu.status, sigungu.status === 'success' ? sigungu.sigCd : null])

  console.log(sigungu)

  return (
    <>
      {/* 권한/에러 안내: 필요 시 UI로 치장 */}
      <AnimatePresence>
        {((!loc && (permission === 'prompt' || permission === 'unknown')) || permission === 'denied' || error) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              transformOrigin: 'center',
            }}
            className='absolute left-1/2 -translate-x-1/2 bottom-2 z-[1] bg-white/70 backdrop-blur-md rounded-lg overflow-hidden font-medium text-red-400 px-3 py-2 w-fit text-sm shadow'
          >
            {!loc && (permission === 'prompt' || permission === 'unknown') && (
              <div className=''>위치 권한을 허용해 주세요.</div>
            )}
            {permission === 'denied' && (
              <div className=''>위치 접근이 거부되었습니다. 브라우저 설정에서 허용해 주세요.</div>
            )}
            {error && <div className=''>{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 현재 위치 & 정확도 */}
      {loc && (
        <>
          {typeof loc.accuracy === 'number' && loc.accuracy > 0 && (
            <CircleF
              center={{ lat: loc.lat, lng: loc.lng }}
              radius={Math.max(5, loc.accuracy)} // 최소 반경 5m
              options={accuracyOpts}
            />
          )}
          <MarkerF
            position={{ lat: loc.lat, lng: loc.lng }}
            // 기본 파랑 점 아이콘을 쓰고 싶으면 options에 icon 지정 가능
          />
        </>
      )}

      {/* 오른쪽 하단 컨트롤 버튼들 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{
          bottom: `16px`,
        }}
        className='absolute right-3 z-[1] grid gap-2'
      >
        <button
          onClick={() => {
            if (!loc || !map) return
            setTracking('follow')
            map.panTo({ lat: loc.lat, lng: loc.lng })
          }}
          className='rounded-md backdrop-blur-md bg-white/50 px-3 py-2 text-sm shadow cursor-pointer'
        >
          현재 위치로
        </button>
        <button
          onClick={() => setTracking((t) => (t === 'follow' ? 'observe' : 'follow'))}
          className='rounded-md backdrop-blur-md bg-white/50 px-3 py-2 text-sm shadow cursor-pointer'
        >
          {tracking === 'follow' ? '따라가기 끄기' : '따라가기 켜기'}
        </button>
      </motion.div>
    </>
  )
}
