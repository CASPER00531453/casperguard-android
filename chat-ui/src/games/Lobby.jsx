import { useEffect, useState } from 'react'
import { ThinkingOrb } from 'thinking-orbs'
import { post } from './api'
import { ORB_COLOR } from './theme'

const INVITE_POLL_MS = 5000

export function Lobby({ profile, onJoin, onEditProfile }) {
  const [invites, setInvites] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    let alive = true
    const load = () => post('/api/games/invites').then((r) => alive && setInvites(r.invites)).catch(() => {})
    load()
    const timer = setInterval(load, INVITE_POLL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  async function answer(invite, accept) {
    try {
      const r = await post('/api/games/invites/answer', { invite_id: invite.id, accept })
      setInvites((all) => all.filter((i) => i.id !== invite.id))
      if (accept) onJoin(r.game_id)
    } catch (e) {
      setStatus(e.message)
    }
  }

  async function create() {
    setStatus('Masa kuruluyor…')
    try {
      onJoin((await post('/api/games')).game_id)
    } catch (e) {
      setStatus(e.message)
    }
  }

  return (
    <div className="stack">
      <div className="me">
        <ThinkingOrb state={profile.avatar} size={32} theme="dark" color={ORB_COLOR} />
        <strong>{profile.nickname}</strong>
        <button className="link" onClick={onEditProfile}>Düzenle</button>
      </div>

      <section className="card">
        <h1>Para oyunu</h1>
        <p className="hint">Herkes 5 karta karakter yazar, kartlar açık artırmaya çıkar, sonunda en güçlü takımı oylarsınız.</p>
        <button className="primary" onClick={create}>Masa kur</button>
      </section>

      <section className="stack">
        <h2>Davetlerin</h2>
        {invites.length === 0 && <p className="hint">Şimdilik davet yok.</p>}
        {invites.map((i) => (
          <div className="row invite" key={i.id}>
            <ThinkingOrb state={i.from.avatar} size={20} theme="dark" color={ORB_COLOR} />
            <span className="grow"><strong>{i.from.nickname}</strong> seni çağırıyor</span>
            <button className="primary small" onClick={() => answer(i, true)}>Katıl</button>
            <button className="small" onClick={() => answer(i, false)}>Reddet</button>
          </div>
        ))}
      </section>
      {status && <p className="hint">{status}</p>}
    </div>
  )
}
