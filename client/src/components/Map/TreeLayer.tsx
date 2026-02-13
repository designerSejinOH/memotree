'use client'

import { useEffect, useRef } from 'react'
import { useGoogleMap } from '@react-google-maps/api'
import type { LocationStat } from '@/types/database'

interface TreeStat extends LocationStat {
  avg_lat: number
  avg_lng: number
}

interface TreeLayerProps {
  stats: TreeStat[]
}

// 게시글 수에 따른 나무(박스) 색상
function getBoxColor(postCount: number): string {
  if (postCount >= 20) return '#15803d' // 짙은 초록
  if (postCount >= 10) return '#16a34a' // 초록
  if (postCount >= 5) return '#22c55e'  // 밝은 초록
  if (postCount >= 2) return '#4ade80'  // 연초록
  return '#86efac'                       // 아주 연한 초록 (1개)
}

export default function TreeLayer({ stats }: TreeLayerProps) {
  const map = useGoogleMap()
  const overlaysRef = useRef<google.maps.OverlayView[]>([])

  useEffect(() => {
    if (!map || !stats.length) return

    // 기존 오버레이 제거
    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    stats.forEach((stat) => {
      if (!stat.avg_lat || !stat.avg_lng || stat.post_count === 0) return

      const size = stat.tree_size // 30~120px
      const color = getBoxColor(stat.post_count)

      class BoxOverlay extends google.maps.OverlayView {
        private div: HTMLDivElement | null = null
        private position: google.maps.LatLng

        constructor(position: google.maps.LatLng) {
          super()
          this.position = position
        }

        onAdd() {
          const div = document.createElement('div')
          div.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border: 2px solid rgba(0,0,0,0.15);
            border-radius: 4px;
            transform: translate(-50%, -50%);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: transform 0.15s ease;
          `

          const label = document.createElement('div')
          label.style.cssText = `
            font-size: ${Math.max(9, Math.min(13, size / 7))}px;
            font-weight: 600;
            color: white;
            text-align: center;
            line-height: 1.2;
            pointer-events: none;
            text-shadow: 0 1px 2px rgba(0,0,0,0.4);
            padding: 2px;
            overflow: hidden;
          `

          const displayName = stat.sig_kor_nm.length > 4 ? stat.sig_kor_nm.slice(0, 4) + '..' : stat.sig_kor_nm
          label.textContent = size >= 50 ? `${displayName}\n${stat.post_count}` : `${stat.post_count}`
          label.style.whiteSpace = 'pre'

          div.appendChild(label)

          // 호버 효과
          div.addEventListener('mouseenter', () => {
            div.style.transform = 'translate(-50%, -50%) scale(1.1)'
          })
          div.addEventListener('mouseleave', () => {
            div.style.transform = 'translate(-50%, -50%) scale(1)'
          })

          // 클릭 시 툴팁
          div.addEventListener('click', () => {
            const infoDiv = document.getElementById(`tree-info-${stat.sig_cd}`)
            if (infoDiv) {
              infoDiv.style.display = infoDiv.style.display === 'none' ? 'block' : 'none'
            }
          })

          this.div = div
          const panes = this.getPanes()
          panes?.overlayMouseTarget.appendChild(div)
        }

        draw() {
          if (!this.div) return
          const proj = this.getProjection()
          if (!proj) return
          const point = proj.fromLatLngToDivPixel(this.position)
          if (!point) return
          this.div.style.left = `${point.x}px`
          this.div.style.top = `${point.y}px`
        }

        onRemove() {
          this.div?.parentNode?.removeChild(this.div)
          this.div = null
        }
      }

      const overlay = new BoxOverlay(new google.maps.LatLng(stat.avg_lat, stat.avg_lng))
      overlay.setMap(map)
      overlaysRef.current.push(overlay)
    })

    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null))
      overlaysRef.current = []
    }
  }, [map, stats])

  return null
}
