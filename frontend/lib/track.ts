import * as THREE from 'three'
import { ZONES } from './zones'

const points = ZONES.map((z) => z.position.clone())
points.push(ZONES[0].position.clone())

export const track = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)

export function getZoneT(index: number): number {
  return index / (ZONES.length)
}

export function getTangentAt(t: number): THREE.Vector3 {
  return track.getTangentAt(Math.min(Math.max(t, 0), 1))
}

export function getPointAt(t: number): THREE.Vector3 {
  return track.getPointAt(Math.min(Math.max(t, 0), 1))
}
