// Google Maps JavaScript API (Embedded/Legacy) 스타일 JSON
// 타입: google.maps.MapTypeStyle[]
//
// ✅ 이 파일의 목적
// - “내가 하나씩 켜보고/끄면서 실험”하기 좋게
//   featureType + elementType 조합을 **가능한 범위 내에서 최대한 풀로 나열**해둔 템플릿
// - 각 항목마다 “무엇을 바꾸는지” 주석을 붙여둠
//
// ⚠️ 참고
// - Embedded(JSON) 스타일에서 가능한 featureType / elementType / stylers는 문서에 정의된 범위가 정해져 있음.
// - style rule은 "위에서 아래로" 적용되므로, 아래쪽에 있는 규칙이 같은 타겟을 덮어씀.
// - JSON 자체는 주석이 불가하므로, TS/JS 배열 형태로 제공함.

export const mapStyle: google.maps.MapTypeStyle[] = [
  // ─────────────────────────────────────────────────────────────
  // 0) GLOBAL: 전체 기본값 / 디버깅하기 좋은 “기본 스위치”들
  // ─────────────────────────────────────────────────────────────

  {
    featureType: 'all',
    elementType: 'all',
    stylers: [
      // 전체 지오메트리(바탕) 통합 튜닝용
      // { saturation: -100 }, // 전체 채도 (-100 ~ 100)
      // { lightness: 100 }, // 전체 밝기 (-100 ~ 100)
      // { gamma: 5.0 }, // 감마 (0.01 ~ 10)
      // { invert_lightness: true }, // 밝기 반전 (true/false) — 스타일에 따라 유용
    ],
  },

  {
    featureType: 'all',
    elementType: 'labels',
    stylers: [
      // ✅ "지도 라벨(텍스트+아이콘) 전체" 표시 여부
      { visibility: 'off' }, // 전부 끄기 (POI/도로명/지명 전부 사라짐)
      // { visibility: 'on' }, // 전부 켜기
      // { visibility: 'simplified' }, // 일부 단순화 (상황에 따라 차이 큼)
    ],
  },

  {
    featureType: 'all',
    elementType: 'labels.icon',
    stylers: [
      // ✅ “아이콘만” 켜고/끄기 (텍스트는 유지 가능)
      { visibility: 'off' }, // 아이콘 전부 숨김
      // { visibility: 'on' },
    ],
  },

  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [
      // ✅ 모든 라벨 텍스트의 "글자색"
      { visibility: 'off' },
    ],
  },

  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [
      // ✅ 모든 라벨 텍스트의 "외곽선(스트로크)" — 가독성에 큰 영향
      { visibility: 'off' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 1) WATER: 강/바다/호수
  // ─────────────────────────────────────────────────────────────

  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      // ✅ 물 영역 자체(면/선)의 색/밝기
      // { color: '#dbe9ff' },
      { visibility: 'on' },
    ],
  },
  {
    featureType: 'water',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  // ─────────────────────────────────────────────────────────────
  // 2) ROAD: 도로 (전체 + 하위 타입)
  // ─────────────────────────────────────────────────────────────

  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      // ✅ 모든 도로 “바디(라인/면)” 공통 스타일
      { visibility: 'on' },
      { color: '#ffffff' },
      // { weight: 1 }, // 도로 두께 느낌 조정
    ],
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [
      // ✅ 도로 이름 라벨(예: Teheran-ro)
      { visibility: 'off' },
    ],
  },

  // road.arterial: 큰 일반도로(간선도로)
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [
      // ✅ 간선도로 바디
      { color: '#ffffff' },
      { visibility: 'on' },
    ],
  },

  // road.highway: 고속도로
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      // ✅ 고속도로 바디
      { color: '#ffffff' },
      { visibility: 'on' },
    ],
  },

  // road.highway.controlled_access: 진출입 통제 고속도로(더 “고속도로” 같은 애들)
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [
      // ✅ 통제도로 바디
      { color: '#ffffff' },
      { visibility: 'on' },
    ],
  },

  // road.local: 골목/동네길
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [
      // ✅ 동네길 바디
      { color: '#ffffff' },
      { visibility: 'on' },
    ],
  },

  // 도로 라벨 아이콘만 끄기 (도로명 텍스트는 유지 가능)
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [
      { visibility: 'off' },
      // { visibility: 'on' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3) LANDSCAPE: 지형/땅 (전체 + 하위 타입)
  // ─────────────────────────────────────────────────────────────

  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      // ✅ 전체 지형 바탕(땅)
      { visibility: 'on' },
      { color: '#f7f7f7' },
    ],
  },

  // landscape.man_made: 인공 지형(빌딩/포장 등)
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [
      // ✅ 인공 지형 바탕
      { visibility: 'on' },
      // { color: '#f6f6f6' },
    ],
  },

  // landscape.natural: 자연 지형(산/숲 등)
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [
      // ✅ 자연 지형 바탕
      { visibility: 'on' }, // ✅ (오타 주의: visibility)
      // { color: '#eef3ee' },
    ],
  },

  // landscape.natural.landcover: 자연 지형 중 “식생/피복”
  {
    featureType: 'landscape.natural.landcover',
    elementType: 'geometry',
    stylers: [
      { visibility: 'on' },
      // { color: '#e9f2e6' },
    ],
  },

  // landscape.natural.terrain: 자연 지형 중 “지형(기복/산지)”
  {
    featureType: 'landscape.natural.terrain',
    elementType: 'geometry',
    stylers: [
      { visibility: 'on' },
      // { color: '#edf0ed' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4) POI: 장소/시설 (전체 + 하위 타입)
  // ─────────────────────────────────────────────────────────────

  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [
      // ✅ 모든 POI(카페/식당/기관/공원 등) 표시 여부
      { visibility: 'off' },
    ],
  },
  // 건물 관련 라벨 완전히 제거
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  // 공원(park)
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      // ✅ 공원 영역(면) 색
      { visibility: 'on' },
      { color: '#e3f2e1' },
    ],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels',
    stylers: [
      // ✅ 공원 이름 라벨
      { visibility: 'off' },
    ],
  },

  // 건물/비즈니스 이름 전부 제거
  {
    featureType: 'poi.business',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },

  // 비즈니스 POI(가게/식당 등)
  {
    featureType: 'poi.business',
    elementType: 'labels',
    stylers: [
      // ✅ “가게 이름”만 끄는 대표적인 패턴
      { visibility: 'off' },
    ],
  },

  // 나머지 POI 세부 타입들 (필요한 것만 on/off 해보면 됨)
  {
    featureType: 'poi.attraction',
    elementType: 'all',
    stylers: [
      // ✅ 관광명소
      { visibility: 'off' },
    ],
  },
  // 랜드마크 건물도 제거
  {
    featureType: 'poi.attraction',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  {
    featureType: 'poi.government',
    elementType: 'all',
    stylers: [
      // ✅ 정부/공공기관
      { visibility: 'off' },
    ],
  },
  {
    featureType: 'poi.medical',
    elementType: 'all',
    stylers: [
      // ✅ 병원/의료시설
      { visibility: 'off' },
    ],
  },
  {
    featureType: 'poi.place_of_worship',
    elementType: 'all',
    stylers: [
      // ✅ 종교시설
      { visibility: 'off' },
    ],
  },
  {
    featureType: 'poi.school',
    elementType: 'all',
    stylers: [
      // ✅ 학교
      { visibility: 'off' },
    ],
  },
  {
    featureType: 'poi.sports_complex',
    elementType: 'all',
    stylers: [
      // ✅ 스포츠 시설
      { visibility: 'off' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5) ADMINISTRATIVE: 행정 정보(국가/도/시/동 등)
  // ─────────────────────────────────────────────────────────────
  //
  // ⚠️ 주의:
  // - Embedded 스타일에서 administrative은 “라벨 요소”에 대한 스타일링이 핵심인 경우가 많고,
  //   "경계선(geometry)" 기대처럼 동작하지 않을 수 있음.
  // - 그래도 실험을 위해 가능한 타겟을 다 열어둠.

  {
    featureType: 'administrative',
    elementType: 'labels',
    stylers: [
      // ✅ 전체 행정 라벨(지역명 등)
      { visibility: 'off' },
    ],
  },

  // administrative.country: 국가 라벨
  {
    featureType: 'administrative.country',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  // administrative.province: 도/광역시급 라벨
  {
    featureType: 'administrative.province',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  // administrative.locality: 시/구/지역 라벨(가장 자주 보이는 도시명 레벨)
  {
    featureType: 'administrative.locality',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  // administrative.neighborhood: 동네/구역 라벨(더 촘촘)
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  // administrative.land_parcel: 지번/필지 라벨(엄청 촘촘 — 보통 끄는 편)
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  // (실험용) administrative geometry — 기대대로 안 먹을 수 있음
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [
      // ✅ 행정 경계 “선/면” 느낌을 바꿔보고 싶을 때
      { visibility: 'on' },
      // { color: '#dddddd' },
      // { weight: 1 },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6) TRANSIT: 대중교통(지하철/버스/철도)
  // ─────────────────────────────────────────────────────────────

  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [
      // ✅ 대중교통 전체(노선/역) 표시 여부
      { visibility: 'off' },
    ],
  },

  // transit.line: 노선(라인)만 따로
  {
    featureType: 'transit.line',
    elementType: 'all',
    stylers: [
      // ✅ 지하철/철도 라인
      // { visibility: 'on' },
      { visibility: 'off' },
    ],
  },

  // transit.station: 역 전체(공항/버스/레일 포함)
  {
    featureType: 'transit.station',
    elementType: 'all',
    stylers: [
      // ✅ 역 아이콘/라벨
      // { visibility: 'on' },
      { visibility: 'off' },
    ],
  },

  // 세부 역 타입들
  {
    featureType: 'transit.station.airport',
    elementType: 'all',
    stylers: [
      // ✅ 공항
      // { visibility: 'on' },
      { visibility: 'off' },
    ],
  },
  {
    featureType: 'transit.station.bus',
    elementType: 'all',
    stylers: [
      // ✅ 버스 정류장
      // { visibility: 'on' },
      { visibility: 'off' },
    ],
  },
  {
    featureType: 'transit.station.rail',
    elementType: 'all',
    stylers: [
      // ✅ 철도/지하철역
      // { visibility: 'on' },
      { visibility: 'off' },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 7) OPTIONAL: “모노톤/미니멀” 실험용 블록 (원하면 아래쪽으로 내려서 강제 적용)
  // ─────────────────────────────────────────────────────────────

  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [
      // ✅ 전체 바탕을 한번에 모노톤/톤다운하고 싶을 때
      // { saturation: -100 },
      // { lightness: 10 },
      // { gamma: 1.1 },
    ],
  },
]
