// src/lib/api/posts.ts

import { supabase } from '@/lib/supabase'
import type { PostInsert, LocationStat } from '@/types/database'

export async function createPost(post: PostInsert) {
  const { data, error } = await supabase.from('posts').insert(post).select().single()
  if (error) throw error
  return data
}

export async function uploadThumbnail(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('post-thumbnails').upload(filename, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('post-thumbnails').getPublicUrl(filename)
  return data.publicUrl
}

// location_stats 뷰 + posts 테이블에서 각 지역 centroid(평균 좌표) 함께 조회
export async function getLocationStatsWithCentroids(): Promise<
  (LocationStat & { avg_lat: number; avg_lng: number })[]
> {
  // location_stats 뷰 가져오기
  const { data: stats, error: statsError } = await supabase.from('location_stats').select('*')
  if (statsError) throw statsError

  // posts 테이블에서 district별 avg lat/lng 가져오기
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('sig_eng_nm, latitude, longitude')
  if (postsError) throw postsError

  // centroid 계산: sig_eng_nm 기준 그룹핑
  const centroidMap: Record<string, { sumLat: number; sumLng: number; count: number }> = {}
  for (const p of posts ?? []) {
    if (!p.sig_eng_nm) continue
    if (!centroidMap[p.sig_eng_nm]) {
      centroidMap[p.sig_eng_nm] = { sumLat: 0, sumLng: 0, count: 0 }
    }
    centroidMap[p.sig_eng_nm].sumLat += p.latitude
    centroidMap[p.sig_eng_nm].sumLng += p.longitude
    centroidMap[p.sig_eng_nm].count += 1
  }

  return (stats ?? []).map((s) => {
    const c = centroidMap[s.sig_eng_nm]
    return {
      ...s,
      avg_lat: c ? c.sumLat / c.count : 0,
      avg_lng: c ? c.sumLng / c.count : 0,
    }
  })
}
