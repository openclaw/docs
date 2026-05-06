---
read_when:
    - Sesle uyandırma veya PTT yolları üzerinde çalışma
summary: Mac uygulamasında sesle uyandırma ve bas-konuş modları ile yönlendirme ayrıntıları
title: Sesle uyandırma (macOS)
x-i18n:
    generated_at: "2026-05-06T09:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Sesle Uyandırma ve Bas-Konuş

## Modlar

- **Uyandırma sözcüğü modu** (varsayılan): her zaman açık Speech tanıyıcı tetikleme belirteçlerini (`swabbleTriggerWords`) bekler. Eşleşme olduğunda yakalamayı başlatır, kısmi metinle birlikte katmanı gösterir ve sessizlikten sonra otomatik olarak gönderir.
- **Bas-konuş (Sağ Option basılı tutma)**: hemen yakalamak için sağ Option tuşunu basılı tutun; tetikleme gerekmez. Basılı tuttuğunuz sırada katman görünür; bıraktığınızda sonlandırılır ve metni düzenleyebilmeniz için kısa bir gecikmeden sonra iletilir.

## Çalışma zamanı davranışı (uyandırma sözcüğü)

- Speech tanıyıcı `VoiceWakeRuntime` içinde bulunur.
- Tetikleyici yalnızca uyandırma sözcüğü ile sonraki sözcük arasında **anlamlı bir duraklama** olduğunda çalışır (~0.55 sn boşluk). Katman/uyarı sesi, komut başlamadan önce bile duraklamada başlayabilir.
- Sessizlik pencereleri: konuşma akıyorsa 2.0 sn, yalnızca tetikleyici duyulduysa 5.0 sn.
- Zorunlu durdurma: kontrolden çıkan oturumları önlemek için 120 sn.
- Oturumlar arası debounce: 350 ms.
- Katman, işlenmiş/geçici renklendirme ile `VoiceWakeOverlayController` üzerinden yönetilir.
- Gönderimden sonra tanıyıcı, sonraki tetikleyiciyi dinlemek için temiz biçimde yeniden başlatılır.

## Yaşam döngüsü değişmezleri

- Voice Wake etkinse ve izinler verilmişse, uyandırma sözcüğü tanıyıcısı dinliyor olmalıdır (açık bir bas-konuş yakalaması sırasında hariç).
- Katman görünürlüğü (X düğmesiyle elle kapatma dahil), tanıyıcının sürdürülmesini asla engellememelidir.

## Yapışkan katman hata modu (önceki)

Önceden, katman görünür halde takılı kalır ve siz elle kapatırsanız Voice Wake "ölü" görünebilirdi; çünkü çalışma zamanının yeniden başlatma denemesi katman görünürlüğü tarafından engellenebilir ve sonraki bir yeniden başlatma zamanlanmayabilirdi.

Sağlamlaştırma:

- Wake çalışma zamanının yeniden başlatılması artık katman görünürlüğü tarafından engellenmez.
- Katman kapatma tamamlandığında `VoiceSessionCoordinator` üzerinden `VoiceWakeRuntime.refresh(...)` tetiklenir; böylece X ile elle kapatma her zaman dinlemeyi sürdürür.

## Bas-konuş ayrıntıları

- Kısayol algılama, **sağ Option** (`keyCode 61` + `.option`) için global bir `.flagsChanged` izleyicisi kullanır. Yalnızca olayları gözlemleriz (yutma yok).
- Yakalama hattı `VoicePushToTalk` içindedir: Speech'i hemen başlatır, kısmi sonuçları katmana akıtır ve bırakıldığında `VoiceWakeForwarder` çağırır.
- Bas-konuş başladığında, çakışan ses yakalamalarını önlemek için uyandırma sözcüğü çalışma zamanını duraklatırız; bırakıldıktan sonra otomatik olarak yeniden başlar.
- İzinler: Mikrofon + Speech gerektirir; olayları görmek için Accessibility/Input Monitoring onayı gerekir.
- Harici klavyeler: bazıları sağ Option tuşunu beklendiği gibi göstermeyebilir; kullanıcılar kaçırılan algılamalar bildirirse yedek bir kısayol sunun.

## Kullanıcıya yönelik ayarlar

- **Voice Wake** anahtarı: uyandırma sözcüğü çalışma zamanını etkinleştirir.
- **Konuşmak için Cmd+Fn tuşlarını basılı tut**: bas-konuş izleyicisini etkinleştirir. macOS < 26 üzerinde devre dışıdır.
- Dil ve mikrofon seçicileri, canlı seviye ölçer, tetikleme sözcüğü tablosu, test aracı (yalnızca yerel; iletmez).
- Mikrofon seçici, bir aygıt bağlantısı kesilirse son seçimi korur, bağlantı kesildi ipucu gösterir ve aygıt geri gelene kadar geçici olarak sistem varsayılanına döner.
- **Sesler**: tetikleyici algılandığında ve gönderimde uyarı sesleri; varsayılan olarak macOS "Glass" sistem sesini kullanır. Her olay için herhangi bir `NSSound` tarafından yüklenebilir dosya (ör. MP3/WAV/AIFF) seçebilir veya **Ses Yok** seçeneğini kullanabilirsiniz.

## İletme davranışı

- Voice Wake etkin olduğunda, dökümler etkin Gateway/ajan'a iletilir (Mac uygulamasının geri kalanında kullanılan aynı yerel ve uzak mod).
- Yanıtlar **son kullanılan ana sağlayıcıya** (WhatsApp/Telegram/Discord/WebChat) teslim edilir. Teslim başarısız olursa hata günlüğe yazılır ve çalıştırma WebChat/oturum günlükleri üzerinden hâlâ görünür olur.

## İletme yükü

- `VoiceWakeForwarder.prefixedTranscript(_:)`, göndermeden önce makine ipucunu başa ekler. Uyandırma sözcüğü ve bas-konuş yolları arasında ortaktır.

## Hızlı doğrulama

- Bas-konuşu açın, Cmd+Fn tuşlarını basılı tutun, konuşun, bırakın: katman kısmi sonuçları göstermeli ve ardından göndermelidir.
- Basılı tutarken menü çubuğu kulakları büyütülmüş kalmalıdır (`triggerVoiceEars(ttl:nil)` kullanır); bırakıldıktan sonra küçülürler.

## İlgili

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses katmanı](/tr/platforms/mac/voice-overlay)
- [macOS uygulaması](/tr/platforms/macos)
