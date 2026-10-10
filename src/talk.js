// Shared, render-free state between the 3D scene and the chat UI.
// useFrame loops read it every frame, so changing it never re-renders React.
export const talk = {
  open: null, // id of the professor whose chat window is open, or null
  talkingUntil: 0, // performance.now() ms until the professor's mouth stops moving
  aimed: null, // id of the professor under the crosshair, or null
}

// clickable professors register an invisible hitbox mesh here: id -> THREE.Mesh
export const hitboxes = new Map()

export const API_BASE = import.meta.env.VITE_API_URL ?? ''
