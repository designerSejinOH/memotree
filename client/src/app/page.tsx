// page.tsx

'use client'

import classNames from 'classnames'
import { Map, Screen } from '@/components'
import LiveLocationLayer from '@/components/Map/LiveLocationLayer'

export default function Page() {
  return (
    <Screen className={classNames('')}>
      <Map defaultCenter={null} defaultZoom={15}>
        <LiveLocationLayer />
      </Map>
    </Screen>
  )
}
