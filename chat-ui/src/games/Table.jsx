import { useEffect, useMemo, useRef, useState } from 'react'
import { ThinkingOrb } from 'thinking-orbs'
import { connect, message, post } from './api'
import { ORB_COLOR } from './theme'

const SLOTS = 5

function useCountdown(deadline, offset) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(timer)
  }, [])
  if (deadline == null) return null
  return Math.max(0, Math.ceil((deadline - (now + offset)) / 1000))
}

function Countdown({ seconds }) {
  if (seconds == null) return null
  return <div className={seconds <= 3 ? 'countdown hot' : 'countdown'}>{seconds}</div>
}

function Players({ view, you }) {
  return (
    <div className="players">
      {view.players.map((p) => (
        <div key={p.id} className={['player', p.id === you ? 'you' : '', p.dropped ? 'dropped' : ''].join(' ')}>
          <ThinkingOrb state={p.avatar} size={20} theme="dark" color={ORB_COLOR} paused={!p.connected} />
          <span className="grow">{p.nickname}</span>
          <span>{p.money} TL</span>
          <span className="slots">{p.cards.length}/{SLOTS}</span>
        </div>
      ))}
    </div>
  )
}

function Waiting({ view, you, gameId }) {
  const [nickname, setNickname] = useState('')
  const [status, setStatus] = useState('')
  const host = view.hostId === you

  async function invite(e) {
    e.preventDefault()
    try {
      await post('/api/games/invite', { game_id: gameId, nickname: nickname.trim() })
      setStatus(`${nickname.trim()} davet edildi.`)
      setNickname('')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="stack">
      <h1>Masa</h1>
      <Players view={view} you={you} />
      {host ? (
        <form className="row" onSubmit={invite}>
          <input className="grow" value={nickname} placeholder="Arkadaşının takma adı" aria-label="Takma ad" onChange={(e) => setNickname(e.target.value)} />
          <button className="small" disabled={!nickname.trim()}>Davet et</button>
        </form>
      ) : (
        <p className="hint">Masayı kuranın oyunu başlatması bekleniyor.</p>
      )}
      {status && <p className="hint">{status}</p>}
      {host && <StartButton view={view} />}
    </div>
  )
}

function StartButton({ view }) {
  const send = useSend()
  const enough = view.players.filter((p) => !p.dropped).length >= 2
  return (
    <button className="primary" disabled={!enough} onClick={() => send({ t: 'start' })}>
      {enough ? 'Oyunu başlat' : 'En az 1 arkadaşın katılmalı'}
    </button>
  )
}

function Writing({ view, you }) {
  const send = useSend()
  const me = view.players.find((p) => p.id === you)
  const [cards, setCards] = useState(['', '', '', '', ''])
  if (me?.hasWritten) {
    const waiting = view.players.filter((p) => !p.hasWritten && !p.dropped).map((p) => p.nickname)
    return (
      <div className="stack center">
        <ThinkingOrb state="listening" size={64} theme="dark" color={ORB_COLOR} />
        <p>Kartların hazır. Bekleniyor: {waiting.join(', ')}</p>
      </div>
    )
  }
  const ready = cards.every((c) => c.trim())
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); send({ t: 'cards', cards }) }}>
      <h1>Kartlarını yaz</h1>
      <p className="hint">İsim, dizi ya da film karakteri. Kimin yazdığı gizli kalır.</p>
      {cards.map((c, i) => (
        <input key={i} value={c} maxLength={40} placeholder={`${i + 1}. kart`} aria-label={`${i + 1}. kart`} onChange={(e) => setCards((all) => all.map((x, j) => (j === i ? e.target.value : x)))} />
      ))}
      <button className="primary" disabled={!ready}>Gönder</button>
    </form>
  )
}

function Shuffling() {
  return (
    <div className="stack center shuffle">
      <ThinkingOrb state="weaving" size={64} theme="dark" color={ORB_COLOR} />
      <h1>CasperAI kartları karıştırıyor…</h1>
      <div className="deck">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="mini-card" style={{ animationDelay: `${i * 0.12}s` }} />)}</div>
    </div>
  )
}

function Auction({ view, you, seconds }) {
  const send = useSend()
  const me = view.players.find((p) => p.id === you)
  const cur = view.current
  const name = (id) => view.players.find((p) => p.id === id)?.nickname ?? ''
  const [custom, setCustom] = useState('')
  const opened = cur.bid !== null
  const canBid = opened && me && !me.dropped && me.cards.length < SLOTS && cur.bidder !== you

  const offer = (amount) => send({ t: 'bid', amount })
  return (
    <div className="stack">
      <div className="center hint">Destede {view.deckCount} kart kaldı</div>
      <div key={cur.card} className="big-card flip">{cur.card}</div>
      <Countdown seconds={seconds} />
      {opened ? (
        <p className="center bid">
          <strong>{cur.bid} TL</strong> · {name(cur.bidder)}
        </p>
      ) : (
        <p className="center hint">{cur.openerId === you ? 'Kartı açma sırası sende' : `${name(cur.openerId)} kartı açıyor…`}</p>
      )}
      {!opened && cur.openerId === you && (
        <div className="row">
          <button className="primary grow" onClick={() => send({ t: 'open', amount: 0 })}>0 TL ile aç</button>
          <button className="small" disabled={me.money < 1} onClick={() => send({ t: 'open', amount: 1 })}>1 TL</button>
          <button className="small" disabled={me.money < 5} onClick={() => send({ t: 'open', amount: 5 })}>5 TL</button>
        </div>
      )}
      {opened && (
        <div className="stack">
          <div className="row">
            {[1, 5, 10].map((step) => (
              <button key={step} className="primary grow" disabled={!canBid || cur.bid + step > me.money} onClick={() => offer(cur.bid + step)}>+{step}</button>
            ))}
          </div>
          <form className="row" onSubmit={(e) => { e.preventDefault(); offer(Number(custom)); setCustom('') }}>
            <input className="grow" inputMode="numeric" value={custom} placeholder="Tutar" aria-label="Teklif tutarı" onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} />
            <button className="small" disabled={!canBid || !custom}>Teklif ver</button>
          </form>
          {me?.cards.length >= SLOTS && <p className="hint center">5 kartın doldu, artık izliyorsun.</p>}
        </div>
      )}
      <Players view={view} you={you} />
      {me?.cards.length > 0 && <p className="hint">Takımın: {me.cards.join(', ')}</p>}
    </div>
  )
}

