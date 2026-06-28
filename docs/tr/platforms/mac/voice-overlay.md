---
read_when:
    - Ses katmanı davranışını ayarlama
summary: Uyandırma sözcüğü ve bas-konuş çakıştığında ses bindirmesi yaşam döngüsü
title: Ses katmanı
x-i18n:
    generated_at: "2026-05-06T09:22:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Ses Kaplaması Yaşam Döngüsü (macOS)

Kitle: macOS uygulaması katkıda bulunanları. Amaç: uyandırma sözcüğü ve bas-konuş çakıştığında ses kaplamasını öngörülebilir tutmak.

## Mevcut amaç

- Kaplama uyandırma sözcüğü nedeniyle zaten görünür durumdaysa ve kullanıcı kısayol tuşuna basarsa, kısayol tuşu oturumu mevcut metni sıfırlamak yerine _devralır_. Kısayol tuşu basılı tutulduğu sürece kaplama açık kalır. Kullanıcı bıraktığında: kırpılmış metin varsa gönder, yoksa kapat.
- Yalnızca uyandırma sözcüğü hâlâ sessizlikte otomatik gönderir; bas-konuş bırakıldığında hemen gönderir.

## Uygulandı (9 Aralık 2025)

- Kaplama oturumları artık her yakalama için bir token taşır (uyandırma sözcüğü veya bas-konuş). Token eşleşmediğinde kısmi/son/gönder/kapat/seviye güncellemeleri atılır; böylece bayat geri çağrılar önlenir.
- Bas-konuş, görünür durumdaki kaplama metnini ön ek olarak devralır (yani uyandırma kaplaması açıkken kısayol tuşuna basmak metni korur ve yeni konuşmayı ekler). Mevcut metne geri dönmeden önce son transcript için 1,5 saniyeye kadar bekler.
- Zil/kaplama günlükleri `voicewake.overlay`, `voicewake.ptt` ve `voicewake.chime` kategorilerinde `info` düzeyinde yayımlanır (oturum başlangıcı, kısmi, son, gönder, kapat, zil nedeni).

## Sonraki adımlar

1. **VoiceSessionCoordinator (actor)**
   - Aynı anda tam olarak bir `VoiceSession` sahibi olur.
   - API (token tabanlı): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Bayat token taşıyan geri çağrıları atar (eski tanıyıcıların kaplamayı yeniden açmasını önler).
2. **VoiceSession (model)**
   - Alanlar: `token`, `source` (wakeWord|pushToTalk), işlenmiş/geçici metin, zil bayrakları, zamanlayıcılar (otomatik gönderme, boşta), `overlayMode` (display|editing|sending), bekleme süresi son tarihi.
3. **Kaplama bağlama**
   - `VoiceSessionPublisher` (`ObservableObject`) etkin oturumu SwiftUI içine yansıtır.
   - `VoiceWakeOverlayView` yalnızca publisher üzerinden işler; global singleton’ları asla doğrudan değiştirmez.
   - Kaplama kullanıcı eylemleri (`sendNow`, `dismiss`, `edit`) oturum token’ı ile koordinatöre geri çağrı yapar.
4. **Birleşik gönderme yolu**
   - `endCapture` sırasında: kırpılmış metin boşsa → kapat; değilse `performSend(session:)` (gönderme zilini bir kez çalar, iletir, kapatır).
   - Bas-konuş: gecikme yok; uyandırma sözcüğü: otomatik gönderme için isteğe bağlı gecikme.
   - Bas-konuş bittikten sonra uyandırma çalışma zamanına kısa bir bekleme süresi uygula; böylece uyandırma sözcüğü hemen yeniden tetiklenmez.
5. **Günlükleme**
   - Koordinatör, `ai.openclaw` alt sisteminde, `voicewake.overlay` ve `voicewake.chime` kategorilerinde `.info` günlükleri yayımlar.
   - Anahtar olaylar: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Hata ayıklama kontrol listesi

- Takılı kalan bir kaplamayı yeniden üretirken günlükleri akış olarak izle:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Yalnızca bir etkin oturum token’ı olduğunu doğrula; bayat geri çağrılar koordinatör tarafından atılmalıdır.
- Bas-konuş bırakma işleminin etkin token ile her zaman `endCapture` çağırdığından emin ol; metin boşsa zil veya gönderme olmadan `dismiss` bekle.

## Geçiş adımları (önerilen)

1. `VoiceSessionCoordinator`, `VoiceSession` ve `VoiceSessionPublisher` ekle.
2. `VoiceWakeOverlayController` öğesine doğrudan dokunmak yerine oturumlar oluşturacak/güncelleyecek/sonlandıracak şekilde `VoiceWakeRuntime` öğesini yeniden düzenle.
3. Mevcut oturumları devralacak ve bırakıldığında `endCapture` çağıracak şekilde `VoicePushToTalk` öğesini yeniden düzenle; çalışma zamanı bekleme süresini uygula.
4. `VoiceWakeOverlayController` öğesini publisher’a bağla; çalışma zamanı/PTT tarafından yapılan doğrudan çağrıları kaldır.
5. Oturum devralma, bekleme süresi ve boş metin kapatma için entegrasyon testleri ekle.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Sesle uyandırma (macOS)](/tr/platforms/mac/voicewake)
- [Konuşma modu](/tr/nodes/talk)
