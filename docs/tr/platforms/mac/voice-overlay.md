---
read_when:
    - Ses katmanı davranışını ayarlarken
summary: Uyandırma sözcüğü ve bas-konuş çakıştığında ses katmanı yaşam döngüsü
title: Ses Katmanı
x-i18n:
    generated_at: "2026-04-05T14:00:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Ses Katmanı Yaşam Döngüsü (macOS)

Hedef kitle: macOS uygulaması katkıcıları. Amaç: uyandırma sözcüğü ve bas-konuş çakıştığında ses katmanını öngörülebilir tutmak.

## Mevcut amaç

- Katman zaten uyandırma sözcüğü nedeniyle görünür durumdaysa ve kullanıcı kısayol tuşuna basarsa, kısayol oturumu metni sıfırlamak yerine mevcut metni _devralır_. Kısayol tuşu basılı tutulduğu sürece katman görünür kalır. Kullanıcı bıraktığında: kırpılmış metin varsa gönder, aksi takdirde kapat.
- Yalnızca uyandırma sözcüğü hâlâ sessizlikte otomatik gönderir; bas-konuş ise bırakıldığında hemen gönderir.

## Uygulananlar (9 Aralık 2025)

- Katman oturumları artık her yakalama için bir token taşır (uyandırma sözcüğü veya bas-konuş). Token eşleşmediğinde kısmi/son/gönder/kapat/seviye güncellemeleri bırakılır; böylece eski geri çağrılar önlenir.
- Bas-konuş, görünür durumdaki tüm katman metnini önek olarak devralır (böylece uyandırma katmanı açıkken kısayol tuşuna basmak metni korur ve yeni konuşmayı ekler). Mevcut metne geri dönmeden önce son transkript için 1,5 saniyeye kadar bekler.
- Chime/katman günlük kaydı `voicewake.overlay`, `voicewake.ptt` ve `voicewake.chime` kategorilerinde `info` düzeyinde üretilir (oturum başlangıcı, kısmi, son, gönder, kapat, chime nedeni).

## Sonraki adımlar

1. **VoiceSessionCoordinator (actor)**
   - Aynı anda tam olarak bir `VoiceSession` sahibi olur.
   - API (token tabanlı): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Eski token taşıyan geri çağrıları bırakır (eski tanıyıcıların katmanı yeniden açmasını önler).
2. **VoiceSession (model)**
   - Alanlar: `token`, `source` (wakeWord|pushToTalk), kesinleşmiş/geçici metin, chime işaretleri, zamanlayıcılar (otomatik gönderme, boşta), `overlayMode` (display|editing|sending), bekleme süresi son tarihi.
3. **Katman bağlama**
   - `VoiceSessionPublisher` (`ObservableObject`) etkin oturumu SwiftUI'ye yansıtır.
   - `VoiceWakeOverlayView` yalnızca publisher üzerinden oluşturulur; global singleton'ları asla doğrudan değiştirmez.
   - Katman kullanıcı işlemleri (`sendNow`, `dismiss`, `edit`) oturum token'ı ile coordinator'a geri çağrı yapar.
4. **Birleşik gönderme yolu**
   - `endCapture` sırasında: kırpılmış metin boşsa → kapat; değilse `performSend(session:)` (gönderme chime'ını bir kez çalar, iletir, kapatır).
   - Bas-konuş: gecikme yok; uyandırma sözcüğü: otomatik gönderme için isteğe bağlı gecikme.
   - Bas-konuş bittikten sonra uyandırma çalışma zamanına kısa bir bekleme süresi uygulayın; böylece uyandırma sözcüğü hemen yeniden tetiklenmez.
5. **Günlük kaydı**
   - Coordinator, `ai.openclaw` alt sistemi altında `voicewake.overlay` ve `voicewake.chime` kategorilerinde `.info` günlükleri üretir.
   - Temel olaylar: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Hata ayıklama kontrol listesi

- Yapışkan bir katmanı yeniden üretirken günlükleri akış halinde izleyin:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Yalnızca bir etkin oturum token'ı olduğunu doğrulayın; eski geri çağrılar coordinator tarafından bırakılmalıdır.
- Bas-konuş bırakmanın her zaman etkin token ile `endCapture` çağırdığından emin olun; metin boşsa chime veya gönderme olmadan `dismiss` bekleyin.

## Geçiş adımları (önerilen)

1. `VoiceSessionCoordinator`, `VoiceSession` ve `VoiceSessionPublisher` ekleyin.
2. `VoiceWakeRuntime` yapısını `VoiceWakeOverlayController` öğesine doğrudan dokunmak yerine oturum oluşturacak/güncelleyecek/bitirecek şekilde yeniden düzenleyin.
3. `VoicePushToTalk` yapısını mevcut oturumları devralacak ve bırakıldığında `endCapture` çağıracak şekilde yeniden düzenleyin; çalışma zamanı bekleme süresini uygulayın.
4. `VoiceWakeOverlayController` öğesini publisher'a bağlayın; runtime/PTT'den gelen doğrudan çağrıları kaldırın.
5. Oturum devralma, bekleme süresi ve boş metin kapatma için entegrasyon testleri ekleyin.
