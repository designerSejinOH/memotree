// app/api/sigungu/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sigCd = searchParams.get('sig_cd')
  if (!sigCd) {
    return NextResponse.json({ error: 'sig_cd is required' }, { status: 400 })
  }

  // ✅ 서버 전용 env
  const key = process.env.VWORLD_KEY
  const domain = process.env.VWORLD_DOMAIN
  if (!key) {
    return NextResponse.json({ error: 'Missing VWORLD_KEY' }, { status: 500 })
  }

  const upstream = new URL('https://api.vworld.kr/req/data')
  upstream.searchParams.set('service', 'data')
  upstream.searchParams.set('request', 'GetFeature')
  upstream.searchParams.set('version', '2.0')
  upstream.searchParams.set('data', 'LT_C_ADSIGG_INFO')
  upstream.searchParams.set('key', key)
  upstream.searchParams.set('format', 'json')
  upstream.searchParams.set('attrFilter', `sig_cd:=:${sigCd}`)
  upstream.searchParams.set('geometry', 'true')
  upstream.searchParams.set('attribute', 'true')
  if (domain) upstream.searchParams.set('domain', domain)

  const res = await fetch(upstream.toString(), { method: 'GET' })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    return NextResponse.json({ error: 'Upstream error', status: res.status, data }, { status: 502 })
  }

  return NextResponse.json(data)
}
