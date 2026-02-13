'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useGoogleMap } from '@react-google-maps/api'
import type { LocationStat, Post } from '@/types/database'

interface TreeStat extends LocationStat {
  avg_lat: number
  avg_lng: number
}

interface CityStat {
  city_nm: string
  post_count: number
  avg_lat: number
  avg_lng: number
}

type ClusterLevel = 'city' | 'district' | 'post'

interface TreeLayerProps {
  stats: TreeStat[]
  posts: Post[]
  onPostClick: (post: Post) => void
}

function getBoxColor(postCount: number): string {
  if (postCount >= 20) return '#15803d'
  if (postCount >= 10) return '#16a34a'
  if (postCount >= 5) return '#22c55e'
  if (postCount >= 2) return '#4ade80'
  return '#86efac'
}

function getClusterLevel(zoom: number): ClusterLevel {
  if (zoom < 10) return 'city'
  if (zoom < 13) return 'district'
  return 'post'
}

function makeBox(
  size: number,
  color: string,
  labelHtml: string,
  shape: 'circle' | 'rect',
  fontSize: number,
): HTMLDivElement {
  const div = document.createElement('div')
  div.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    background-color: ${color};
    border: 2px solid rgba(255,255,255,0.6);
    border-radius: ${shape === 'circle' ? '50%' : '8px'};
    transform: translate(-50%, -50%);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.25);
    transition: transform 0.15s ease;
  `
  const label = document.createElement('div')
  label.style.cssText = `
    font-size: ${fontSize}px;
    font-weight: 700;
    color: white;
    text-align: center;
    line-height: 1.3;
    pointer-events: none;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    padding: 2px;
    overflow: hidden;
  `
  label.innerHTML = labelHtml
  div.appendChild(label)
  div.addEventListener('mouseenter', () => { div.style.transform = 'translate(-50%, -50%) scale(1.12)' })
  div.addEventListener('mouseleave', () => { div.style.transform = 'translate(-50%, -50%) scale(1)' })
  return div
}

export default function TreeLayer({ stats, posts, onPostClick }: TreeLayerProps) {
  const map = useGoogleMap()
  const overlaysRef = useRef<google.maps.OverlayView[]>([])
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

  // 시(도) 레벨 집계
  const cityStats = useMemo<CityStat[]>(() => {
    const cityMap: Record<string, { post_count: number; sumLat: number; sumLng: number }> = {}
    for (const s of stats) {
      if (!s.avg_lat || !s.avg_lng) continue
      const cityName = s.full_nm.split(' ')[0]
      if (!cityMap[cityName]) cityMap[cityName] = { post_count: 0, sumLat: 0, sumLng: 0 }
      cityMap[cityName].post_count += s.post_count
      cityMap[cityName].sumLat += s.avg_lat * s.post_count
      cityMap[cityName].sumLng += s.avg_lng * s.post_count
    }
    return Object.entries(cityMap).map(([city_nm, v]) => ({
      city_nm,
      post_count: v.post_count,
      avg_lat: v.sumLat / v.post_count,
      avg_lng: v.sumLng / v.post_count,
    }))
  }, [stats])

  useEffect(() => {
    if (!map) return

    // 오버레이를 생성하는 공통 팩토리 (useEffect 안에서 google 참조 가능)
    function createOverlay(
      lat: number,
      lng: number,
      el: HTMLDivElement,
      onClick: () => void,
    ): google.maps.OverlayView {
      class Overlay extends google.maps.OverlayView {
        private div: HTMLDivElement | null = null
        onAdd() {
          this.div = el
          this.div.addEventListener('click', (e) => { e.stopPropagation(); onClick() })
          this.getPanes()?.overlayMouseTarget.appendChild(this.div)
        }
        draw() {
          if (!this.div) return
          const proj = this.getProjection()
          if (!proj) return
          const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(lat, lng))
          if (!pt) return
          this.div.style.left = `${pt.x}px`
          this.div.style.top = `${pt.y}px`
        }
        onRemove() {
          this.div?.parentNode?.removeChild(this.div)
          this.div = null
        }
      }
      return new Overlay()
    }

    // 기존 오버레이 제거
    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    const level = getClusterLevel(zoom)

    if (level === 'city') {
      // 시(도) 단위 - 원형 클러스터
      cityStats.forEach((city) => {
        if (!city.avg_lat || !city.avg_lng || city.post_count === 0) return
        const size = Math.min(120, Math.max(44, 36 + city.post_count * 2))
        const color = getBoxColor(city.post_count)
        const fontSize = Math.max(9, Math.min(12, size / 8))
        const displayName = city.city_nm.length > 5 ? city.city_nm.slice(0, 5) + '..' : city.city_nm
        const el = makeBox(size, color, `${displayName}<br>${city.post_count}`, 'circle', fontSize)
        const overlay = createOverlay(city.avg_lat, city.avg_lng, el, () => {
          map.setZoom(10)
          map.panTo({ lat: city.avg_lat, lng: city.avg_lng })
        })
        overlay.setMap(map)
        overlaysRef.current.push(overlay)
      })
    } else if (level === 'district') {
      // 구(군) 단위 - 사각형 클러스터
      stats.forEach((stat) => {
        if (!stat.avg_lat || !stat.avg_lng || stat.post_count === 0) return
        const size = stat.tree_size
        const color = getBoxColor(stat.post_count)
        const fontSize = Math.max(9, Math.min(13, size / 7))
        const displayName = stat.sig_kor_nm.length > 4 ? stat.sig_kor_nm.slice(0, 4) + '..' : stat.sig_kor_nm
        const labelHtml = size >= 50 ? `${displayName}<br>${stat.post_count}` : `${stat.post_count}`
        const el = makeBox(size, color, labelHtml, 'rect', fontSize)
        const overlay = createOverlay(stat.avg_lat, stat.avg_lng, el, () => {
          map.setZoom(13)
          map.panTo({ lat: stat.avg_lat, lng: stat.avg_lng })
        })
        overlay.setMap(map)
        overlaysRef.current.push(overlay)
      })
    } else {
      // 개별 게시물 마커
      posts.forEach((post) => {
        if (!post.latitude || !post.longitude) return
        const el = document.createElement('div')
        el.style.cssText = `
          position: absolute;
          width: 34px;
          height: 34px;
          background-color: #22c55e;
          border: 2.5px solid white;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.15s ease;
          font-size: 16px;
        `
        el.textContent = '🌱'
        el.addEventListener('mouseenter', () => { el.style.transform = 'translate(-50%, -50%) scale(1.2)' })
        el.addEventListener('mouseleave', () => { el.style.transform = 'translate(-50%, -50%) scale(1)' })
        const overlay = createOverlay(post.latitude, post.longitude, el, () => onPostClick(post))
        overlay.setMap(map)
        overlaysRef.current.push(overlay)
      })
    }

    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null))
      overlaysRef.current = []
    }
  }, [map, stats, posts, zoom, cityStats, onPostClick])

  return null
}
