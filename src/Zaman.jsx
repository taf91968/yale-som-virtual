import { useMemo } from 'react'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import { ChatHitbox, NameTag, textTex, useChatProf } from './chatProf.jsx'

// Prof. Tauhid Zaman (MGT 409): black BLACKPINK hoodie, jeans, sneakers, glasses, and a Labubu
// keychain hanging from his belt loop. Built from primitives like the other professors.
// Figure faces +z. Clicking him opens the chat; while you talk he turns to face you.

const SKIN = '#b98256' // light brown
const HAIR = '#141012'
const HOODIE = '#131316'
const PINK = '#ff4fa3'
const JEANS = '#2c3e5c'

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
const TORUS = new THREE.TorusGeometry(1, 0.13, 8, 24)
const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

export default function Zaman({ id = 'zaman', position = [0, 0, 0], rotation = 0, phase = 0, onSelect }) {
  const { root, head, mouth, armL, armR, hit, label } = useChatProf(id, rotation, phase)
  const chest = useMemo(() => new THREE.MeshBasicMaterial({ map: textTex(['BLACKPINK'], { h: 128 }), transparent: true, toneMapped: false }), [])
  const hoodie = m(HOODIE)
  const skin = m(SKIN)
  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]}>
      {/* sneakers */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={BOX} c="#f4f4f4" p={[0.1 * sx, 0.045, 0.04]} s={[0.12, 0.09, 0.28]} />
          <B g={BOX} c={PINK} p={[0.1 * sx, 0.012, 0.04]} s={[0.125, 0.025, 0.285]} />
        </group>
      ))}
      {/* jeans */}
      {[-1, 1].map((sx) => (
        <B key={sx} g={CYL} c={JEANS} p={[0.1 * sx, 0.5, 0]} s={[0.082, 0.84, 0.085]} />
      ))}
      <B g={CYL} c={JEANS} p={[0, 0.9, 0]} s={[0.19, 0.12, 0.13]} />
      <B g={BOX} c="#1b1b1b" p={[0, 0.93, 0]} s={[0.39, 0.035, 0.27]} />
      {/* hoodie body, front pocket, BLACKPINK chest print, hood, pink drawstrings */}
      <mesh geometry={CAP} material={hoodie} position={[0, 1.2, 0]} scale={[0.225, 0.2, 0.15]} />
      <B g={BOX} c="#1c1c21" p={[0, 1.05, 0.143]} s={[0.24, 0.13, 0.02]} />
      <mesh material={chest} position={[0, 1.28, 0.151]}>
        <planeGeometry args={[0.3, 0.075]} />
      </mesh>
      <B c={HOODIE} p={[0, 1.5, -0.09]} s={[0.17, 0.12, 0.11]} />
      <B g={TORUS} c={HOODIE} p={[0, 1.47, 0.0]} r={[Math.PI / 2, 0, 0]} s={[0.12, 0.11, 0.25]} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={CYL} c={PINK} p={[0.04 * sx, 1.37, 0.15]} s={[0.006, 0.14, 0.006]} />
          <B c="#ffffff" p={[0.04 * sx, 1.3, 0.152]} s={[0.01, 0.014, 0.01]} />
        </group>
      ))}
      {/* arms: sleeves + light-brown hands */}
      <group ref={armR} position={[-0.27, 1.38, 0]} rotation={[0, 0, -0.12]}>
        <mesh geometry={CAP} material={hoodie} position={[0, -0.22, 0]} scale={[0.07, 0.19, 0.07]} />
        <B c={HOODIE} p={[0, -0.44, 0]} s={[0.06, 0.03, 0.06]} />
        <mesh geometry={SPH} material={skin} position={[0, -0.5, 0.01]} scale={[0.045, 0.055, 0.04]} />
      </group>
      <group ref={armL} position={[0.27, 1.38, 0]} rotation={[0, 0, 0.12]}>
        <mesh geometry={CAP} material={hoodie} position={[0, -0.22, 0]} scale={[0.07, 0.19, 0.07]} />
        <B c={HOODIE} p={[0, -0.44, 0]} s={[0.06, 0.03, 0.06]} />
        <mesh geometry={SPH} material={skin} position={[0, -0.5, 0.01]} scale={[0.045, 0.055, 0.04]} />
      </group>
      {/* Labubu keychain on the right belt loop */}
      <B g={TORUS} c="#c9c9c9" o={{ metalness: 0.9, roughness: 0.25 }} p={[-0.17, 0.9, 0.11]} s={[0.022, 0.022, 0.022]} />
      <B g={CYL} c="#c9c9c9" o={{ metalness: 0.9, roughness: 0.25 }} p={[-0.17, 0.84, 0.115]} s={[0.003, 0.1, 0.003]} />
      <Labubu fur="#f2a7c8" expression="mischief" shirt="#111111" height={0.17} position={[-0.17, 0.62, 0.12]} phase={phase} />
      {/* neck + head */}
      <B g={CYL} c={SKIN} p={[0, 1.5, 0]} s={[0.05, 0.08, 0.05]} />
      <group ref={head} position={[0, 1.64, 0]}>
        <B c={SKIN} p={[0, 0, 0]} s={[0.11, 0.13, 0.12]} />
        {[-1, 1].map((sx) => (
          <B key={sx} c={SKIN} p={[0.112 * sx, 0, 0]} s={[0.02, 0.034, 0.02]} />
        ))}
        {/* short black hair + fade */}
        <B c={HAIR} p={[0, 0.06, -0.01]} s={[0.117, 0.085, 0.125]} />
        <B c={HAIR} p={[0, 0.095, 0.04]} r={[0.35, 0, 0]} s={[0.1, 0.04, 0.08]} />
        {/* eyes, brows, glasses */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B c="#ffffff" p={[0.042 * sx, 0.02, 0.105]} s={[0.02, 0.016, 0.01]} />
            <B c="#1d1410" p={[0.042 * sx, 0.02, 0.113]} s={[0.01, 0.011, 0.006]} />
            <B g={BOX} c={HAIR} p={[0.044 * sx, 0.05, 0.11]} r={[0, 0, -0.12 * sx]} s={[0.042, 0.01, 0.01]} />
            <B g={TORUS} c="#111111" p={[0.045 * sx, 0.02, 0.122]} s={[0.032, 0.026, 0.032]} />
          </group>
        ))}
        <B g={BOX} c="#111111" p={[0, 0.025, 0.124]} s={[0.025, 0.005, 0.005]} />
        <B c={SKIN} p={[0, -0.01, 0.12]} s={[0.02, 0.028, 0.022]} />
        {/* light stubble + mouth (opens while talking) */}
        <B c="#3a2a22" p={[0, -0.075, 0.07]} s={[0.085, 0.045, 0.055]} o={{ transparent: true, opacity: 0.35 }} />
        <mesh ref={mouth} geometry={BOX} material={m('#5a2a26')} position={[0, -0.05, 0.112]} scale={[0.05, 0.008, 0.008]} />
      </group>
      <NameTag id={id} tagRef={label} />
      <ChatHitbox id={id} hitRef={hit} onSelect={onSelect} />
    </group>
  )
}
