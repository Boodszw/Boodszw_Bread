'use client'

import dynamic from 'next/dynamic'
import { TopHUD } from '@/components/TopHUD'
import { NavBar } from '@/components/NavBar'
import { SideIndicators } from '@/components/SideIndicators'
import { TransitOverlay } from '@/components/TransitOverlay'
import { ZoneDataPanel } from '@/components/ZoneDataPanel'

const AeonCanvas = dynamic(
  () => import('@/components/AeonCanvas').then((m) => m.AeonCanvas),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="fixed inset-0">
      <AeonCanvas />
      <TopHUD />
      <ZoneDataPanel />
      <NavBar />
      <SideIndicators />
      <TransitOverlay />
    </main>
  )
}
