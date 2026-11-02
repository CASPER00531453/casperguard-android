import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ThinkingOrb } from 'thinking-orbs'
import { ERROR_MESSAGES, QUICK_ANSWERS } from './answers'

const API = 'https://casperguard.casperguard-server.workers.dev'
const RATING_AFTER_REPLIES = 3
const VILTRUM = window.CasperBridge?.getEdition?.() === 'viltrum'
const ORB_COLOR = VILTRUM ? '#E0B23C' : undefined
if (VILTRUM) document.documentElement.dataset.edition = 'viltrum'
const THINKING_STEPS = [
  ['searching', 'Düşünüyor…'],
  ['solving', 'Çözüm arıyor…'],
  ['composing', 'Cevap yazıyor…'],
]

const credentials = () => ({
  code: window.CasperBridge?.getCode() ?? '',
  device_id: window.CasperBridge?.getDeviceId() ?? '',
})

async function post(path, body) {
  let res
  try {
    res = await fetch(API + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...credentials(), ...body }),
    })
  } catch {
    throw new Error('Sunucuya ulaşılamadı. İnternetini kontrol et.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(ERROR_MESSAGES[data.error] ?? 'Bir sorun oluştu. Tekrar dene.')
  return data
}

function Thinking() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, THINKING_STEPS.length - 1)), 1800)
    return () => clearInterval(timer)
  }, [])
  const [state, label] = THINKING_STEPS[step]
  return (
    <div className="row">
      <div className="avatar"><ThinkingOrb state={state} size={32} theme="dark" color={ORB_COLOR} aria-label="BurakAI düşünüyor" /></div>
      <div className="thinking">{label}</div>
    </div>
  )
}

function Message({ message }) {
  if (message.role === 'user') return <div className="bubble user">{message.content}</div>
  return (
    <div className="row">
      <div className="avatar"><ThinkingOrb state="breathing" size={32} theme="dark" color={ORB_COLOR} paused aria-hidden="true" /></div>
      <div className={message.error ? 'bubble ai error' : 'bubble ai'}>{message.content}</div>
    </div>
  )
}

function RatingCard({ onDone }) {
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')

  async function submit() {
    setStatus('Gönderiliyor…')
    try {
      await post('/api/rating', { stars, comment })
      onDone()
    } catch (e) {
      setStatus(e.message)
    }
  }

  return (
    <div className="card">
      <div className="card-title">BurakAI'ı değerlendirir misin?</div>
      <div className="stars" role="radiogroup" aria-label="Puan">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={n <= stars ? 'star on' : 'star'} aria-label={`${n} yıldız`} onClick={() => setStars(n)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8z" /></svg>
          </button>
        ))}
      </div>
      <textarea value={comment} maxLength={500} placeholder="Yorumun (isteğe bağlı)" onChange={(e) => setComment(e.target.value)} />
      <button className="primary" disabled={stars === 0 || status === 'Gönderiliyor…'} onClick={submit}>Gönder</button>
      {status && <div className="hint">{status}</div>}
    </div>
  )
}

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [rating, setRating] = useState('hidden')
  const [pendingCheck, setPendingCheck] = useState(false)
  const bottom = useRef(null)
  const replies = useRef(0)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, rating, pendingCheck])

  function countReply() {
    replies.current += 1
    if (replies.current >= RATING_AFTER_REPLIES) setRating((r) => (r === 'hidden' ? 'open' : r))
  }

  async function ask(history) {
    setThinking(true)
    try {
      const { reply } = await post('/api/chat', {
        messages: history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
      })
      setMessages((all) => [...all, { role: 'assistant', content: reply }])
      countReply()
    } catch (e) {
      setMessages((all) => [...all, { role: 'assistant', content: e.message, error: true }])
    } finally {
      setThinking(false)
    }
  }

  function send(text) {
    const content = text.trim()
    if (!content || thinking) return
    const history = [...messages, { role: 'user', content }]
    setMessages(history)
    setInput('')
    setPendingCheck(false)
    ask(history)
  }

  function quick(item) {
    setMessages((all) => [...all, { role: 'user', content: item.question }, { role: 'assistant', content: item.answer }])
    setPendingCheck(true)
  }

  function solved() {
    setPendingCheck(false)
    setMessages((all) => [...all, { role: 'assistant', content: 'Sevindim. Başka bir sorunda yine yaz.' }])
    setRating((r) => (r === 'hidden' ? 'open' : r))
  }

  function notSolved() {
    send('Bu adımlar sorunumu çözmedi. Başka ne deneyebilirim?')
  }

  return (
    <main>
      <div className="log">
        {messages.length === 0 && (
          <section className="welcome">
            <img className={VILTRUM ? 'logo emblem' : 'logo'} src={VILTRUM ? 'viltrum.png' : 'logo.png'} alt={VILTRUM ? 'Viltrum Edition' : 'Casper Technology'} />
            <ThinkingOrb state="breathing" size={64} theme="dark" color={ORB_COLOR} aria-hidden="true" />
            <h1>{VILTRUM ? 'İmparatorluk emrinde, ben BurakAI' : 'Merhaba, ben BurakAI'}</h1>
            <p>CasperGuard'la ilgili sorununu seç ya da yaz.</p>
          </section>
        )}
        {messages.map((m, i) => <Message key={i} message={m} />)}
        {pendingCheck && !thinking && (
          <div className="chips">
            <button onClick={solved}>Çözüldü</button>
            <button onClick={notSolved}>Çözülmedi</button>
          </div>
        )}
        {thinking && <Thinking />}
        {rating === 'open' && !thinking && <RatingCard onDone={() => setRating('done')} />}
        {rating === 'done' && <div className="hint center">Teşekkürler, değerlendirmen kaydedildi.</div>}
        {messages.length === 0 && (
          <div className="chips">
            {QUICK_ANSWERS.map((item) => <button key={item.question} onClick={() => quick(item)}>{item.question}</button>)}
          </div>
        )}
        <div ref={bottom} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input) }}>
        <input value={input} maxLength={1500} placeholder="BurakAI'a yaz" aria-label="Mesaj" onChange={(e) => setInput(e.target.value)} />
        <button className="primary" disabled={thinking || !input.trim()}>Gönder</button>
      </form>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
