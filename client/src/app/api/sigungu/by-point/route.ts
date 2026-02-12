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
  if (!key) return NextResponse.json({ error: 'Missing VWORLD_KEY' }, { status: 500 })

  const upstream = new URL('https://api.vworld.kr/req/data')
  upstream.searchParams.set('service', 'data')
  upstream.searchParams.set('request', 'GetFeature')
  upstream.searchParams.set('version', '2.0')
  upstream.searchParams.set('data', 'LT_C_ADSIGG_INFO')
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

  if (!res.ok || !raw) {
    return NextResponse.json({ error: 'Upstream error', status: res.status, raw }, { status: 502 })
  }

  // ✅ 여기: featureCollection만 추출
  const fc =
    raw?.response?.result?.featureCollection ??
    raw?.result?.featureCollection ??
    raw?.response?.result ??
    raw?.result ??
    null

  if (!fc || !(fc.type === 'FeatureCollection' && Array.isArray(fc.features))) {
    return NextResponse.json(
      { error: 'FeatureCollection not found', rawShape: Object.keys(raw ?? {}), raw },
      { status: 502 },
    )
  }

  return NextResponse.json(fc)
}
