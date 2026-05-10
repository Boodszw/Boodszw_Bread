'use client'

import { motion } from 'framer-motion'
import { useAeonStore } from '@/store/aeon'
import { ZONES } from '@/lib/zones'

export function SideIndicators() {
  const currentZone = useAeonStore((s) => s.currentZone)
  const navigateTo = useAeonStore((s) => s.navigateTo)

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 pointer-events-auto">
      {ZONES.map((zone, i) => {
        const isActive = i === currentZone
        return (
          <button
            key={zone.id}
            onClick={() => navigateTo(i)}
            className="group relative flex items-center justify-end gap-2"
          >
            <span className="text-[10px] font-mono opacity-0 group-hover:opacity-60 transition-opacity text-white/60">
              {i + 1}
            </span>
            <motion.div
              animate={{
                width: isActive ? 20 : 6,
                height: 6,
                backgroundColor: isActive ? zone.color : '#ffffff20',
              }}
              className="rounded-full"
              transition={{ duration: 0.3 }}
            />
          </button>
        )
      })}
    </div>
  )
}
