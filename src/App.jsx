import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import Minimap from './Minimap.jsx'
import TouchControls from './TouchControls.jsx'
import ProfessorPicker from './ProfessorPicker.jsx'
import ChatPanel from './ChatPanel.jsx'
import { EYE, SPAWN } from './layout.js'
import { talk } from './talk.js'
import { CHAT_PROFS } from './chatProfessors.js'

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const [showMap, setShowMap] = useState(true)
  const lockRef = useRef()
  const mapRef = useRef()
  const onLock = useCallback((v) => setLocked(v), [])
  const onWhere = useCallback((w) => setWhere(w), [])
  // phones have no pointer lock, so they get a joystick + drag-to-look instead
  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches) // phones + tablets; touchscreen laptops still get mouse mode
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }
  const playing = locked || touchOn
  useEffect(() => {
    const k = (e) => e.code === 'KeyM' && !e.target.matches?.('input, textarea') && setShowMap((v) => !v)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  // chatting with a professor: free the mouse (or pause the joystick), then restore on close
  const [chatProf, setChatProf] = useState(null)
  const [aimed, setAimed] = useState(null)
  const resume = useRef(null) // 'mouse' | 'touch' | null
  const onAim = useCallback((id) => setAimed(id), [])
  const openChat = useCallback((id) => {
    if (talk.open) return
    resume.current = document.pointerLockElement ? 'mouse' : touchRef.current.active ? 'touch' : null
    talk.open = id
    setChatProf(id)
    if (document.pointerLockElement) document.exitPointerLock()
    if (touchRef.current.active) setTouch(false)
  }, [])
  const closeChat = useCallback(() => {
    talk.open = null
    talk.talkingUntil = 0
    setChatProf(null)
    if (resume.current === 'mouse') lockRef.current?.() // back to walking; if the browser refuses, the start card shows
    if (resume.current === 'touch') setTouch(true)
  }, [])

  return (
    <>
      <Canvas
        camera={{ fov: 72, near: 0.05, far: 800, position: [SPAWN.x, EYE, SPAWN.z] }}
        dpr={[1, 1.75]}
      >
        <World onSelectProfessor={openChat} />
        <Player lockRef={lockRef} mapRef={mapRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
        <ProfessorPicker onAim={onAim} onSelect={openChat} />
      </Canvas>

      <div className="where">
        <span className="dot" />
        {where}
      </div>
      <div className={showMap ? 'mapwrap' : 'mapwrap hidden'}>
        <Minimap drawRef={mapRef} />
      </div>
      <button className="maptoggle" onClick={() => setShowMap((s) => !s)}>
        {showMap ? 'hide map' : 'map'}
      </button>
      {playing && <div className="crosshair" />}
      {playing && aimed && !chatProf && <div className="aimhint">Click to talk to {CHAT_PROFS[aimed]?.short || aimed}</div>}
      {touchOn && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}
      {chatProf && <ChatPanel key={chatProf} profId={chatProf} onClose={closeChat} />}

      {!playing && !chatProf && (
        <div className="overlay" onClick={() => (isTouch ? setTouch(true) : lockRef.current?.())}>
          <div className="card">
            <div className="kicker">Yale SOM · Evans Hall</div>
            <h1>Floor 2</h1>
            <p className="sub">Classroom drums, the cloister, Ross Library, the Beinecke Terrace Room, and the courtyard.</p>
            <button className="go">{isTouch ? 'Tap to walk in' : 'Click to walk in'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  setTouch(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            {isTouch ? (
              <div className="keys">
                <span><b>Left thumb</b> joystick to walk (push all the way to hurry)</span>
                <span><b>Right thumb</b> drag to look</span>
              </div>
            ) : (
              <div className="keys">
                <span><b>W A S D</b> walk</span>
                <span><b>Mouse</b> look</span>
                <span><b>Shift</b> sprint</span>
                <span><b>Space</b> jump</span>
                <span><b>C</b> crouch</span>
                <span><b>M</b> map</span>
                <span><b>Esc</b> pause</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
