'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAeonStore } from '@/store/aeon'
import { ZONES } from '@/lib/zones'

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
      }
    }, 25)
    return () => clearInterval(interval)
  }, [text])

  return (
    <span>
      {displayed}
      <span className="animate-pulse">_</span>
    </span>
  )
}

export function TopHUD() {
  const currentZone = useAeonStore((s) => s.currentZone)
  const agentVoice = useAeonStore((s) => s.agentVoice)
  const inTransit = useAeonStore((s) => s.inTransit)
  const zone = ZONES[currentZone]

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: zone.color }}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={zone.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-sm font-mono tracking-widest"
              style={{ color: zone.color }}
            >
              {zone.name}
            </motion.span>
          </AnimatePresence>
        </div>

        {inTransit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-mono text-white/30 tracking-wider"
          >
            IN TRANSIT
          </motion.div>
        )}

        <div className="text-xs font-mono text-white/20">
          AEON v1.0
        </div>
      </div>

      <div className="px-6 max-w-2xl">
        <div className="text-sm font-mono text-white/60 leading-relaxed">
          <TypewriterText text={agentVoice} />
        </div>
      </div>
    </div>
  )
}
