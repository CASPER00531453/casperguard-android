import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ThinkingOrb } from 'thinking-orbs'
import { post } from './api'
import { Lobby } from './Lobby'
import { Profile } from './Profile'
import { Table } from './Table'
import { ORB_COLOR } from './theme'

function Footer() {
  return (
    <div className="footer" aria-hidden="true">
      <ThinkingOrb state="breathing" size={20} theme="dark" color={ORB_COLOR} />
      <span>CasperAI</span>
    </div>
  )
}

function App() {
  const [profile, setProfile] = useState(undefined)
  const [editing, setEditing] = useState(false)
  const [gameId, setGameId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Ekrandan çıkıp dönen oyuncu bitmemiş masasına geri alınır.
    post('/api/games/profile/get')
      .then(async (r) => {
        if (r.profile) setGameId((await post('/api/games/active')).game_id)
        setProfile(r.profile)
      })
      .catch((e) => setError(e.message))
  }, [])

  let screen
  if (error) screen = <p className="center hint">{error}</p>
  else if (profile === undefined) screen = <div className="center"><ThinkingOrb state="searching" size={64} theme="dark" color={ORB_COLOR} /></div>
  else if (!profile || editing) screen = <Profile current={profile} onSaved={(p) => { setProfile(p); setEditing(false) }} />
  else if (gameId) screen = <Table gameId={gameId} onLeave={() => setGameId(null)} />
  else screen = <Lobby profile={profile} onJoin={setGameId} onEditProfile={() => setEditing(true)} />

  return (
    <main>
      <div className="screen">{screen}</div>
      <Footer />
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
