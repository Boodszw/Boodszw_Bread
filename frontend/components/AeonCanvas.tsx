'use client'

import { Canvas } from '@react-three/fiber'
import { Scene } from './Scene'
import { PostFX } from './PostFX'

export function AeonCanvas() {
  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 200, position: [0, 1.5, 4] }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <Scene />
      <PostFX />
    </Canvas>
  )
}
