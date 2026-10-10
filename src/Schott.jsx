import * as THREE from 'three'
import { ChatHitbox, NameTag, useChatProf } from './chatProf.jsx'

// Prof. Peter Schott (MGT 407 Statistics, EMBA): light-blue button-down with an open collar and
// rolled sleeves, khaki chinos, brown shoes, wavy brown hair, light stubble, and a Totoro plush
// in his left hand. Same primitive style as the other professors. Figure faces +z.

const SKIN = '#e8bd9b'
const HAIR = '#5b3c25'
const SHIRT = '#bcd2ee'
const SHIRT_DARK = '#a9c1e2'
const CHINOS = '#c4ad84'
const SHOES = '#5a3920'

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
const CONE = new THREE.ConeGeometry(1, 1, 16)
const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

// a little gray forest spirit plush: egg body, cream belly with chevrons, pointy ears, big eyes, whiskers
function TotoroPlush({ position, rotation = [0, 0, 0], size = 0.15 }) {
  const gray = '#7c8089'
  const cream = '#efe6cf'
  return (
    <group position={position} rotation={rotation} scale={size}>
      <B c={gray} p={[0, 0.45, 0]} s={[0.42, 0.5, 0.38]} />
      <B c={cream} p={[0, 0.38, 0.18]} s={[0.32, 0.36, 0.22]} />
      {[[-0.12, 0.5], [0, 0.53], [0.12, 0.5], [-0.06, 0.4], [0.06, 0.4]].map(([x, y], i) => (
        <B key={i} g={CONE} c={gray} p={[x, y, 0.385]} r={[0, 0, Math.PI]} s={[0.035, 0.04, 0.01]} />
      ))}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={CONE} c={gray} p={[0.16 * sx, 1.0, -0.02]} r={[0, 0, -0.12 * sx]} s={[0.07, 0.24, 0.06]} />
          <B c="#ffffff" p={[0.13 * sx, 0.78, 0.29]} s={[0.075, 0.075, 0.03]} />
          <B c="#111111" p={[0.13 * sx, 0.78, 0.315]} s={[0.035, 0.035, 0.015]} />
          {[-0.03, 0.03].map((dy) => (
            <B key={dy} g={BOX} c="#2a2a2a" p={[0.27 * sx, 0.68 + dy, 0.27]} r={[0, 0, dy * 4 * sx]} s={[0.16, 0.006, 0.006]} />
          ))}
          <B c={gray} p={[0.33 * sx, 0.35, 0.05]} s={[0.1, 0.18, 0.1]} />
        </group>
      ))}
      <B c="#222222" p={[0, 0.72, 0.335]} s={[0.05, 0.025, 0.02]} />
      <B c="#2f2a24" p={[0, 0.64, 0.33]} s={[0.12, 0.012, 0.01]} />
    </group>
  )
}