function Team({ player }) {
  return (
    <div className="team">
      <div className="row"><ThinkingOrb state={player.avatar} size={20} theme="dark" color={ORB_COLOR} paused /><strong>{player.nickname}</strong></div>
      <div className="chips">{player.cards.map((c) => <span key={c} className="chip">{c}</span>)}</div>
    </div>
  )
}

function Voting({ view, you, seconds }) {
  const send = useSend()
  const me = view.players.find((p) => p.id === you)
  const others = view.players.filter((p) => p.id !== you && p.cards.length > 0)
  if (view.tie) {
    return (
      <div className="stack center">
        <ThinkingOrb state="solving" size={64} theme="dark" color={ORB_COLOR} />
        <h1>Oylar eşit, CasperAI karar veriyor…</h1>
      </div>
    )
  }
  return (
    <div className="stack">
      <h1>Kapışsa kim kazanır?</h1>
      <Countdown seconds={seconds} />
      {me?.vote || me?.dropped ? (
        <p className="center hint">Oyun verildi, diğerleri bekleniyor.</p>
      ) : (
        others.map((p) => (
          <button key={p.id} className="vote" onClick={() => send({ t: 'vote', target: p.id })}>
            <Team player={p} />
          </button>
        ))
      )}
      {me && <Team player={me} />}
    </div>
  )
}

function Finished({ view, onLeave }) {
  const votes = useMemo(() => {
    // Object.fromEntries eski Android WebView'lerinde yok.
    const counts = view.players.reduce((all, p) => ({ ...all, [p.id]: 0 }), {})
    for (const p of view.players) if (p.vote) counts[p.vote] += 1
    if (view.aiVote) counts[view.aiVote] += 1
    return counts
  }, [view])
  const winner = view.players.find((p) => p.id === view.winnerId)
  const name = (id) => view.players.find((p) => p.id === id)?.nickname
  return (
    <div className="stack">
      <div className="center stack">
        <ThinkingOrb state="composing" size={64} theme="dark" color={ORB_COLOR} />
        <h1>{winner ? `${winner.nickname} kazandı` : 'Oyun bitti'}</h1>
      </div>
      {view.aiComment && (
        <div className="card">
          <strong>CasperAI{view.aiVote ? ` · ${name(view.aiVote)}` : ''}</strong>
          <p>{view.aiComment}</p>
        </div>
      )}
      {view.players.map((p) => (
        <div key={p.id} className="row">
          <span className="grow"><Team player={p} /></span>
          <strong>{votes[p.id]} oy</strong>
        </div>
      ))}
      <button className="primary" onClick={onLeave}>Lobiye dön</button>
    </div>
  )
}

const SendContext = { current: () => {} }
const useSend = () => SendContext.current

export function Table({ gameId, onLeave }) {
  const [state, setState] = useState(null)
  const [toast, setToast] = useState('')
  const [connection, setConnection] = useState('connecting')
  const offset = useRef(0)

  useEffect(() => {
    const socket = connect(
      gameId,
      (m) => {
        if (m.t === 'state') {
          offset.current = m.serverNow - Date.now()
          setState(m)
        } else if (m.t === 'error') {
          setToast(message(m.error))
          setTimeout(() => setToast(''), 2500)
        }
      },
      setConnection,
    )
    SendContext.current = socket.send
    return () => socket.close()
  }, [gameId])

  const seconds = useCountdown(state?.view.deadline ?? null, offset.current)
  if (!state) {
    return (
      <div className="stack center">
        <ThinkingOrb state="connecting" size={64} theme="dark" color={ORB_COLOR} />
        <p className="hint">{connection === 'closed' ? 'Masaya bağlanılamadı.' : 'Masaya bağlanılıyor…'}</p>
        {connection === 'closed' && <button className="primary" onClick={onLeave}>Lobiye dön</button>}
      </div>
    )
  }
  const { view, you } = state
  const screens = {
    waiting: <Waiting view={view} you={you} gameId={gameId} />,
    writing: <Writing view={view} you={you} />,
    shuffling: <Shuffling />,
    auction: <Auction view={view} you={you} seconds={seconds} />,
    voting: <Voting view={view} you={you} seconds={seconds} />,
    finished: <Finished view={view} onLeave={onLeave} />,
  }
  return (
    <>
      {connection === 'reconnecting' && <div className="banner">Bağlantı koptu, yeniden bağlanılıyor…</div>}
      {screens[view.phase]}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  )
}
