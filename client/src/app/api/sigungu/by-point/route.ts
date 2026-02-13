import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat,lng are required numbers' }, { status: 400 })
  }

  const key = process.env.VWORLD_KEY
  const domain = process.env.VWORLD_DOMAIN

  // 디버깅: 환경변수 확인 (보안을 위해 일부만 표시)
  console.log('[ENV] VWORLD_KEY exists:', !!key)
  console.log('[ENV] VWORLD_KEY length:', key?.length || 0)
  console.log('[ENV] VWORLD_KEY preview:', key ? `${key.substring(0, 10)}...` : 'undefined')
  console.log('[ENV] VWORLD_DOMAIN:', domain || 'undefined')
  console.log(
    '[ENV] All env keys:',
    Object.keys(process.env).filter((k) => k.includes('VWORLD')),
  )

  if (!key) {
    console.error('[ENV] VWORLD_KEY is missing!')
    return NextResponse.json(
      {
        error: 'Missing VWORLD_KEY',
        debug: {
          hasKey: !!key,
          availableEnvKeys: Object.keys(process.env).filter((k) => k.includes('VWORLD')),
        },
      },
      { status: 500 },
    )
  }

  // VWorld API는 도메인 검증을 수행하므로 domain 파라미터가 필요할 수 있음
  if (!domain) {
    console.warn('[VWorld API] VWORLD_DOMAIN is not set. This may cause authentication failures.')
  }

  // level=sido 이면 시도 경계, 기본은 시군구
  const level = searchParams.get('level') ?? 'sigungu'
  const dataset = level === 'sido' ? 'LT_C_ADSIDO_INFO' : 'LT_C_ADSIGG_INFO'

  const upstream = new URL('https://api.vworld.kr/req/data')
  upstream.searchParams.set('service', 'data')
  upstream.searchParams.set('request', 'GetFeature')
  upstream.searchParams.set('version', '2.0')
  upstream.searchParams.set('data', dataset)
  upstream.searchParams.set('key', key)
  upstream.searchParams.set('format', 'json')
  upstream.searchParams.set('geomFilter', `POINT(${lng} ${lat})`)
  upstream.searchParams.set('size', '1')
  upstream.searchParams.set('page', '1')
  upstream.searchParams.set('geometry', 'true')
  upstream.searchParams.set('attribute', 'true')
  upstream.searchParams.set('crs', 'EPSG:4326') // 안전빵
  if (domain) upstream.searchParams.set('domain', domain)

  const res = await fetch(upstream.toString())
  const raw = await res.json().catch(() => null)

  // 디버깅: VWorld API 응답 로깅
  console.log('[VWorld API] Status:', res.status)
  console.log('[VWorld API] Response:', JSON.stringify(raw, null, 2))

  if (!res.ok || !raw) {
    console.error('[VWorld API] Error - Status:', res.status, 'Raw:', raw)
    return NextResponse.json(
      {
        error: 'Upstream error',
        status: res.status,
        raw,
        url: upstream.toString(),
      },
      { status: 502 },
    )
  }

  // VWorld API 에러 응답 체크
  if (raw?.response?.status === 'ERROR' || raw?.response?.error) {
    console.error('[VWorld API] API returned error:', raw.response)
    return NextResponse.json(
      {
        error: 'VWorld API error',
        message: raw.response?.error?.text || raw.response?.error || 'Unknown error',
        code: raw.response?.error?.code,
        raw,
      },
      { status: 502 },
    )
  }

  // ✅ 여기: featureCollection만 추출
  const fc =
    raw?.response?.result?.featureCollection ??
    raw?.result?.featureCollection ??
    raw?.response?.result ??
    raw?.result ??
    null

  if (!fc || !(fc.type === 'FeatureCollection' && Array.isArray(fc.features))) {
    console.error('[VWorld API] FeatureCollection not found. Raw shape:', Object.keys(raw ?? {}))
    return NextResponse.json(
      { error: 'FeatureCollection not found', rawShape: Object.keys(raw ?? {}), raw },
      { status: 502 },
    )
  }

  return NextResponse.json(fc)
}
