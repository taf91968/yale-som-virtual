import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { hitboxes, talk } from './talk.js'

const REACH = 6 // meters: how close you must be to start a chat

// In mouse-look mode the cursor is locked, so we aim with the crosshair: every frame, cast a ray
// from the screen center at the clickable professors. A click while aimed opens their chat.
export default function ProfessorPicker({ onAim, onSelect }) {
  const { camera } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const center = useMemo(() => new THREE.Vector2(0, 0), [])

  useFrame(() => {
    let aimed = null
    if (!talk.open && hitboxes.size) {
      ray.setFromCamera(center, camera)
      ray.far = REACH
      for (const [id, mesh] of hitboxes) {
        if (mesh && ray.intersectObject(mesh, false).length) {
          aimed = id
          break
        }
      }
    }
    if (aimed !== talk.aimed) {
      talk.aimed = aimed
      onAim(aimed)
    }
  })

  useEffect(() => {
    const click = (e) => {
      if (e.button === 0 && document.pointerLockElement && talk.aimed) onSelect(talk.aimed)
    }
    window.addEventListener('mousedown', click)
    return () => window.removeEventListener('mousedown', click)
  }, [onSelect])
  return null
}
