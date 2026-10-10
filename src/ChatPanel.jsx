import { useEffect, useRef, useState } from 'react'
import { API_BASE, talk } from './talk.js'
import { CHAT_PROFS } from './chatProfessors.js'

// Chat window for one professor. Keeps its own history and the backend session id
// so the professor remembers the conversation until the page reloads.
export default function ChatPanel({ profId, onClose }) {
  const prof = CHAT_PROFS[profId] || { name: profId, course: '', greeting: 'Hi!', thinking: 'thinking…' }
  const [msgs, setMsgs] = useState(() => [{ role: 'prof', text: prof.greeting }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const session = useRef(null)
  const listRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useEffect(() => {
    // braces matter: newer Chrome returns a Promise from scrollTo, and effects may only return a cleanup function
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, busy])
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  async function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setMsgs((m) => [...m, { role: 'me', text }])
    setBusy(true)
    talk.talkingUntil = performance.now() + 1200 // a little "hmm" while he thinks
    try {
      const res = await fetch(`${API_BASE}/api/professors/${profId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: session.current }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`)
      session.current = data.session_id
      setMsgs((m) => [...m, { role: 'prof', text: data.reply }])
      talk.talkingUntil = performance.now() + Math.min(9000, 600 + data.reply.length * 45) // mouth moves ~ reading time
    } catch (err) {
      const offline = err instanceof TypeError || /404|Failed to fetch/.test(String(err))
      setMsgs((m) => [
        ...m,
        {
          role: 'error',
          text: offline
            ? 'Can’t reach the professor backend. Start it with: cd backend, then .venv\\Scripts\\python -m uvicorn app.main:app --port 8000'
            : String(err.message || err),
        },
      ])
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="chat" onMouseDown={(e) => e.stopPropagation()}>
      <div className="chat-head">
        <div>
          <div className="chat-name">{prof.name}</div>
          <div className="chat-sub">{prof.course}</div>
        </div>
        <button className="chat-x" onClick={onClose} aria-label="Close chat">
          ✕
        </button>
      </div>
      <div className="chat-list" ref={listRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="bubble prof typing">{prof.thinking}</div>}
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about stats, AI, or any SOM class…"
          maxLength={2000}
          aria-label="Message"
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
      <div className="chat-foot">AI character inspired by the real professor, not the real person · Esc to close</div>
    </div>
  )
}