export default function Schott({ id = 'schott', position = [0, 0, 0], rotation = 0, phase = 0, onSelect }) {
  const { root, head, mouth, armL, armR, hit, label } = useChatProf(id, rotation, phase)
  const shirt = m(SHIRT)
  const skin = m(SKIN)
  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]}>
      <group scale={1.04}>
        {/* brown shoes */}
        {[-1, 1].map((sx) => (
          <B key={sx} g={BOX} c={SHOES} p={[0.1 * sx, 0.04, 0.04]} s={[0.115, 0.08, 0.28]} />
        ))}
        {/* khaki chinos + belt */}
        {[-1, 1].map((sx) => (
          <B key={sx} g={CYL} c={CHINOS} p={[0.1 * sx, 0.5, 0]} s={[0.083, 0.84, 0.086]} />
        ))}
        <B g={CYL} c={CHINOS} p={[0, 0.9, 0]} s={[0.19, 0.12, 0.13]} />
        <B g={BOX} c="#4a2f1b" p={[0, 0.955, 0]} s={[0.385, 0.035, 0.265]} />
        <B g={BOX} c="#c9b07a" o={{ metalness: 0.7, roughness: 0.3 }} p={[0, 0.955, 0.135]} s={[0.04, 0.03, 0.01]} />
        {/* light-blue button-down: tucked in, chest pocket, buttons, open collar */}
        <mesh geometry={CAP} material={shirt} position={[0, 1.22, 0]} scale={[0.215, 0.2, 0.145]} />
        <B g={BOX} c={SHIRT_DARK} p={[0.08, 1.28, 0.143]} s={[0.075, 0.07, 0.008]} />
        {[1.08, 1.16, 1.24].map((y) => (
          <B key={y} c="#f4f6fa" p={[0, y, 0.147]} s={[0.008, 0.008, 0.004]} />
        ))}
        <B g={BOX} c={SKIN} p={[0, 1.4, 0.12]} r={[0, 0, Math.PI / 4]} s={[0.07, 0.07, 0.01]} />
        {[-1, 1].map((sx) => (
          <B key={sx} g={BOX} c={SHIRT} p={[0.06 * sx, 1.44, 0.11]} r={[-0.4, 0, 0.5 * sx]} s={[0.08, 0.045, 0.012]} />
        ))}
        {/* arms: short sleeves look from rolled cuffs, bare forearms */}
        <group ref={armR} position={[-0.26, 1.39, 0]} rotation={[0, 0, -0.12]}>
          <mesh geometry={CAP} material={shirt} position={[0, -0.14, 0]} scale={[0.068, 0.12, 0.068]} />
          <B g={CYL} c={SHIRT_DARK} p={[0, -0.27, 0]} s={[0.068, 0.04, 0.068]} />
          <mesh geometry={CAP} material={skin} position={[0, -0.38, 0]} scale={[0.048, 0.09, 0.048]} />
          <mesh geometry={SPH} material={skin} position={[0, -0.5, 0.01]} scale={[0.045, 0.055, 0.04]} />
        </group>
        <group ref={armL} position={[0.26, 1.39, 0]} rotation={[0, 0, 0.12]}>
          <mesh geometry={CAP} material={shirt} position={[0, -0.14, 0]} scale={[0.068, 0.12, 0.068]} />
          <B g={CYL} c={SHIRT_DARK} p={[0, -0.27, 0]} s={[0.068, 0.04, 0.068]} />
          <mesh geometry={CAP} material={skin} position={[0, -0.38, 0]} scale={[0.048, 0.09, 0.048]} />
          <mesh geometry={SPH} material={skin} position={[0, -0.5, 0.01]} scale={[0.045, 0.055, 0.04]} />
          <TotoroPlush position={[0, -0.6, 0.06]} size={0.17} />
        </group>
        {/* neck + head */}
        <B g={CYL} c={SKIN} p={[0, 1.5, 0]} s={[0.05, 0.08, 0.05]} />
        <group ref={head} position={[0, 1.645, 0]}>
          <B c={SKIN} p={[0, 0, 0]} s={[0.108, 0.135, 0.118]} />
          {[-1, 1].map((sx) => (
            <B key={sx} c={SKIN} p={[0.11 * sx, 0, 0]} s={[0.02, 0.034, 0.02]} />
          ))}
          {/* wavy brown hair, fuller on top and swept back */}
          <B c={HAIR} p={[0, 0.07, -0.015]} s={[0.118, 0.085, 0.128]} />
          {[[-0.06, 0.115, 0.04], [0.0, 0.125, 0.055], [0.06, 0.11, 0.035], [-0.03, 0.12, -0.02], [0.04, 0.12, -0.03], [0.0, 0.1, -0.08]].map(
            ([x, y, z], i) => (
              <B key={i} c={HAIR} p={[x, y, z]} s={[0.055, 0.045, 0.055]} />
            ),
          )}
          {[-1, 1].map((sx) => (
            <B key={sx} c={HAIR} p={[0.1 * sx, 0.04, -0.02]} s={[0.035, 0.06, 0.07]} />
          ))}
          {/* blue-gray eyes, brows, nose */}
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <B c="#ffffff" p={[0.042 * sx, 0.02, 0.103]} s={[0.02, 0.014, 0.01]} />
              <B c="#5d7a8c" p={[0.042 * sx, 0.02, 0.111]} s={[0.01, 0.01, 0.006]} />
              <B g={BOX} c={HAIR} p={[0.044 * sx, 0.045, 0.108]} r={[0, 0, 0.1 * sx]} s={[0.045, 0.011, 0.01]} />
            </group>
          ))}
          <B c={SKIN} p={[0, -0.01, 0.118]} s={[0.02, 0.03, 0.022]} />
          {/* stubble + easy grin (mouth opens while talking) */}
          <B c="#6b4a35" p={[0, -0.07, 0.065]} s={[0.088, 0.05, 0.06]} o={{ transparent: true, opacity: 0.3 }} />
          <mesh ref={mouth} geometry={BOX} material={m('#7a3a33')} position={[0, -0.052, 0.11]} scale={[0.055, 0.008, 0.008]} />
          {[-1, 1].map((sx) => (
            <B key={sx} g={BOX} c="#7a3a33" p={[0.03 * sx, -0.047, 0.108]} r={[0, 0, 0.5 * sx]} s={[0.014, 0.006, 0.006]} />
          ))}
        </group>
      </group>
      <NameTag id={id} tagRef={label} y={2.18} />
      <ChatHitbox id={id} hitRef={hit} onSelect={onSelect} height={2.0} />
    </group>
  )
}
