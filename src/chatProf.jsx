import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CHAT_PROFS } from './chatProfessors.js'
import { hitboxes, talk } from './talk.js'

// Shared behavior for professors you can chat with: click target, floating name tag,
// turning to face the student while chatting, and talking animation.

const PINK = '#ff4fa3'

export function textTex(lines, { w = 512, h = 160, bg = null, fg = PINK, font = 'bold 72px system-ui, sans-serif' } = {}) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  if (bg) {
    g.fillStyle = bg
    g.beginPath()
    g.roundRect(4, 4, w - 8, h - 8, 28)
    g.fill()
    g.strokeStyle = PINK
    g.lineWidth = 6
    g.stroke()
  }
  g.fillStyle = fg
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  lines.forEach((l, i) => {
    g.font = i === 0 ? font : 'bold 34px system-ui, sans-serif'
    g.fillText(l, w / 2, (h / (lines.length + 1)) * (i + 1))
  })
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Refs to attach to the avatar's parts, plus the per-frame face-the-student + talking animation. */
export function useChatProf(id, rotation, phase) {
  const refs = { root: useRef(), head: useRef(), mouth: useRef(), armL: useRef(), armR: useRef(), hit: useRef(), label: useRef() }
  const { camera } = useThree()
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    hitboxes.set(id, refs.hit.current)
    return () => hitboxes.delete(id)
  }, [id])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + phase
    const g = refs.root.current
    // face the student while chatting (or when they walk right up); otherwise scan the room
    g.getWorldPosition(tmp)
    const dx = camera.position.x - tmp.x
    const dz = camera.position.z - tmp.z
    const near = Math.hypot(dx, dz) < 3.5
    const target = talk.open === id || near ? Math.atan2(dx, dz) : rotation + Math.sin(t * 0.4) * 0.35
    let diff = target - g.rotation.y
    diff = Math.atan2(Math.sin(diff), Math.cos(diff)) // shortest way around
    g.rotation.y += diff * Math.min(1, dt * 4)
    if (import.meta.env.DEV) document.body.dataset[id] = `${g.rotation.y.toFixed(2)},${target.toFixed(2)}` // yaw,target for tests

    const talking = talk.open === id && performance.now() < talk.talkingUntil
    refs.mouth.current.scale.y = talking ? 0.008 + Math.abs(Math.sin(t * 14)) * 0.02 : 0.008
    refs.head.current.rotation.x = talking ? Math.sin(t * 5) * 0.06 : Math.sin(t * 0.8) * 0.02
    // hand gestures while talking, relaxed sway otherwise
    refs.armR.current.rotation.x = talking ? -0.6 - Math.abs(Math.sin(t * 3)) * 0.7 : -0.1 + Math.sin(t * 1.1) * 0.05
    refs.armL.current.rotation.x = talking ? -0.3 - Math.abs(Math.sin(t * 2.3 + 1)) * 0.4 : -0.05
    refs.label.current.visible = talk.open !== id
  })
  return refs
}

/** "Prof. X · click to chat" sprite above the head. */
export function NameTag({ id, tagRef, y = 2.12 }) {
  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: textTex([CHAT_PROFS[id]?.short || id, 'click to chat'], { bg: 'rgba(11,11,13,0.85)' }),
        depthTest: false,
        toneMapped: false,
      }),
    [id],
  )
  return <sprite ref={tagRef} material={mat} position={[0, y, 0]} scale={[0.75, 0.24, 1]} />
}

/** Invisible click target. Mouse-look mode aims with the crosshair (ProfessorPicker); touch mode taps here. */
export function ChatHitbox({ id, hitRef, onSelect, height = 1.95 }) {
  return (
    <mesh
      ref={hitRef}
      position={[0, height / 2, 0]}
      onClick={(e) => {
        if (document.pointerLockElement || e.distance > 8) return
        e.stopPropagation()
        onSelect?.(id)
      }}
    >
      <cylinderGeometry args={[0.42, 0.42, height, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
