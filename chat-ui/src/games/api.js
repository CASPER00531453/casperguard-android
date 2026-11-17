// Oyun ekranının sunucuyla konuştuğu tek yer.
export const API = window.CASPER_API ?? 'https://casperguard.casperguard-server.workers.dev'

export const ERRORS = {
  rate_limited: 'Çok hızlı gidiyorsun, biraz bekle.',
  invalid_code: 'Kodun geçersiz görünüyor.',
  revoked: 'Kodun iptal edilmiş.',
  expired: 'Kodunun süresi dolmuş.',
  device_mismatch: 'Bu kod başka bir cihazda kullanılıyor.',
  invalid_nickname: 'Takma ad 2 ile 20 karakter arasında olmalı.',
  invalid_avatar: 'Bir avatar seç.',
  nickname_taken: 'Bu ad alınmış.',
  no_profile: 'Önce profil oluştur.',
  no_game: 'Masa bulunamadı.',
  not_host: 'Bunu sadece masayı kuran yapabilir.',
  game_started: 'Oyun çoktan başladı.',
  game_full: 'Masa dolu.',
  already_invited: 'Bu kişi zaten davet edildi.',
  no_player: 'Bu adla bir oyuncu yok.',
  no_invite: 'Davet artık geçerli değil.',
  not_enough_players: 'Başlatmak için en az 2 oyuncu lazım.',
  invalid_cards: '5 kartın hepsini doldur, her biri en fazla 40 karakter.',
  not_your_turn: 'Sıra sende değil.',
  already_open: 'Kart zaten açıldı.',
  not_open: 'Kart henüz açılmadı.',
  bid_too_low: 'Daha yüksek teklif ver.',
  not_enough_money: 'Paran yetmiyor.',
  already_highest: 'En yüksek teklif zaten senin.',
  slots_full: '5 kartın doldu.',
  invalid_amount: 'Geçersiz tutar.',
  self_vote: 'Kendine oy veremezsin.',
  already_voted: 'Oyunu zaten verdin.',
  not_active: 'Oyundan düştün.',
  unauthorized: 'Masaya bağlanılamadı.',
  not_in_game: 'Bu masada değilsin.',
}

export const message = (error) => ERRORS[error] ?? 'Bir sorun oluştu, tekrar dene.'

export const credentials = () => ({
  code: window.CasperBridge?.getCode() ?? '',
  device_id: window.CasperBridge?.getDeviceId() ?? '',
})

export async function post(path, body = {}) {
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
  if (!res.ok) throw new Error(message(data.error))
  return data
}

const RETRY_MS = [1000, 2000, 5000]

// Masaya canlı bağlanır; koparsa kendiliğinden yeniden bağlanır, her bağlantıda önce kimliğini bildirir.
export function connect(gameId, onMessage, onStatus) {
  let ws = null
  let attempt = 0
  let stopped = false

  function open() {
    ws = new WebSocket(`${API.replace(/^http/, 'ws')}/api/games/${gameId}/ws`)
    ws.onopen = () => {
      attempt = 0
      onStatus('connected')
      ws.send(JSON.stringify({ t: 'hello', ...credentials() }))
    }
    ws.onmessage = (e) => onMessage(JSON.parse(e.data))
    ws.onclose = (e) => {
      if (stopped || e.reason === 'replaced' || e.code === 1008) return onStatus('closed')
      onStatus('reconnecting')
      setTimeout(open, RETRY_MS[Math.min(attempt++, RETRY_MS.length - 1)])
    }
  }

  open()
  return {
    send: (msg) => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify(msg)),
    close: () => {
      stopped = true
      ws?.close()
    },
  }
}
