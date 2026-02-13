// page.tsx

'use client'

import { useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'
import { Map, Screen } from '@/components'
import LiveLocationLayer from '@/components/Map/LiveLocationLayer'
import TreeLayer from '@/components/Map/TreeLayer'
import PostModal from '@/components/PostModal'
import { getLocationStatsWithCentroids } from '@/lib/api/posts'
import type { LocationStat } from '@/types/database'
import type { Loc } from '@/hooks/useGeolocation'
import { motion } from 'framer-motion'

type TreeStat = LocationStat & { avg_lat: number; avg_lng: number }

export default function Page() {
  const [modalOpen, setModalOpen] = useState(false)
  const [stats, setStats] = useState<TreeStat[]>([])
  const [loc, setLoc] = useState<Loc | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const data = await getLocationStatsWithCentroids()
      setStats(data)
    } catch (e) {
      console.error('location stats fetch failed', e)
    }
  }, [])

  // 초기 로드 시 통계 가져오기
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <Screen className={classNames('')}>
      <Map defaultCenter={null} defaultZoom={15}>
        <LiveLocationLayer onLocChange={setLoc} />
        <TreeLayer stats={stats} />
      </Map>

      {/* 플로팅 글쓰기 버튼 */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.3 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setModalOpen(true)}
        style={{ bottom: 96 }}
        className='fixed left-1/2 -translate-x-1/2 z-[10] bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-6 py-3 rounded-full shadow-lg cursor-pointer transition-colors flex items-center gap-2'
      >
        <span className='text-base'>🌱</span>
        나무 심기
      </motion.button>

      {/* 포스트 작성 모달 */}
      <PostModal
        open={modalOpen}
        loc={loc}
        onClose={() => setModalOpen(false)}
        onPosted={fetchStats}
      />
    </Screen>
  )
}
