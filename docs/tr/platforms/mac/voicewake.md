---
read_when:
    - Voice wake veya PTT yolları üzerinde çalışıyorsunuz
summary: mac uygulamasında Voice wake ve push-to-talk modları ile yönlendirme ayrıntıları
title: Voice wake (macOS)
x-i18n:
    generated_at: "2026-04-24T09:20:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice Wake & Push-to-Talk

## Modlar

- **Wake-word modu** (varsayılan): her zaman açık Speech tanıyıcısı tetikleyici token'ları (`swabbleTriggerWords`) bekler. Eşleşme olduğunda yakalamayı başlatır, kısmi metinle birlikte overlay'i gösterir ve sessizlikten sonra otomatik gönderir.
- **Push-to-talk (sağ Option tuşunu basılı tutma)**: hemen yakalamak için sağ Option tuşunu basılı tutun — tetikleyici gerekmez. Basılı tutulurken overlay görünür; bırakmak kısa bir gecikmeden sonra sonlandırır ve iletir, böylece metni ayarlayabilirsiniz.

## Çalışma zamanı davranışı (wake-word)

- Speech tanıyıcısı `VoiceWakeRuntime` içinde yaşar.
- Tetikleyici yalnızca uyandırma sözcüğü ile sonraki sözcük arasında **anlamlı bir duraklama** olduğunda çalışır (~0.55s boşluk). Komut başlamadan önce bile duraklamada overlay/zil başlayabilir.
- Sessizlik pencereleri: konuşma akıyorsa 2.0s, yalnızca tetikleyici duyulduysa 5.0s.
- Sert durdurma: kontrolden çıkan oturumları önlemek için 120s.
- Oturumlar arası debounce: 350ms.
- Overlay, committed/volatile renklendirme ile `VoiceWakeOverlayController` üzerinden sürülür.
- Göndermeden sonra tanıyıcı, sonraki tetikleyiciyi dinlemek için temiz şekilde yeniden başlar.

## Yaşam döngüsü değişmezleri

- Voice Wake etkinse ve izinler verilmişse, wake-word tanıyıcısı dinliyor olmalıdır (açık bir push-to-talk yakalaması sırasında hariç).
- Overlay görünürlüğü (X düğmesiyle manuel kapatma dahil) tanıyıcının yeniden başlamasını asla engellememelidir.

## Yapışkan overlay hata modu (önceki)

Daha önce, overlay görünür durumda takılı kalır ve siz bunu elle kapatırsanız Voice Wake “ölü” gibi görünebilirdi çünkü çalışma zamanının yeniden başlatma denemesi overlay görünürlüğü tarafından engellenebilir ve sonrasında başka bir yeniden başlatma planlanmazdı.

Sertleştirme:

- Wake çalışma zamanı yeniden başlatması artık overlay görünürlüğü tarafından engellenmiyor.
- Overlay kapatma tamamlanması, `VoiceSessionCoordinator` üzerinden bir `VoiceWakeRuntime.refresh(...)` tetikler; böylece manuel X ile kapatma her zaman dinlemeyi yeniden başlatır.

## Push-to-talk ayrıntıları

- Hotkey algılama, **sağ Option** için global bir `.flagsChanged` izleyicisi kullanır (`keyCode 61` + `.option`). Yalnızca olayları gözlemleriz (engelleme yok).
- Yakalama hattı `VoicePushToTalk` içinde yaşar: Speech'i hemen başlatır, kısmi sonuçları overlay'e akıtır ve bırakmada `VoiceWakeForwarder` çağırır.
- Push-to-talk başladığında düello eden ses tap'lerini önlemek için wake-word çalışma zamanını duraklatırız; bırakmadan sonra otomatik yeniden başlar.
- İzinler: Mikrofon + Speech gerekir; olayları görmek için Accessibility/Input Monitoring onayı gerekir.
- Harici klavyeler: bazıları sağ Option'u beklendiği gibi sunmayabilir — kullanıcılar kaçırma bildirirse yedek kısayol sunun.

## Kullanıcıya dönük ayarlar

- **Voice Wake** anahtarı: wake-word çalışma zamanını etkinleştirir.
- **Hold Cmd+Fn to talk**: push-to-talk izleyicisini etkinleştirir. macOS < 26 üzerinde devre dışıdır.
- Dil ve mikrofon seçicileri, canlı seviye ölçeri, tetikleyici sözcük tablosu, test aracı (yalnızca yerel; iletmez).
- Mic picker, bir cihaz bağlantısı kesilirse son seçimi korur, bağlantı kesildi ipucunu gösterir ve cihaz geri dönene kadar geçici olarak sistem varsayılanına fallback yapar.
- **Sounds**: tetik algılama ve gönderimde zil sesleri; varsayılan olarak macOS “Glass” sistem sesi kullanılır. Her olay için `NSSound` ile yüklenebilir herhangi bir dosyayı (ör. MP3/WAV/AIFF) seçebilir veya **No Sound** seçebilirsiniz.

## İletme davranışı

- Voice Wake etkin olduğunda transcript'ler etkin gateway/aracıya iletilir (mac uygulamasının geri kalanında kullanılan aynı yerel ve uzak mod).
- Yanıtlar **en son kullanılan ana sağlayıcıya** teslim edilir (WhatsApp/Telegram/Discord/WebChat). Teslim başarısız olursa hata günlüğe kaydedilir ve çalışma yine de WebChat/oturum günlüklerinde görünür.

## İletme payload'u

- `VoiceWakeForwarder.prefixedTranscript(_:)`, göndermeden önce makine ipucunu başa ekler. Wake-word ve push-to-talk yolları arasında paylaşılır.

## Hızlı doğrulama

- Push-to-talk'u açın, Cmd+Fn'i basılı tutun, konuşun, bırakın: overlay kısmi sonuçları göstermeli ve ardından göndermelidir.
- Basılı tutarken menü çubuğu kulakları büyümüş kalmalıdır (`triggerVoiceEars(ttl:nil)` kullanır); bırakmadan sonra inerler.

## İlgili

- [Voice wake](/tr/nodes/voicewake)
- [Voice overlay](/tr/platforms/mac/voice-overlay)
- [macOS app](/tr/platforms/macos)
