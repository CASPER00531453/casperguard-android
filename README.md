# CasperGuard Android

Telefonundaki internet engellerini aşmana yardım eden Android uygulaması. Kurarsın, kodunu girersin, bağlanırsın. Ayar yapman gerekmez.

## İndir

**[CasperGuard.apk'yı indir](https://github.com/CASPER00531453/casperguard-android/releases/download/test-latest/CasperGuard.apk)**

## Kurulum

1. Yukarıdaki linki telefonda aç ve APK'yı indir.
2. "Bilinmeyen kaynaklardan yükleme" izni istenirse izin ver.
3. CasperGuard'ı aç ve kodunu gir.
4. **Connect**'e bas, VPN iznini ver.

Yeni sürüm çıkınca uygulama güncelleme ekranı gösterir. Güncellemeden bağlanamazsın.

## Ayarlar

Sağ üstteki menüden **Ayarlar**'a gir. Bağlıyken ayarlar açılmaz, önce **Disconnect** yap.

- **Hazır DNS:** Google, Cloudflare, Quad9, AdGuard veya Yandex'i seçebilirsin.
- **Hazır strateji:** Bir ayar çalışmazsa alternatifleri dene.

## Sık sorulanlar

**Root gerekiyor mu?**
Hayır.

**Bu gerçek bir VPN mi?**
Hayır. Android'in VPN özelliğini sadece trafiği telefonun içinde yönlendirmek için kullanır. Trafiğin uzak bir sunucuya gitmez, şifrelenmez ve IP adresin gizlenmez.

**Hangi bilgiler gönderiliyor?**
Kodun geçerliliğini kontrol etmek için lisans sunucusuna kod, cihaz kimliği, platform ve uygulama sürümü gönderilir. Güncelleme kontrolü için GitHub'a bağlanılır. Gezdiğin siteler gönderilmez.

**Kod "başka cihazda kullanılıyor" diyor, neden?**
Her kod tek cihazda çalışır. Kodu veren kişiyle iletişime geç.

## Kaynak ve lisans

CasperGuard, [ByeDPIAndroid](https://github.com/dovecoteescapee/ByeDPIAndroid) üzerine kuruludur ve [ByeDPI](https://github.com/hufrea/byedpi) ile [hev-socks5-tunnel](https://github.com/heiher/hev-socks5-tunnel) projelerini kullanır. Bu proje GPL-3.0 lisanslıdır, ayrıntılar [LICENSE](LICENSE) dosyasında.
