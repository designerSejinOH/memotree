import Link from 'next/link'

export default async function Home() {
  return (
    <>
      <main className='w-full h-dvh overflow-hidden'>
        홈 페이지입니다.
        <Link href='/map'>지도 페이지로 이동</Link>
      </main>
    </>
  )
}
