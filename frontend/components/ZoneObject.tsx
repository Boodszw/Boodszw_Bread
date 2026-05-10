'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { Zone } from '@/lib/zones'

const geometries = [
  () => new THREE.IcosahedronGeometry(1.2, 1),
  () => new THREE.OctahedronGeometry(1.2, 0),
  () => new THREE.TorusKnotGeometry(0.8, 0.3, 64, 16),
  () => new THREE.DodecahedronGeometry(1.1, 0),
  () => new THREE.TetrahedronGeometry(1.3, 1),
  () => new THREE.TorusGeometry(0.9, 0.35, 16, 32),
  () => new THREE.ConeGeometry(0.9, 1.8, 6),
  () => new THREE.BoxGeometry(1.4, 1.4, 1.4),
]

export function ZoneObject({
  zone,
  index,
  isActive,
}: {
  zone: Zone
  index: number
  isActive: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => geometries[index % geometries.length](), [index])
  const color = new THREE.Color(zone.color)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.3
    meshRef.current.rotation.x += delta * 0.1
    const scale = isActive ? 1.3 : 1
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.05)
  })

  return (
    <group position={zone.position}>
      <mesh ref={meshRef} geometry={geo}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.8 : 0.3}
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>

      <pointLight color={zone.color} intensity={isActive ? 4 : 1.5} distance={12} />

      <Billboard position={[0, 2.2, 0]}>
        <Text
          fontSize={0.45}
          color={zone.color}
          anchorX="center"
          anchorY="middle"
          font="/fonts/geist-mono.woff"
        >
          {zone.name}
        </Text>
      </Billboard>

      <Billboard position={[0, 1.6, 0]}>
        <Text
          fontSize={0.2}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          {zone.description}
        </Text>
      </Billboard>
    </group>
  )
}
