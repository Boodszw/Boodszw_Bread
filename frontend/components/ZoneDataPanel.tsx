'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAeonStore } from '@/store/aeon'
import { ZONES } from '@/lib/zones'

export function ZoneDataPanel() {
  const currentZone = useAeonStore((s) => s.currentZone)
  const zoneData = useAeonStore((s) => s.zoneData)
  const inTransit = useAeonStore((s) => s.inTransit)
  const zone = ZONES[currentZone]
  const data = zoneData[zone.id]

  if (currentZone === 0 || !data || inTransit) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={zone.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ delay: 0.5 }}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
      >
        <div
          className="rounded-xl p-4 max-w-xs backdrop-blur-sm"
          style={{
            backgroundColor: '#0a0a0f90',
            border: `1px solid ${zone.color}20`,
          }}
        >
          <div
            className="text-xs font-mono tracking-wider mb-3"
            style={{ color: zone.color }}
          >
            {data.title}
          </div>

          <div className="space-y-1.5">
            {data.items.map((item, i) => (
              <div
                key={i}
                className="text-sm font-mono text-white/70 flex items-center gap-2"
              >
                <div
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-3 text-[10px] font-mono text-white/20">
            {zone.skills.join(' / ')}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
