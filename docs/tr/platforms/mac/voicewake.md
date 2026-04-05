---
read_when:
    - Sesle uyandırma veya PTT yolları üzerinde çalışma
summary: mac uygulamasında sesle uyandırma ve bas-konuş modları ile yönlendirme ayrıntıları
title: Sesle Uyandırma (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: fed6524a2e1fad5373d34821c920b955a2b5a3fcd9c51cdb97cf4050536602a7
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Sesle Uyandırma ve Bas-Konuş

## Modlar

- **Uyandırma sözcüğü modu** (varsayılan): her zaman açık Speech tanıyıcısı, tetikleyici belirteçleri (`swabbleTriggerWords`) bekler. Eşleşme olduğunda yakalamayı başlatır, kısmi metinle birlikte katmanı gösterir ve sessizlikten sonra otomatik olarak gönderir.
- **Bas-konuş (sağ Option tuşunu basılı tutma)**: hemen yakalama için sağ Option tuşunu basılı tutun; tetikleyici gerekmez. Basılı tutulduğu sürece katman görünür; bıraktığınızda sonlandırılır ve metni düzenleyebilmeniz için kısa bir gecikmenin ardından iletilir.

## Çalışma zamanı davranışı (uyandırma sözcüğü)

- Speech tanıyıcısı `VoiceWakeRuntime` içinde bulunur.
- Tetikleme yalnızca uyandırma sözcüğü ile sonraki sözcük arasında **anlamlı bir duraklama** olduğunda gerçekleşir (~0.55 sn boşluk). Katman/sesli uyarı, komut başlamadan önce bile bu duraklamada başlayabilir.
- Sessizlik pencereleri: konuşma akıyorsa 2.0 sn, yalnızca tetikleyici duyulduysa 5.0 sn.
- Kesin durdurma: kontrolsüz oturumları önlemek için 120 sn.
- Oturumlar arası debounce: 350 ms.
- Katman, işlenmiş/geçici renklendirme ile `VoiceWakeOverlayController` üzerinden yönetilir.
- Gönderimden sonra tanıyıcı, sonraki tetikleyiciyi dinlemek için temiz biçimde yeniden başlar.

## Yaşam döngüsü değişmezleri

- Sesle Uyandırma etkinse ve izinler verilmişse, uyandırma sözcüğü tanıyıcısı dinliyor olmalıdır (açık bir bas-konuş yakalaması sırasında dışında).
- Katmanın görünürlüğü (X düğmesiyle elle kapatma dahil) tanıyıcının yeniden başlamasını hiçbir zaman engellememelidir.

## Yapışkan katman hata modu (önceki)

Önceden, katman görünür durumda takılı kalır ve siz onu elle kapatırsanız, çalışma zamanının yeniden başlatma girişimi katman görünürlüğü tarafından engellenebildiği ve sonrasında yeni bir yeniden başlatma planlanmadığı için Sesle Uyandırma “ölü” gibi görünebilirdi.

Güçlendirme:

- Uyandırma çalışma zamanının yeniden başlatılması artık katman görünürlüğü tarafından engellenmiyor.
- Katman kapatma tamamlanınca `VoiceSessionCoordinator` aracılığıyla `VoiceWakeRuntime.refresh(...)` tetikleniyor; böylece X ile elle kapatma her zaman yeniden dinlemeye dönüyor.

## Bas-konuş ayrıntıları

- Kısayol tuşu algılama, **sağ Option** için genel bir `.flagsChanged` izleyicisi kullanır (`keyCode 61` + `.option`). Olayları yalnızca gözlemleriz (engelleme yok).
- Yakalama işlem hattı `VoicePushToTalk` içinde bulunur: Speech'i hemen başlatır, kısmi sonuçları katmana aktarır ve bırakıldığında `VoiceWakeForwarder` çağırır.
- Bas-konuş başladığında çakışan ses tap'lerini önlemek için uyandırma sözcüğü çalışma zamanını duraklatırız; bırakıldıktan sonra otomatik olarak yeniden başlar.
- İzinler: Mikrofon + Speech gerektirir; olayları görmek için Accessibility/Input Monitoring onayı gerekir.
- Harici klavyeler: bazıları sağ Option tuşunu beklendiği gibi göstermeyebilir; kullanıcılar kaçırma bildirirse yedek bir kısayol sunun.

## Kullanıcıya dönük ayarlar

- **Sesle Uyandırma** geçişi: uyandırma sözcüğü çalışma zamanını etkinleştirir.
- **Konuşmak için Cmd+Fn basılı tut**: bas-konuş izleyicisini etkinleştirir. macOS < 26 sürümlerinde devre dışıdır.
- Dil ve mikrofon seçicileri, canlı seviye ölçeri, tetikleyici sözcük tablosu, test aracı (yalnızca yerel; iletmez).
- Mikrofon seçici, bir cihaz bağlantısı kesildiğinde son seçimi korur, bağlantı kesildi ipucu gösterir ve cihaz geri dönene kadar geçici olarak sistem varsayılanına döner.
- **Sesler**: tetik algılandığında ve gönderimde sesli uyarılar çalar; varsayılan olarak macOS “Glass” sistem sesi kullanılır. Her olay için `NSSound` ile yüklenebilen herhangi bir dosyayı (ör. MP3/WAV/AIFF) seçebilir veya **No Sound** seçeneğini kullanabilirsiniz.

## İletme davranışı

- Sesle Uyandırma etkin olduğunda, dökümler etkin gateway/ajana iletilir (mac uygulamasının geri kalanında kullanılan aynı yerel veya uzak mod).
- Yanıtlar, **en son kullanılan ana sağlayıcıya** teslim edilir (WhatsApp/Telegram/Discord/WebChat). Teslimat başarısız olursa hata günlüğe kaydedilir ve çalışma yine de WebChat/oturum günlükleri üzerinden görünür.

## İletme yükü

- `VoiceWakeForwarder.prefixedTranscript(_:)`, göndermeden önce makine ipucunu başa ekler. Uyandırma sözcüğü ve bas-konuş yolları arasında ortaktır.

## Hızlı doğrulama

- Bas-konuşu açın, Cmd+Fn basılı tutun, konuşun, bırakın: katman kısmi metinleri göstermeli ve ardından göndermelidir.
- Basılı tutarken menü çubuğundaki kulaklar büyümüş kalmalıdır (`triggerVoiceEars(ttl:nil)` kullanır); bırakıldıktan sonra eski hâline döner.
