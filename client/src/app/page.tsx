// page.tsx

'use client'

import { useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'
import { Map, Screen } from '@/components'
import LiveLocationLayer from '@/components/Map/LiveLocationLayer'
import TreeLayer from '@/components/Map/TreeLayer'
import PostBoundaryLayer from '@/components/Map/PostBoundaryLayer'
import PostModal from '@/components/PostModal'
import { getLocationStatsWithCentroids, getAllPosts } from '@/lib/api/posts'
import type { LocationStat, Post } from '@/types/database'
import type { Loc } from '@/hooks/useGeolocation'
import { motion, AnimatePresence } from 'framer-motion'

type TreeStat = LocationStat & { avg_lat: number; avg_lng: number }

export default function Page() {
  const [modalOpen, setModalOpen] = useState(false)
  const [stats, setStats] = useState<TreeStat[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loc, setLoc] = useState<Loc | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [statsData, postsData] = await Promise.all([
        getLocationStatsWithCentroids(),
        getAllPosts(),
      ])
      setStats(statsData)
      setPosts(postsData)
    } catch (e) {
      console.error('data fetch failed', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <Screen className={classNames('')}>
      <Map defaultCenter={null} defaultZoom={15}>
        <LiveLocationLayer onLocChange={setLoc} />
        <PostBoundaryLayer stats={stats} />
        <TreeLayer stats={stats} posts={posts} onPostClick={setSelectedPost} />
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
        onPosted={fetchData}
      />

      {/* 게시물 상세 모달 */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            key='post-detail-backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[50] flex items-end justify-center bg-black/40'
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              key='post-detail-sheet'
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className='bg-white w-full max-w-lg rounded-t-2xl shadow-2xl overflow-hidden'
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들 */}
              <div className='flex justify-center pt-3 pb-1'>
                <div className='w-10 h-1 rounded-full bg-gray-200' />
              </div>

              {/* 위치 뱃지 */}
              <div className='px-5 pt-2 pb-1'>
                <span className='inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1 font-medium'>
                  🌿 {selectedPost.full_nm}
                </span>
              </div>

              {/* 썸네일 */}
              {selectedPost.thumbnail && (
                <div className='px-5 pt-2'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPost.thumbnail}
                    alt='게시물 이미지'
                    className='w-full max-h-52 object-cover rounded-xl'
                  />
                </div>
              )}

              {/* 내용 */}
              <div className='px-5 py-4'>
                <p className='text-gray-800 text-sm leading-relaxed whitespace-pre-wrap'>
                  {selectedPost.content}
                </p>
                <p className='text-xs text-gray-400 mt-3'>
                  {new Date(selectedPost.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* 닫기 버튼 */}
              <div className='px-5 pb-8'>
                <button
                  onClick={() => setSelectedPost(null)}
                  className='w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors'
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  )
}
