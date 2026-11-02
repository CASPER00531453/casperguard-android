// Hazır sorular internete gitmeden cevaplanır; çözülmezse sohbet BurakAI'a geçer.
export const QUICK_ANSWERS = [
  {
    question: 'Bağlantı sorunu yaşıyorum',
    answer:
      '1. Ana ekranda Bağlantıyı kes\'e bas, sonra yeniden Bağlan\'a bas.\n' +
      '2. Telefondaki diğer VPN uygulamalarını kapat.\n' +
      '3. Ayarlar > Hazır strateji bölümünden Türkiye (önerilen) seç.\n' +
      '4. Ayarlar > Hazır DNS bölümünden Google seç.\n' +
      '5. Olmazsa uygulamayı kapatıp yeniden başlat.',
  },
  {
    question: 'Discord açılmıyor',
    answer:
      '1. Bağlantıyı kesip yeniden bağlan.\n' +
      '2. Discord\'u tamamen kapatıp yeniden aç.\n' +
      '3. Ayarlar > Hazır strateji bölümünden sırayla alternatifleri dene.\n' +
      'Stratejiyi değiştirmeden önce bağlantıyı kesmen gerekir.',
  },
  {
    question: 'Instagram açılmıyor',
    answer:
      '1. Bağlantıyı kesip yeniden bağlan.\n' +
      '2. Instagram\'ı tamamen kapatıp yeniden aç.\n' +
      '3. Olmazsa Ayarlar > Hazır DNS bölümünden Cloudflare dene.\n' +
      '4. Sonra Hazır strateji bölümündeki alternatifleri dene.',
  },
  {
    question: 'İnternetim kesildi',
    answer:
      '1. Bağlantıyı kes\'e bas ve internetin geri gelip gelmediğine bak.\n' +
      '2. Gelmezse CasperGuard\'ı tamamen kapat.\n' +
      '3. Hâlâ yoksa telefonu yeniden başlat.\n' +
      'Sorun CasperGuard kapalıyken de sürüyorsa operatörünü veya Wi-Fi\'ını kontrol et.',
  },
  {
    question: 'Kod hatası alıyorum',
    answer:
      'Kod geçersiz diyorsa kodu boşluksuz gir. Kodlarda 0, O, 1, I ve L harfleri yoktur.\n' +
      'İptal edilmiş, süresi dolmuş veya başka cihazda kullanılıyor diyorsa kodu veren kişiyle görüş.',
  },
  {
    question: 'Güncelleme gelmiyor',
    answer:
      'Uygulamayı son uygulamalar ekranından kaydırarak tamamen kapat ve yeniden aç. ' +
      'İnternetin açık olduğundan emin ol. Güncelleme kurulurken izin isterse izin ver.',
  },
]

export const ERROR_MESSAGES = {
  rate_limited: 'Çok hızlı yazdın. Biraz bekleyip tekrar dene.',
  ai_unavailable: 'BurakAI şu an cevap veremiyor. Biraz sonra tekrar dene.',
  invalid_code: 'Kodun geçersiz görünüyor.',
  revoked: 'Kodun iptal edilmiş.',
  expired: 'Kodunun süresi dolmuş.',
  device_mismatch: 'Bu kod başka bir cihazda kullanılıyor.',
}
