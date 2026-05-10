'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAeonStore } from '@/store/aeon'
import { ZONES } from '@/lib/zones'

export function TransitOverlay() {
  const inTransit = useAeonStore((s) => s.inTransit)
  const targetZone = useAeonStore((s) => s.targetZone)
  const target = ZONES[targetZone]

  return (
    <AnimatePresence>
      {inTransit && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, transparent 40%, ${target.color}08 100%)`,
            }}
          />

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="fixed bottom-0 left-0 right-0 h-[2px] z-50 origin-left"
            style={{ backgroundColor: target.color }}
          />
        </>
      )}
    </AnimatePresence>
  )
}
