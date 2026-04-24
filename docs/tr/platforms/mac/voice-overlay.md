---
read_when:
    - Ses katmanı davranışını ayarlama
summary: Uyandırma sözcüğü ve bas-konuş örtüştüğünde ses katmanı yaşam döngüsü
title: Ses katmanı
x-i18n:
    generated_at: "2026-04-24T09:20:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Ses Katmanı Yaşam Döngüsü (macOS)

Hedef kitle: macOS uygulama katkıcıları. Amaç: uyandırma sözcüğü ve bas-konuş çakıştığında ses katmanını öngörülebilir tutmak.

## Geçerli amaç

- Katman zaten uyandırma sözcüğünden dolayı görünürse ve kullanıcı kısayol tuşuna basarsa, kısayol oturumu mevcut metni sıfırlamak yerine _devralır_. Kısayol tuşu basılı tutulduğu sürece katman görünür kalır. Kullanıcı bıraktığında: kırpılmış metin varsa gönder, yoksa kapat.
- Yalnızca uyandırma sözcüğü sessizlikte otomatik göndermeye devam eder; bas-konuş ise bırakıldığında hemen gönderir.

## Uygulandı (9 Aralık 2025)

- Katman oturumları artık yakalama başına bir belirteç taşır (uyandırma sözcüğü veya bas-konuş). Belirteç eşleşmediğinde kısmi/son/gönder/kapat/seviye güncellemeleri düşürülür; böylece eski geri çağırmalar önlenir.
- Bas-konuş görünür tüm katman metinlerini bir önek olarak devralır (böylece uyandırma katmanı açıkken kısayol tuşuna basmak metni korur ve yeni konuşmayı ekler). Geçerli metne geri düşmeden önce son bir yazıya döküm için 1,5 saniyeye kadar bekler.
- Chime/katman günlükleri `voicewake.overlay`, `voicewake.ptt` ve `voicewake.chime` kategorilerinde `info` düzeyinde üretilir (oturum başlangıcı, kısmi, son, gönder, kapat, chime nedeni).

## Sonraki adımlar

1. **VoiceSessionCoordinator (actor)**
   - Aynı anda tam olarak bir `VoiceSession` sahibi olur.
   - API (belirteç tabanlı): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Eski belirteçler taşıyan geri çağırmaları düşürür (eski tanıyıcıların katmanı yeniden açmasını önler).
2. **VoiceSession (model)**
   - Alanlar: `token`, `source` (`wakeWord|pushToTalk`), commit edilmiş/geçici metin, chime bayrakları, zamanlayıcılar (auto-send, idle), `overlayMode` (`display|editing|sending`), bekleme süresi son tarihi.
3. **Katman bağlama**
   - `VoiceSessionPublisher` (`ObservableObject`) etkin oturumu SwiftUI’ye yansıtır.
   - `VoiceWakeOverlayView` yalnızca yayınlayıcı üzerinden oluşturur; asla genel singleton’ları doğrudan değiştirmez.
   - Katman kullanıcı eylemleri (`sendNow`, `dismiss`, `edit`) oturum belirteciyle birlikte koordinatöre geri çağrı yapar.
4. **Birleşik gönderme yolu**
   - `endCapture` sırasında: kırpılmış metin boşsa → kapat; değilse `performSend(session:)` (gönderme chime’ını bir kez çalar, iletir, kapatır).
   - Bas-konuş: gecikme yok; uyandırma sözcüğü: otomatik gönderim için isteğe bağlı gecikme.
   - Bas-konuş bittikten sonra uyandırma çalışma zamanına kısa bir bekleme süresi uygulayın, böylece uyandırma sözcüğü hemen yeniden tetiklenmez.
5. **Günlükleme**
   - Koordinatör, `ai.openclaw` alt sisteminde `voicewake.overlay` ve `voicewake.chime` kategorilerinde `.info` günlükleri üretir.
   - Temel olaylar: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Hata ayıklama denetim listesi

- Yapışkan katmanı yeniden üretirken günlükleri akıtın:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Yalnızca bir etkin oturum belirteci olduğunu doğrulayın; eski geri çağırmalar koordinatör tarafından düşürülmelidir.
- Bas-konuş bırakmanın her zaman etkin belirteçle `endCapture` çağırdığından emin olun; metin boşsa chime veya gönderme olmadan `dismiss` bekleyin.

## Taşıma adımları (önerilen)

1. `VoiceSessionCoordinator`, `VoiceSession` ve `VoiceSessionPublisher` ekleyin.
2. `VoiceWakeRuntime` bileşenini `VoiceWakeOverlayController`’a doğrudan dokunmak yerine oturum oluşturacak/güncelleyecek/bitirecek şekilde yeniden düzenleyin.
3. `VoicePushToTalk` bileşenini mevcut oturumları devralacak ve bırakıldığında `endCapture` çağıracak şekilde yeniden düzenleyin; çalışma zamanı bekleme süresi uygulayın.
4. `VoiceWakeOverlayController`’ı yayınlayıcıya bağlayın; çalışma zamanı/PTT’den gelen doğrudan çağrıları kaldırın.
5. Oturum devralma, bekleme süresi ve boş metin kapatma için entegrasyon testleri ekleyin.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Sesle uyandırma (macOS)](/tr/platforms/mac/voicewake)
- [Konuşma modu](/tr/nodes/talk)
