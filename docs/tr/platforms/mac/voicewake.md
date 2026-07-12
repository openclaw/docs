---
read_when:
    - Sesle uyandırma veya bas-konuş (PTT) yolları üzerinde çalışma
summary: Mac uygulamasında sesle uyandırma ve bas-konuş modlarının yanı sıra yönlendirme ayrıntıları
title: Sesle uyandırma (macOS)
x-i18n:
    generated_at: "2026-07-12T12:27:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Sesle Uyandırma ve Bas-Konuş

## Gereksinimler

Sesle Uyandırma ve bas-konuş için macOS 26 veya daha yeni bir sürüm gerekir. Daha eski macOS sürümlerinde denetimler Ses ayarları sayfasında gizlenir ve bunun yerine macOS 26 gereksinimi gösterilir.

## Modlar

- **Uyandırma sözcüğü modu** (varsayılan): Her zaman açık bir Konuşma tanıyıcı, tetikleyici belirteçleri (`swabbleTriggerWords`) bekler. Eşleşme olduğunda yakalamayı başlatır, kısmi metni içeren katmanı gösterir ve sessizlikten sonra otomatik olarak gönderir.
- **Bas-konuş (sağ Option tuşunu basılı tutun)**: Tetikleyici gerekmeksizin hemen yakalamak için sağ Option tuşunu basılı tutun. Katman, tuş basılı tutulduğu sürece görünür; tuş bırakıldığında metni düzenleyebilmeniz için kısa bir gecikmenin ardından yakalama sonlandırılır ve iletilir.

## Çalışma zamanı davranışı (uyandırma sözcüğü)

- Tanıyıcı `VoiceWakeRuntime` içinde bulunur.
- Tetikleyici yalnızca uyandırma sözcüğü ile sonraki sözcük arasında anlamlı bir duraklama olduğunda çalışır (`triggerPauseWindow` = 0,55 sn). Katman/zil sesi, komut başlamadan önce bile duraklama sırasında başlayabilir.
- Sessizlik aralıkları: konuşma sürerken 2,0 sn (`silenceWindow`), yalnızca tetikleyici duyulduysa 5,0 sn (`triggerOnlySilenceWindow`).
- Kesin durdurma: kontrolden çıkan oturumları önlemek için 120 sn (`captureHardStop`).
- Oturumlar arası geri tepme önleme: gönderimden sonra 350 ms (`debounceAfterSend`).
- Katman, kesinleşmiş/geçici metin renklendirmesiyle `VoiceWakeOverlayController` üzerinden yönetilir.
- Gönderimden sonra tanıyıcı, sonraki tetikleyiciyi dinlemek üzere temiz biçimde yeniden başlatılır.

## Yaşam döngüsü değişmezleri

- Sesle Uyandırma etkinse ve izinler verilmişse uyandırma sözcüğü tanıyıcısı, etkin bir bas-konuş yakalaması dışında dinlemeyi sürdürür.
- X düğmesiyle elle kapatma dâhil olmak üzere katmanın kapatılması, tanıyıcıyı her zaman devam ettirir: `VoiceSessionCoordinator.overlayDidDismiss`, tüm kapatma yollarında `VoiceWakeRuntime.refresh(state:)` çağrısını yapar. Oturum/belirteç modeli için [Ses katmanı](/tr/platforms/mac/voice-overlay) bölümüne bakın.

## Bas-konuş ayrıntıları

- Kısayol tuşu algılama, sağ Option için (`keyCode 61` + `.option`) genel bir `.flagsChanged` izleyicisi kullanır. Yalnızca olayları gözlemler, hiçbir zaman engellemez.
- Yakalama `VoicePushToTalk` içinde gerçekleşir: Konuşma'yı hemen başlatır, kısmi sonuçları katmana aktarır ve tuş bırakıldığında `VoiceWakeForwarder` çağrısını yapar.
- Bas-konuşun başlatılması, çakışan ses dinleyicilerini önlemek için uyandırma sözcüğü çalışma zamanını duraklatır; tuş bırakıldıktan sonra otomatik olarak yeniden başlatılır.
- İzinler: Mikrofon + Konuşma gerekir; tuş olaylarını almak için Erişilebilirlik/Giriş İzleme onayı gerekir.
- Harici klavyeler: Bazıları sağ Option tuşunu beklendiği gibi sunmaz. Kullanıcılar algılama sorunları bildirirse yedek bir kısayol sunun.

## Kullanıcıya yönelik ayarlar

- **Sesle Uyandırma** anahtarı: uyandırma sözcüğü çalışma zamanını etkinleştirir.
- **Konuşmak için sağ Option tuşunu basılı tutun**: bas-konuş izleyicisini etkinleştirir.
- Dil ve mikrofon seçicileri, canlı seviye ölçer, tetikleyici sözcük tablosu ve sınayıcı (yalnızca yerel, hiçbir zaman iletmez).
- Mikrofon seçici, bir aygıtın bağlantısı kesilirse son seçimi korur, bağlantının kesildiğine ilişkin bir ipucu gösterir ve aygıt geri dönene kadar geçici olarak sistem varsayılanına geçer.
- **Sesler**: tetikleyici algılandığında ve gönderimde zil sesi çalar; varsayılan olarak macOS "Glass" sistem sesi kullanılır. Her olay için `NSSound` tarafından yüklenebilen herhangi bir dosyayı (ör. MP3/WAV/AIFF) seçin veya **Ses Yok** seçeneğini belirleyin.

## İletme davranışı

- İletme sırasında `VoiceWakeForwarder.selectedSessionOptions`, ayarlanmışsa etkin WebChat oturum anahtarını, aksi takdirde Gateway'in ana oturum anahtarını seçer.
- Bu oturumu `sessions.list` aracılığıyla arar ve teslimat kanalını ve hedefi oturumun teslimat bağlamından türetir (önce son kanalına/hedefine, ardından ayrıştırılmış bir oturum anahtarına geri döner); hiçbir şey çözümlenemezse varsayılan olarak WebChat'i kullanır.
- Teslimat başarısız olursa hata günlüğe kaydedilir (`voicewake.forward` kategorisi) ve çalıştırma WebChat/oturum günlükleri üzerinden yine de görülebilir.

## İletme yükü

- `VoiceWakeForwarder.prefixedTranscript(_:)`, dökümden önce makine ipucu satırı (çözümlenmiş ana makine adı; çözümlenemezse "bu Mac") ekler; bu davranış uyandırma sözcüğü ve bas-konuş yolları arasında ortaktır.

## Hızlı doğrulama

- Bas-konuşu açın, sağ Option tuşunu basılı tutun, konuşun ve bırakın: katman önce kısmi sonuçları göstermeli, ardından göndermelidir.
- Tuşu basılı tutarken menü çubuğundaki kulaklar büyütülmüş durumda kalmalıdır (`triggerVoiceEars(ttl: nil)`); tuş bırakıldıktan sonra küçülürler.

## İlgili

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses katmanı](/tr/platforms/mac/voice-overlay)
- [macOS uygulaması](/tr/platforms/macos)
