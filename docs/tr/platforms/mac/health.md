---
read_when:
    - Mac uygulamasındaki sağlık göstergelerinde hata ayıklıyorsanız
summary: macOS uygulamasının gateway/Baileys sağlık durumlarını nasıl bildirdiği
title: Sağlık Denetimleri (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# macOS'ta Sağlık Denetimleri

Bağlı kanalın menü çubuğu uygulamasından sağlıklı olup olmadığını nasıl görebileceğiniz.

## Menü çubuğu

- Durum noktası artık Baileys sağlığını yansıtır:
  - Yeşil: bağlı + soket kısa süre önce açıldı.
  - Turuncu: bağlanıyor/yeniden deneniyor.
  - Kırmızı: oturum kapatıldı veya yoklama başarısız oldu.
- İkincil satır "bağlı · kimlik doğrulama 12 dk" şeklinde okunur veya başarısızlık nedenini gösterir.
- "Sağlık Denetimi Çalıştır" menü öğesi isteğe bağlı bir yoklamayı tetikler.

## Ayarlar

- Genel sekmesine şu bilgileri gösteren bir Sağlık kartı eklenir: bağlı kimlik doğrulama yaşı, oturum deposu yolu/sayısı, son denetim zamanı, son hata/durum kodu ve Sağlık Denetimi Çalıştır / Günlükleri Göster düğmeleri.
- Kullanıcı arayüzünün anında yüklenmesi için önbelleğe alınmış bir anlık görüntü kullanır ve çevrimdışıyken sorunsuz bir şekilde geri döner.
- **Kanallar sekmesi**, WhatsApp/Telegram için kanal durumunu + denetimleri gösterir (giriş QR'si, çıkış, yoklama, son bağlantı kesilmesi/hata).

## Yoklama nasıl çalışır

- Uygulama `ShellExecutor` aracılığıyla yaklaşık her 60 saniyede bir ve isteğe bağlı olarak `openclaw health --json` çalıştırır. Yoklama, mesaj göndermeden kimlik bilgilerini yükler ve durumu bildirir.
- Titremeyi önlemek için son iyi anlık görüntüyü ve son hatayı ayrı ayrı önbelleğe alın; her birinin zaman damgasını gösterin.

## Emin değilseniz

- [Gateway sağlığı](/tr/gateway/health) içindeki CLI akışını (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) kullanmaya devam edebilir ve `web-heartbeat` / `web-reconnect` için `/tmp/openclaw/openclaw-*.log` dosyasını izleyebilirsiniz.
