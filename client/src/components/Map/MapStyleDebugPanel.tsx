// components/Map/MapStyleDebugPanel.tsx
'use client'

import { useState, useCallback, useMemo, useRef } from 'react'

interface StyleRule {
  featureType: string
  elementType: string
  stylers: Array<{ [key: string]: any }>
  description?: string
}

interface MapStyleDebugPanelProps {
  initialStyles: google.maps.MapTypeStyle[]
  onStyleChange: (styles: google.maps.MapTypeStyle[]) => void
}

// featureType 한글 매핑
const FEATURE_TYPE_KR: Record<string, string> = {
  all: '전체',
  water: '물 (강/바다/호수)',
  road: '도로',
  'road.highway': '고속도로',
  'road.highway.controlled_access': '고속도로 (진출입통제)',
  'road.arterial': '간선도로',
  'road.local': '골목길',
  landscape: '지형',
  'landscape.man_made': '인공지형',
  'landscape.natural': '자연지형',
  'landscape.natural.landcover': '식생/피복',
  'landscape.natural.terrain': '산지/기복',
  poi: '장소 (POI)',
  'poi.park': '공원',
  'poi.business': '상업시설',
  'poi.attraction': '관광명소',
  'poi.government': '정부/공공기관',
  'poi.medical': '병원/의료시설',
  'poi.place_of_worship': '종교시설',
  'poi.school': '학교',
  'poi.sports_complex': '스포츠시설',
  administrative: '행정구역',
  'administrative.country': '국가',
  'administrative.province': '도/광역시',
  'administrative.locality': '시/구',
  'administrative.neighborhood': '동/읍/면',
  'administrative.land_parcel': '지번/필지',
  transit: '대중교통',
  'transit.line': '노선',
  'transit.station': '역/정류장',
  'transit.station.airport': '공항',
  'transit.station.bus': '버스정류장',
  'transit.station.rail': '철도/지하철역',
}

// elementType 한글 매핑
const ELEMENT_TYPE_KR: Record<string, string> = {
  all: '전체',
  geometry: '도형',
  'geometry.fill': '면',
  'geometry.stroke': '선',
  labels: '라벨',
  'labels.text': '텍스트',
  'labels.text.fill': '텍스트 색',
  'labels.text.stroke': '텍스트 외곽선',
  'labels.icon': '아이콘',
}

