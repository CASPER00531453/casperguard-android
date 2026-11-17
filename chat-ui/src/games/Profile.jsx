import { useState } from 'react'
import { ThinkingOrb } from 'thinking-orbs'
import { post } from './api'
import { ORB_COLOR } from './theme'

export const AVATARS = ['working', 'searching', 'solving', 'listening', 'connecting', 'weaving', 'composing', 'breathing', 'shaping']

export function Profile({ current, onSaved }) {
  const [nickname, setNickname] = useState(current?.nickname ?? '')
  const [avatar, setAvatar] = useState(current?.avatar ?? AVATARS[0])
  const [status, setStatus] = useState('')

  async function save(e) {
    e.preventDefault()
    setStatus('Kaydediliyor…')
    try {
      const { profile } = await post('/api/games/profile', { nickname: nickname.trim(), avatar })
      onSaved(profile)
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <h1>Oyuncu profilin</h1>
      <p className="hint">Arkadaşların seni bu adla bulup davet edecek.</p>
      <input value={nickname} maxLength={20} placeholder="Takma ad" aria-label="Takma ad" onChange={(e) => setNickname(e.target.value)} />
      <div className="avatars" role="radiogroup" aria-label="Avatar">
        {AVATARS.map((a) => (
          <button type="button" key={a} role="radio" aria-checked={a === avatar} aria-label={a} className={a === avatar ? 'avatar on' : 'avatar'} onClick={() => setAvatar(a)}>
            <ThinkingOrb state={a} size={32} theme="dark" color={ORB_COLOR} paused={a !== avatar} />
          </button>
        ))}
      </div>
      <button className="primary" disabled={nickname.trim().length < 2 || status === 'Kaydediliyor…'}>Kaydet</button>
      {status && <p className="hint">{status}</p>}
    </form>
  )
}
