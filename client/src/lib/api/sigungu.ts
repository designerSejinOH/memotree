// src/lib/api/sigungu.ts
export async function fetchSigunguByPoint(lat: number, lng: number) {
  const res = await fetch(`/api/sigungu/by-point?lat=${lat}&lng=${lng}`)
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`)
  return json
}