export function MapStyleDebugPanel({ initialStyles, onStyleChange }: MapStyleDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [styles, setStyles] = useState<StyleRule[]>(initialStyles as StyleRule[])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // 초기 스타일을 참조용으로 보관
  const originalStylesRef = useRef<StyleRule[]>(JSON.parse(JSON.stringify(initialStyles)))

  const updateStyleVisibility = useCallback(
    (index: number, visible: boolean) => {
      const newStyles = [...styles]
      const rule = newStyles[index]

      if (rule && rule.stylers) {
        const visibilityStyler = rule.stylers.find((s) => 'visibility' in s)
        if (visibilityStyler) {
          visibilityStyler.visibility = visible ? 'on' : 'off'
        } else {
          rule.stylers.push({ visibility: visible ? 'on' : 'off' })
        }

        setStyles(newStyles)
        onStyleChange(newStyles)
      }
    },
    [styles, onStyleChange],
  )

  const updateStyleColor = useCallback(
    (index: number, color: string) => {
      const newStyles = [...styles]
      const rule = newStyles[index]

      if (rule && rule.stylers) {
        const colorStyler = rule.stylers.find((s) => 'color' in s)
        if (colorStyler) {
          colorStyler.color = color
        } else {
          rule.stylers.push({ color })
        }

        setStyles(newStyles)
        onStyleChange(newStyles)
      }
    },
    [styles, onStyleChange],
  )

  // 개별 항목 리셋
  const resetStyle = useCallback(
    (index: number) => {
      const newStyles = [...styles]
      const originalStyle = originalStylesRef.current[index]

      if (originalStyle) {
        // 원본 스타일을 깊은 복사하여 적용
        newStyles[index] = JSON.parse(JSON.stringify(originalStyle))
        setStyles(newStyles)
        onStyleChange(newStyles)
      }
    },
    [styles, onStyleChange],
  )

  // 전체 리셋
  const resetAllStyles = useCallback(() => {
    const originalStyles = JSON.parse(JSON.stringify(originalStylesRef.current))
    setStyles(originalStyles)
    onStyleChange(originalStyles)
  }, [onStyleChange])

  // 스타일을 featureType으로 그룹화
  const groupedStyles = useMemo(() => {
    return styles.reduce(
      (acc, style, index) => {
        const key = style.featureType || 'other'
        if (!acc[key]) acc[key] = []
        acc[key].push({ ...style, originalIndex: index })
        return acc
      },
      {} as Record<string, Array<StyleRule & { originalIndex: number }>>,
    )
  }, [styles])

  // 검색 필터 적용
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedStyles

    const filtered: Record<string, Array<StyleRule & { originalIndex: number }>> = {}
    Object.entries(groupedStyles).forEach(([key, rules]) => {
      const matchingRules = rules.filter((rule) => {
        const featureKr = FEATURE_TYPE_KR[rule.featureType] || rule.featureType
        const elementKr = ELEMENT_TYPE_KR[rule.elementType] || rule.elementType
        const searchLower = searchTerm.toLowerCase()
        return (
          featureKr.toLowerCase().includes(searchLower) ||
          elementKr.toLowerCase().includes(searchLower) ||
          rule.featureType.toLowerCase().includes(searchLower) ||
          rule.elementType.toLowerCase().includes(searchLower)
        )
      })
      if (matchingRules.length > 0) {
        filtered[key] = matchingRules
      }
    })
    return filtered
  }, [groupedStyles, searchTerm])

  // 개발 모드가 아니면 렌더링하지 않음
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  const toggleAllInGroup = (groupKey: string, visible: boolean) => {
    const rules = groupedStyles[groupKey]
    if (!rules) return

    const newStyles = [...styles]
    rules.forEach((rule) => {
      const index = rule.originalIndex
      if (newStyles[index] && newStyles[index].stylers) {
        const visibilityStyler = newStyles[index].stylers.find((s) => 'visibility' in s)
        if (visibilityStyler) {
          visibilityStyler.visibility = visible ? 'on' : 'off'
        } else {
          newStyles[index].stylers.push({ visibility: visible ? 'on' : 'off' })
        }
      }
    })

    setStyles(newStyles)
    onStyleChange(newStyles)
  }

  const exportStyles = () => {
    const dataStr = JSON.stringify(styles, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `map-style-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const getVisibility = (stylers: Array<{ [key: string]: any }>) => {
    const visStyler = stylers?.find((s) => 'visibility' in s)
    return visStyler?.visibility !== 'off'
  }

  const getColor = (stylers: Array<{ [key: string]: any }>) => {
    const colorStyler = stylers?.find((s) => 'color' in s)
    return colorStyler?.color || '#000000'
  }

  const getGroupVisibilityState = (rules: Array<StyleRule & { originalIndex: number }>) => {
    const visibleCount = rules.filter((rule) => getVisibility(rule.stylers)).length
    if (visibleCount === 0) return 'none'
    if (visibleCount === rules.length) return 'all'
    return 'some'
  }

  // 스타일이 변경되었는지 확인
  const isStyleModified = (index: number) => {
    const currentStyle = styles[index]
    const originalStyle = originalStylesRef.current[index]
    return JSON.stringify(currentStyle) !== JSON.stringify(originalStyle)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className='fixed top-4 right-4 z-[1000] bg-black/30 backdrop-blur-md rounded-xl shadow-2xl text-white px-4 py-2 hover:bg-white/20 transition-all duration-200 text-sm font-medium border border-white/20'
      >
        🎨 맵 스타일 편집
      </button>
    )
  }

  return (
    <div className='fixed right-4 top-4 h-[32rem] w-96 max-w-[80vw] bg-black/40 backdrop-blur-md rounded-xl shadow-2xl z-[1000] flex flex-col text-white border border-white/20'>
      {/* Header */}
      <div className='w-full border-b border-white/30 h-fit flex flex-col gap-2 p-3'>
        <div className='flex flex-row items-center justify-between'>
          <h3 className='text-base font-semibold'>맵 스타일 편집기</h3>
          <div className='flex gap-2'>
            <button
              onClick={resetAllStyles}
              className='px-3 py-1.5 border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-all duration-200 text-xs font-medium text-amber-200'
              title='모든 스타일을 기본값으로 되돌리기'
            >
              ↺ 초기화
            </button>
            <button
              onClick={exportStyles}
              className='px-3 py-1.5 border border-white/40 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-xs font-medium'
              title='현재 스타일을 JSON 파일로 내보내기'
            >
              💾 내보내기
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className='px-3 py-1.5 border border-white/40 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-xs font-medium'
            >
              ✕ 닫기
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type='text'
          placeholder='검색... (예: 도로, 공원, labels)'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-sm placeholder:text-white/50 focus:outline-none focus:border-white/50 transition-colors'
        />
      </div>

      {/* Scrollable content */}
      <div className='flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent'>
        {Object.entries(filteredGroups).map(([featureType, rules]) => {
          const visState = getGroupVisibilityState(rules)
          const isExpanded = expandedGroups.has(featureType)

          return (
            <div key={featureType} className='border-b border-white/20'>
              {/* Group header */}
              <div className='flex items-center justify-between p-2 hover:bg-white/5 transition-colors'>
                <button onClick={() => toggleGroup(featureType)} className='flex-1 flex items-center gap-2 text-left'>
                  <span
                    className='text-sm transition-transform duration-200'
                    style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  >
                    ▼
                  </span>
                  <span className='text-sm font-medium'>{FEATURE_TYPE_KR[featureType] || featureType}</span>
                  <span className='text-xs opacity-60'>({rules.length}개)</span>
                </button>

                {/* Group toggle all */}
                <button
                  onClick={() => toggleAllInGroup(featureType, visState !== 'all')}
                  className='w-14 px-2 py-1 text-xs border border-white/30 bg-white/5 hover:bg-white/10 rounded transition-all duration-200'
                  title={visState === 'all' ? '그룹 전체 숨기기' : '그룹 전체 보이기'}
                >
                  {visState === 'all' ? '☑︎ 전체' : visState === 'some' ? '◨ 일부' : '◻︎ 전체'}
                </button>
              </div>

              {/* Group content */}
              {isExpanded && (
                <div className='bg-black/20'>
                  {rules.map((rule) => {
                    const visible = getVisibility(rule.stylers)
                    const color = getColor(rule.stylers)
                    const hasColor = rule.stylers?.some((s) => 'color' in s)
                    const isModified = isStyleModified(rule.originalIndex)

                    return (
                      <div
                        key={rule.originalIndex}
                        className={`flex items-center gap-2 px-3 py-2 border-t border-white/10 hover:bg-white/5 transition-colors ${
                          isModified ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Visibility toggle */}
                        <button
                          onClick={() => updateStyleVisibility(rule.originalIndex, !visible)}
                          className={`w-5 h-5 flex items-center justify-center border rounded transition-all duration-200 ${
                            visible
                              ? 'bg-white/20 border-white/50 text-white'
                              : 'bg-black/20 border-white/20 text-white/30'
                          }`}
                          title={visible ? '숨기기' : '보이기'}
                        >
                          {visible ? '✓' : ''}
                        </button>

                        {/* Element type label */}
                        <div className='flex-1 min-w-0'>
                          <div className='text-xs font-medium truncate flex items-center gap-1'>
                            {ELEMENT_TYPE_KR[rule.elementType] || rule.elementType}
                            {isModified && (
                              <span className='text-amber-400 text-[10px]' title='기본값에서 변경됨'>
                                ●
                              </span>
                            )}
                          </div>
                          {rule.description && <div className='text-xs opacity-60 truncate'>{rule.description}</div>}
                        </div>

                        {/* Color picker */}
                        {hasColor && (
                          <div className='relative group'>
                            <input
                              type='color'
                              value={color}
                              onChange={(e) => updateStyleColor(rule.originalIndex, e.target.value)}
                              className='w-8 h-8 rounded-md border border-white/30 cursor-pointer bg-transparent'
                              title='색상 변경'
                            />
                            <div className='absolute bottom-full right-0 mb-1 px-2 py-1 bg-black/80 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap'>
                              {color}
                            </div>
                          </div>
                        )}

                        {/* Reset button */}
                        {isModified && (
                          <button
                            onClick={() => resetStyle(rule.originalIndex)}
                            className='w-6 h-6 flex items-center justify-center border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 rounded transition-all duration-200 text-amber-200 text-xs'
                            title='이 항목을 기본값으로 되돌리기'
                          >
                            ↺
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {Object.keys(filteredGroups).length === 0 && (
          <div className='flex items-center justify-center h-32 text-white/50 text-sm'>검색 결과가 없습니다</div>
        )}
      </div>

      {/* Footer info */}
      <div className='border-t border-white/30 px-3 py-2 text-xs opacity-60'>
        총 {styles.length}개 규칙 · {Object.keys(filteredGroups).length}개 그룹
      </div>
    </div>
  )
}
