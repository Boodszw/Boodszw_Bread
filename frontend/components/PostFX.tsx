'use client'

import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useAeonStore } from '@/store/aeon'
import * as THREE from 'three'

export function PostFX() {
  const inTransit = useAeonStore((s) => s.inTransit)

  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        intensity={1.5}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={
          inTransit
            ? new THREE.Vector2(0.003, 0.003)
            : new THREE.Vector2(0, 0)
        }
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette
        offset={0.3}
        darkness={inTransit ? 0.8 : 0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
