// app/sigungu-demo/page.tsx
async function getSigungu(sigCd: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/sigungu?sig_cd=${encodeURIComponent(sigCd)}`,
    { cache: 'no-store' }, // 자주 바뀌면 no-store, 고정이면 force-cache 가능
  )
  if (!res.ok) throw new Error('Failed to fetch sigungu')
  return res.json()
}

export default async function Page() {
  const data = await getSigungu('11650')

  return (
    <main>
      <h1>Sigungu</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
    </main>
  )
}
