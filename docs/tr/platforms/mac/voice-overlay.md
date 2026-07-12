---
read_when:
    - Ses katmanı davranışını ayarlama
summary: Uyandırma sözcüğü ile bas-konuş çakıştığında ses katmanının yaşam döngüsü
title: Ses katmanı
x-i18n:
    generated_at: "2026-07-12T12:29:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Ses Katmanı Yaşam Döngüsü (macOS)

Hedef kitle: macOS uygulamasına katkıda bulunanlar. Amaç: uyandırma sözcüğü ile bas-konuş çakıştığında ses katmanının öngörülebilir davranmasını sağlamak.

## Davranış

- Katman uyandırma sözcüğü nedeniyle zaten görünür durumdaysa ve kullanıcı kısayol tuşuna basarsa, kısayol tuşu oturumu metni sıfırlamak yerine mevcut metni devralır. Kısayol tuşu basılı tutulduğu sürece katman görünür kalır. Tuş bırakıldığında: kırpılmış metin varsa gönderilir, aksi hâlde kapatılır.
- Yalnızca uyandırma sözcüğü kullanıldığında sessizlik üzerine otomatik gönderim yapılmaya devam edilir; bas-konuş ise tuş bırakıldığında hemen gönderir.

## Uygulama

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`), etkin ses oturumunun tek sahibidir. Bir actor değil, `@MainActor @Observable` singleton'dır. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Her oturum bir `UUID` belirteci taşır; eski veya eşleşmeyen bir belirteçle yapılan çağrılar yok sayılır.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) katmanı işler ve kullanıcı eylemlerini (`requestSend`, `dismiss`) oturum belirteci aracılığıyla koordinatöre geri iletir. Oturum durumunun sahibi hiçbir zaman kendisi olmaz.
- Bas-konuş (`VoicePushToTalk.begin()`), uyandırma katmanı açıkken kısayol tuşuna basıldığında metnin korunması ve yeni konuşmanın sonuna eklenmesi için görünür katmandaki metni (`VoiceSessionCoordinator.shared.snapshot()` aracılığıyla) `adoptedPrefix` olarak devralır. Tuş bırakıldığında, mevcut metne geri dönmeden önce nihai döküm için en fazla 1,5 saniye bekler.
- `dismiss` sırasında katman `VoiceSessionCoordinator.overlayDidDismiss` çağrısını yapar; bu da `VoiceWakeRuntime.refresh(state:)` çağrısını tetikler. Böylece X ile elle kapatma, boş metin nedeniyle kapatma ve gönderim sonrası kapatma işlemlerinin tümünde uyandırma sözcüğünü dinleme yeniden başlatılır.
- Birleşik gönderim yolu: kırpılmış metin boşsa kapatılır; aksi hâlde `sendNow` gönderim sesini bir kez çalar, `VoiceWakeForwarder` aracılığıyla iletir ve ardından katmanı kapatır.

## Günlük Kaydı

Ses alt sistemi `ai.openclaw`'dur; her bileşen kendi kategorisi altında günlük kaydı oluşturur:

| Kategori                | Bileşen                                         |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Bas-konuş kısayol tuşu ve ses yakalama          |
| `voicewake.runtime`     | Uyandırma sözcüğü çalışma zamanı                 |
| `voicewake.chime`       | Uyarı sesi çalma                                 |
| `voicewake.sync`        | Genel ayarların eşitlenmesi                      |
| `voicewake.forward`     | Dökümün iletilmesi                               |
| `voicewake.meter`       | Mikrofon düzeyi izleyicisi                       |

## Hata ayıklama kontrol listesi

- Kalıcı bir katman sorununu yeniden oluştururken günlük kayıtlarını akış hâlinde izleyin:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Yalnızca bir etkin oturum belirteci bulunduğunu doğrulayın; eski geri çağırmalar koordinatör tarafından yok sayılır.
- Bas-konuş tuşu bırakıldığında her zaman etkin belirteçle `end()` çağrıldığını doğrulayın; metin boşsa uyarı sesi çalınmadan veya gönderim yapılmadan katmanın kapatılması beklenir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Sesle uyandırma (macOS)](/tr/platforms/mac/voicewake)
- [Konuşma modu](/tr/nodes/talk)
