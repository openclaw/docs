---
read_when:
    - mac uygulaması sağlık göstergelerinde hata ayıklama
summary: macOS uygulamasının gateway/Baileys sağlık durumlarını nasıl bildirdiği
title: Sağlık kontrolleri (macOS)
x-i18n:
    generated_at: "2026-04-24T09:19:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
---

# macOS üzerinde Sağlık Kontrolleri

Menü çubuğu uygulamasından bağlı kanalın sağlıklı olup olmadığını nasıl görebileceğiniz.

## Menü çubuğu

- Durum noktası artık Baileys sağlığını yansıtır:
  - Yeşil: bağlı + soket kısa süre önce açıldı.
  - Turuncu: bağlanıyor/yeniden deniyor.
  - Kırmızı: oturum kapatıldı veya yoklama başarısız oldu.
- İkincil satır `"linked · auth 12m"` okur veya hata nedenini gösterir.
- `"Run Health Check"` menü öğesi isteğe bağlı bir yoklama tetikler.

## Ayarlar

- General sekmesi artık bağlı auth yaşı, oturum deposu yolu/sayısı, son denetim zamanı, son hata/durum kodu ve Run Health Check / Reveal Logs düğmelerini gösteren bir Health kartı içerir.
- UI'nin anında yüklenmesi ve çevrimdışıyken sorunsuz şekilde geri dönmesi için önbelleğe alınmış anlık görüntü kullanır.
- **Channels sekmesi**, WhatsApp/Telegram için kanal durumu + denetimleri gösterir (giriş QR, çıkış, yoklama, son kopma/hata).

## Yoklama nasıl çalışır

- Uygulama, `ShellExecutor` üzerinden yaklaşık her 60 saniyede bir ve isteğe bağlı olarak `openclaw health --json` çalıştırır. Yoklama, mesaj göndermeden kimlik bilgilerini yükler ve durumu bildirir.
- Titremeyi önlemek için son iyi anlık görüntü ile son hatayı ayrı ayrı önbelleğe alın; her birinin zaman damgasını gösterin.

## Emin değilseniz

- [Gateway sağlığı](/tr/gateway/health) içindeki CLI akışını yine de kullanabilirsiniz (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) ve `web-heartbeat` / `web-reconnect` için `/tmp/openclaw/openclaw-*.log` dosyasını izleyebilirsiniz.

## İlgili

- [Gateway sağlığı](/tr/gateway/health)
- [macOS uygulaması](/tr/platforms/macos)
