'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleF, MarkerF, useGoogleMap } from '@react-google-maps/api'
import { useGeolocation } from '@/hooks/useGeolocation'
import { AnimatePresence, motion } from 'framer-motion'
import { useSigunguFromLoc } from '@/hooks/useSigunguFromLoc'
import { useGoogleMaps } from '@/app/providers/GoogleMapsProvider'
import { BiCurrentLocation } from 'react-icons/bi'
import { IoClose } from 'react-icons/io5'

type Tracking = false | 'observe' | 'follow'

interface LiveLocationLayerProps {
  onLocChange?: (loc: import('@/hooks/useGeolocation').Loc | null) => void
}

export default function LiveLocationLayer({ onLocChange }: LiveLocationLayerProps = {}) {
  const map = useGoogleMap()
  const { isLoaded } = useGoogleMaps()
  const { permission, loc, error, startWatch, stopWatch } = useGeolocation()
  const [tracking, setTracking] = useState<Tracking>(false)
  const [modalDismissed, setModalDismissed] = useState(false)
  const panLock = useRef(false)
  const [zoom, setZoom] = useState<number>(15)

  // zoom 변화 감지
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
    const onDragStart = () => {
      if (tracking === 'follow') setTracking('observe')
    }
    map.addListener('dragstart', onDragStart)
    return () => google.maps.event.clearListeners(map, 'dragstart')
  }, [map, tracking])

  // 권한/워치 시작
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

  // 통합 버튼 클릭 핸들러
  const handleLocationButtonClick = () => {
    if (!loc || !map) {
      // 에러가 있으면 모달 다시 표시
      if (error || permission === 'denied' || (!loc && (permission === 'prompt' || permission === 'unknown'))) {
        setModalDismissed(false)
      }
      return
    }

    if (tracking === false) {
      // 첫 클릭: 현재 위치로 이동
      map.panTo({ lat: loc.lat, lng: loc.lng })
      setTracking('observe')
    } else if (tracking === 'observe') {
      // 두 번째 클릭: 따라가기 모드 활성화
      setTracking('follow')
    } else {
      // 세 번째 클릭: 비활성화
      setTracking(false)
    }
  }

  // 모달 표시 여부
  const shouldShowModal =
    !modalDismissed &&
    ((!loc && (permission === 'prompt' || permission === 'unknown')) || permission === 'denied' || error)

  return (
    <>
      {/* 권한/에러 안내 */}
      <AnimatePresence>
        {shouldShowModal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-[1] text-center break-keep bg-white/70 backdrop-blur-md rounded-lg overflow-hidden font-medium text-red-400 p-4 w-[80vw] max-w-lg text-sm shadow flex flex-col gap-2 items-center justify-center relative'
          >
            <button
              onClick={() => setModalDismissed(true)}
              className='absolute top-2 right-2 p-1 hover:bg-white/50 rounded-full transition-colors'
            >
              <IoClose className='text-xl' />
            </button>
            {!loc && (permission === 'prompt' || permission === 'unknown') && <div>위치 권한을 허용해 주세요.</div>}
            {permission === 'denied' && (
              <div>
                위치 접근이 거부되었습니다. <br />
                브라우저 설정에서 허용해 주세요.
              </div>
            )}
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

      {/* 오른쪽 하단 통합 버튼 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        className='absolute right-4 bottom-6 z-[1] w-fit h-fit flex flex-col gap-2 items-center justify-center'
      >
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLocationButtonClick}
          className={`rounded-md backdrop-blur-md bg-white/50 hover:bg-white/70 p-2 w-fit h-fit text-2xl shadow cursor-pointer transition-all `}
        >
          <BiCurrentLocation
            className={`
          transition-all
            ${tracking === 'follow' ? 'text-green-600' : tracking === 'observe' ? 'text-green-600 animate-pulse' : 'text-gray-600'}
            `}
          />
        </motion.button>
      </motion.div>
    </>
  )
}
