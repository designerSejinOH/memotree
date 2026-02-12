import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // 테스트 좌표 (서울시청)
  const lat = Number(searchParams.get('lat') || '37.5665')
  const lng = Number(searchParams.get('lng') || '126.9780')

  // 테스트할 도메인 (쿼리로 받거나 환경변수 사용)
  const testDomain = searchParams.get('testDomain') || process.env.VWORLD_DOMAIN || ''
  const useDomain = searchParams.get('useDomain') !== 'false' // 기본값: true

  const key = process.env.VWORLD_KEY
  if (!key) {
    return NextResponse.json({ error: 'Missing VWORLD_KEY' }, { status: 500 })
  }

  console.log('=== VWorld API Test ===')
  console.log('Test domain:', testDomain || '(none)')
  console.log('Use domain param:', useDomain)
  console.log('Coordinates:', lat, lng)

  // VWorld API 요청 생성
  const url = new URL('https://api.vworld.kr/req/data')
  url.searchParams.set('service', 'data')
  url.searchParams.set('request', 'GetFeature')
  url.searchParams.set('version', '2.0')
  url.searchParams.set('data', 'LT_C_ADSIGG_INFO')
  url.searchParams.set('key', key)
  url.searchParams.set('format', 'json')
  url.searchParams.set('geomFilter', `POINT(${lng} ${lat})`)
  url.searchParams.set('size', '1')
  url.searchParams.set('geometry', 'false') // 테스트니까 geometry는 생략
  url.searchParams.set('attribute', 'true')

  // domain 파라미터 테스트
  if (useDomain && testDomain) {
    url.searchParams.set('domain', testDomain)
  }

  console.log('Request URL:', url.toString())

  // 타임아웃 설정
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  let res: Response
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
    })
  } catch (err: any) {
    clearTimeout(timeoutId)
    console.error('Fetch error:', err.message)
    return NextResponse.json({
      error: 'Fetch failed',
      message: err.message,
      testConfig: {
        useDomain,
        testDomain: testDomain || '(none)',
        lat,
        lng,
      },
    }, { status: 502 })
  }
  clearTimeout(timeoutId)

  const rawText = await res.text()
  let data: any = null

  try {
    data = JSON.parse(rawText)
  } catch (err) {
    console.error('JSON parse error')
    return NextResponse.json({
      error: 'Invalid JSON response',
      rawText: rawText.substring(0, 500),
      testConfig: {
        useDomain,
        testDomain: testDomain || '(none)',
        lat,
        lng,
      },
    }, { status: 502 })
  }

  console.log('Response status:', res.status)
  console.log('VWorld API response:', JSON.stringify(data, null, 2))

  // 결과 반환
  return NextResponse.json({
    success: data?.response?.status === 'OK',
    testConfig: {
      useDomain,
      testDomain: testDomain || '(none)',
      lat,
      lng,
    },
    vworldResponse: data,
  })
}
