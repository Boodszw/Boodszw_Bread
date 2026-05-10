'use client'

import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES } from '@/lib/zones'
import { track, getZoneT, getPointAt, getTangentAt } from '@/lib/track'
import { useAeonStore } from '@/store/aeon'
import { ZoneObject } from './ZoneObject'

function TrackLine() {
  const ref = useRef<THREE.Line>(null)

  useEffect(() => {
    if (!ref.current) return
    const points = track.getPoints(200)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    ref.current.geometry = geometry
  }, [])

  return (
    <primitive
      ref={ref}
      object={new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: '#222233', transparent: true, opacity: 0.3 })
      )}
    />
  )
}

function CameraRig() {
  const { camera } = useThree()
  const currentT = useRef(0)
  const currentZone = useAeonStore((s) => s.currentZone)
  const targetZone = useAeonStore((s) => s.targetZone)
  const inTransit = useAeonStore((s) => s.inTransit)
  const finishTransit = useAeonStore((s) => s.finishTransit)
  const setAgentVoice = useAeonStore((s) => s.setAgentVoice)

  const targetT = inTransit ? getZoneT(targetZone) : getZoneT(currentZone)

  useFrame((_, delta) => {
    const speed = 2.5
    const diff = targetT - currentT.current
    const step = diff * speed * delta

    if (Math.abs(diff) > 0.001) {
      currentT.current += step
    } else if (inTransit) {
      currentT.current = targetT
      finishTransit()
      setAgentVoice(`Arrived at ${ZONES[targetZone].name}. ${ZONES[targetZone].description}.`)
    }

    const clampedT = Math.min(Math.max(currentT.current, 0), 0.999)
    const pos = getPointAt(clampedT)
    const tangent = getTangentAt(clampedT)

    const offset = new THREE.Vector3()
    offset.copy(tangent).multiplyScalar(5)
    const lookTarget = pos.clone().add(offset)

    camera.position.lerp(
      new THREE.Vector3(pos.x, pos.y + 1.5, pos.z + 4),
      0.08
    )
    camera.lookAt(lookTarget)
  })

  return null
}

export function Scene() {
  const currentZone = useAeonStore((s) => s.currentZone)
  const navigateTo = useAeonStore((s) => s.navigateTo)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        navigateTo(Math.min(currentZone + 1, ZONES.length - 1))
      } else if (e.key === 'ArrowLeft') {
        navigateTo(Math.max(currentZone - 1, 0))
      } else {
        const num = parseInt(e.key)
        if (num >= 1 && num <= ZONES.length) {
          navigateTo(num - 1)
        }
      }
    },
    [currentZone, navigateTo]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      <color attach="background" args={['#050508']} />
      <fog attach="fog" args={['#050508', 20, 60]} />
      <ambientLight intensity={0.15} />

      <Stars radius={80} depth={60} count={3000} factor={3} fade speed={0.5} />

      <CameraRig />
      <TrackLine />

      {ZONES.map((zone, i) => (
        <ZoneObject
          key={zone.id}
          zone={zone}
          index={i}
          isActive={i === currentZone}
        />
      ))}
    </>
  )
}
