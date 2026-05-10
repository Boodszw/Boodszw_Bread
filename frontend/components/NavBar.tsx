'use client'

import { motion } from 'framer-motion'
import { useAeonStore } from '@/store/aeon'
import { ZONES } from '@/lib/zones'

export function NavBar() {
  const currentZone = useAeonStore((s) => s.currentZone)
  const inTransit = useAeonStore((s) => s.inTransit)
  const navigateTo = useAeonStore((s) => s.navigateTo)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto">
      <div className="flex items-center justify-center gap-1 p-4 pb-6">
        {ZONES.map((zone, i) => {
          const isActive = i === currentZone
          return (
            <motion.button
              key={zone.id}
              onClick={() => navigateTo(i)}
              disabled={inTransit}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative px-3 py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
              style={{
                backgroundColor: isActive
                  ? `${zone.color}15`
                  : 'transparent',
                border: `1px solid ${isActive ? zone.color + '40' : '#ffffff10'}`,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-lg"
                  style={{ color: isActive ? zone.color : '#ffffff30' }}
                >
                  {zone.icon}
                </span>
                <span
                  className="text-[10px] font-mono tracking-wider"
                  style={{
                    color: isActive ? zone.color : '#ffffff30',
                  }}
                >
                  {zone.name}
                </span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="activeZone"
                  className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full -translate-x-1/2"
                  style={{ backgroundColor: zone.color }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
