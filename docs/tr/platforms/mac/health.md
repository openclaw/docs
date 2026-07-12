---
read_when:
    - Mac uygulaması sağlık göstergelerinde hata ayıklama
summary: macOS uygulamasının Gateway/kanal sağlık durumlarını nasıl bildirdiği
title: Sağlık denetimleri (macOS)
x-i18n:
    generated_at: "2026-07-12T12:28:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS'ta sistem durumu denetimleri

Menü çubuğu uygulamasından bağlı kanalın sistem durumu bilgisinin nasıl okunacağı.

## Menü çubuğu

Durum noktası:

- Yeşil: bağlı + yoklama başarılı.
- Turuncu: bağlı ancak bir kanal yoklaması performans düşüşü/bağlantı yok bildiriyor.
- Kırmızı: henüz bağlı değil.

İkincil satırda "bağlı · kimlik doğrulama 12 dk." ifadesi veya hata nedeni gösterilir.
Menüdeki "Sistem Durumu Denetimini Şimdi Çalıştır" seçeneği, isteğe bağlı bir yoklamayı tetikler.

## Ayarlar

- Genel sekmesinde bir Sistem Durumu kartı gösterilir: durum noktası, özet satırı (bağlantı durumu +
  kimlik doğrulama yaşı) ve isteğe bağlı bir hata ayrıntısı satırı ile **Şimdi yeniden dene** ve
  **Günlükleri aç** düğmeleri.
- **Kanallar sekmesi**, WhatsApp ve Telegram için kanal bazında durum ve denetimleri (oturum açma QR kodu,
  oturumu kapatma, yoklama, son bağlantı kesilmesi/hata) sunar.

## Yoklama nasıl çalışır?

Uygulama, mevcut WebSocket bağlantısı üzerinden (CLI kabuk çağrısı yapmak yerine) yaklaşık her 60 saniyede bir ve
istek üzerine Gateway'in `health` RPC'sini çağırır. RPC, kimlik bilgilerini
yükler ve mesaj göndermeden durumu bildirir. Uygulama, kullanıcı arayüzünün anında yüklenmesi ve
çevrimdışıyken titrememesi için son başarılı anlık görüntüyü ve son hatayı ayrı ayrı önbelleğe alır.

## Şüphe durumunda

[Gateway sistem durumu](/tr/gateway/health) bölümündeki CLI akışını kullanın (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) ve `web-heartbeat` / `web-reconnect`
ölçütlerine göre filtreleyerek `/tmp/openclaw/openclaw-*.log` günlüklerini canlı izleyin.

## İlgili

- [Gateway sistem durumu](/tr/gateway/health)
- [macOS uygulaması](/tr/platforms/macos)
