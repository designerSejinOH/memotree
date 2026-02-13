'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleF, MarkerF, useGoogleMap } from '@react-google-maps/api'
import { useGeolocation } from '@/hooks/useGeolocation'
import { AnimatePresence, motion } from 'framer-motion'
import { useSigunguFromLoc } from '@/hooks/useSigunguFromLoc'
import { useGoogleMaps } from '@/app/providers/GoogleMapsProvider'

type Tracking = false | 'observe' | 'follow'

interface LiveLocationLayerProps {
  onLocChange?: (loc: import('@/hooks/useGeolocation').Loc | null) => void
}

export default function LiveLocationLayer({ onLocChange }: LiveLocationLayerProps = {}) {
  const map = useGoogleMap()
  const { isLoaded } = useGoogleMaps()
  const { permission, loc, error, startWatch, stopWatch } = useGeolocation()
  const [tracking, setTracking] = useState<Tracking>('follow')
  const panLock = useRef(false)
  const [zoom, setZoom] = useState<number>(15)

  // zoom 변화 감지 (하단 행정구역 텍스트 표시에 사용)
  useEffect(() => {
    if (!map) return
    const listener = map.addListener('zoom_changed', () => {
      setZoom(map.getZoom() ?? 15)
    })
    setZoom(map.getZoom() ?? 15)
    return () => google.maps.event.removeListener(listener)
  }, [map])

  // 지도 드래그하면 follow 해제
  useEffect(() => {
    if (!map) return
    const onDragStart = () => setTracking('observe')
    map.addListener('dragstart', onDragStart)
    return () => google.maps.event.clearListeners(map, 'dragstart')
  }, [map])

  // 권한/워치 시작 (Google Maps 로딩 완료 후에만)
  useEffect(() => {
    if (!isLoaded) return
    startWatch()
    return () => stopWatch()
  }, [isLoaded, startWatch, stopWatch])

  // follow일 때 카메라가 사용자 따라감
  useEffect(() => {
    if (!map || !loc || tracking !== 'follow') return
    if (panLock.current) return
    panLock.current = true
    map.panTo({ lat: loc.lat, lng: loc.lng })
    const t = setTimeout(() => {
      panLock.current = false
    }, 300)
    return () => clearTimeout(t)
  }, [map, loc, tracking])

  // 정확도 원 옵션
  const accuracyOpts = useMemo<google.maps.CircleOptions>(
    () => ({
      radius: 10,
      strokeOpacity: 0.2,
      strokeWeight: 1,
      fillOpacity: 0.1,
      clickable: false,
      draggable: false,
      editable: false,
    }),
    [],
  )

  // loc 변경 시 부모에 전달
  useEffect(() => {
    onLocChange?.(loc)
  }, [loc, onLocChange])

  const sigungu = useSigunguFromLoc(loc)

  return (
    <>
      {/* 권한/에러 안내 */}
      <AnimatePresence>
        {((!loc && (permission === 'prompt' || permission === 'unknown')) || permission === 'denied' || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='absolute left-1/2 -translate-x-1/2 bottom-2 z-[1] bg-white/70 backdrop-blur-md rounded-lg overflow-hidden font-medium text-red-400 px-3 py-2 w-fit text-sm shadow'
          >
            {!loc && (permission === 'prompt' || permission === 'unknown') && <div>위치 권한을 허용해 주세요.</div>}
            {permission === 'denied' && <div>위치 접근이 거부되었습니다. 브라우저 설정에서 허용해 주세요.</div>}
            {error && <div>{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 현재 위치 & 정확도 */}
      {loc && (
        <>
          {typeof loc.accuracy === 'number' && loc.accuracy > 0 && (
            <CircleF
              center={{ lat: loc.lat, lng: loc.lng }}
              radius={Math.max(5, loc.accuracy)}
              options={accuracyOpts}
            />
          )}
          <MarkerF position={{ lat: loc.lat, lng: loc.lng }} />
        </>
      )}

      {/* 오른쪽 하단 컨트롤 버튼들 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        style={{ bottom: 16 }}
        className='absolute right-3 z-[1] grid gap-2'
      >
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!loc || !map) return
            setTracking('follow')
            map.panTo({ lat: loc.lat, lng: loc.lng })
          }}
          className='rounded-md backdrop-blur-md bg-white/50 px-3 py-2 text-sm shadow cursor-pointer hover:bg-white/70 transition-colors'
        >
          현재 위치로
        </motion.button>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTracking((t) => (t === 'follow' ? 'observe' : 'follow'))}
          className='rounded-md backdrop-blur-md bg-white/50 px-3 py-2 text-sm shadow cursor-pointer hover:bg-white/70 transition-colors'
        >
          {tracking === 'follow' ? '따라가기 끄기' : '따라가기 켜기'}
        </motion.button>
      </motion.div>

      {/* 행정구역 정보 표시 (줌 레벨에 따라 시도/시군구 전환) */}
      <AnimatePresence mode='wait'>
        {sigungu.status === 'loading' ? (
          <motion.div
            key='loading'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='absolute left-1/2 -translate-x-1/2 bottom-16 z-[1] bg-white/70 backdrop-blur-md rounded-lg overflow-hidden font-medium text-gray-700 px-3 py-2 w-fit text-sm shadow'
          >
            위치 정보를 불러오는 중입니다...
          </motion.div>
        ) : sigungu.status === 'error' ? (
          <motion.div
            key='error'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='absolute left-1/2 -translate-x-1/2 bottom-16 z-[1] bg-white/70 backdrop-blur-md rounded-lg overflow-hidden font-medium text-red-400 px-3 py-2 w-fit text-sm shadow'
          >
            시군구 정보를 불러오는 중에 오류가 발생했습니다.
          </motion.div>
        ) : sigungu.status === 'success' && sigungu.address ? (
          <motion.div
            key='success'
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='absolute left-1/2 -translate-x-1/2 bottom-0 z-[1] p-4 bg-white/70 backdrop-blur-md rounded-t-2xl overflow-hidden text-lg font-medium text-gray-700 w-[90vw] max-w-lg h-fit shadow'
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className='text-red-400'
            >
              ⦿
            </motion.span>{' '}
            {zoom < 7
              ? (sigungu.address.full_nm?.split(' ')[0] || '시도 정보 없음')
              : (sigungu.address.full_nm || '시군구 정보 없음')}
            {zoom >= 7 && sigungu.address.sig_kor_nm ? ` (${sigungu.address.sig_kor_nm})` : ''}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
