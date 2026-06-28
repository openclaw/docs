---
read_when:
    - Sesle uyandırma veya PTT yolları üzerinde çalışma
summary: Mac uygulamasında sesle uyandırma ve bas-konuş modları ile yönlendirme ayrıntıları
title: Sesle uyandırma (macOS)
x-i18n:
    generated_at: "2026-06-28T00:49:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Sesle Uyandırma ve Bas-Konuş

## Gereksinimler

Sesle Uyandırma ve bas-konuş macOS 26 veya daha yenisini gerektirir. Daha eski macOS sürümlerinde,
denetimler Voice ayarları sayfasından gizlenir ve bu sayfada macOS 26
gereksinimi gösterilir.

## Modlar

- **Uyandırma sözcüğü modu** (varsayılan): her zaman açık Speech tanıyıcısı tetikleyici belirteçleri (`swabbleTriggerWords`) bekler. Eşleşme olduğunda yakalamayı başlatır, kısmi metinle bindirmeyi gösterir ve sessizlikten sonra otomatik gönderir.
- **Bas-konuş (sağ Option basılı tutma)**: hemen yakalamak için sağ Option tuşunu basılı tutun; tetikleyici gerekmez. Basılı tutulurken bindirme görünür; bırakmak, metni ayarlayabilmeniz için kısa bir gecikmeden sonra sonlandırır ve iletir.

## Çalışma zamanı davranışı (uyandırma sözcüğü)

- Speech tanıyıcısı `VoiceWakeRuntime` içinde yaşar.
- Tetikleyici yalnızca uyandırma sözcüğü ile sonraki sözcük arasında **anlamlı bir duraklama** olduğunda çalışır (~0,55 sn boşluk). Bindirme/sesli uyarı, komut başlamadan önce bile duraklamada başlayabilir.
- Sessizlik pencereleri: konuşma akıyorsa 2,0 sn, yalnızca tetikleyici duyulduysa 5,0 sn.
- Kesin durdurma: kontrolden çıkan oturumları önlemek için 120 sn.
- Oturumlar arası debounce: 350 ms.
- Bindirme, kesinleşmiş/geçici renklendirme ile `VoiceWakeOverlayController` üzerinden yönetilir.
- Gönderimden sonra tanıyıcı, sonraki tetikleyiciyi dinlemek için temiz biçimde yeniden başlar.

## Yaşam döngüsü değişmezleri

- Sesle Uyandırma etkinse ve izinler verilmişse, uyandırma sözcüğü tanıyıcısı dinliyor olmalıdır (açık bir bas-konuş yakalaması sırası hariç).
- Bindirme görünürlüğü (X düğmesiyle elle kapatma dahil) tanıyıcının sürdürülmesini asla engellememelidir.

## Yapışkan bindirme hata modu (önceki)

Önceden, bindirme görünür halde takılı kalırsa ve elle kapatırsanız, Voice Wake "ölü" görünebilirdi; çünkü çalışma zamanının yeniden başlatma girişimi bindirme görünürlüğü tarafından engellenebilir ve sonraki yeniden başlatma zamanlanmayabilirdi.

Sağlamlaştırma:

- Uyandırma çalışma zamanı yeniden başlatması artık bindirme görünürlüğü tarafından engellenmez.
- Bindirme kapatma tamamlanması, `VoiceSessionCoordinator` üzerinden bir `VoiceWakeRuntime.refresh(...)` tetikler; bu nedenle X ile elle kapatma her zaman dinlemeyi sürdürür.

## Bas-konuş ayrıntıları

- Kısayol algılama, **sağ Option** (`keyCode 61` + `.option`) için genel bir `.flagsChanged` izleyicisi kullanır. Yalnızca olayları gözlemleriz (yutma yok).
- Yakalama hattı `VoicePushToTalk` içindedir: Speech'i hemen başlatır, kısmi sonuçları bindirmeye akıtır ve bırakmada `VoiceWakeForwarder` çağırır.
- Bas-konuş başladığında, rakip ses tap'lerini önlemek için uyandırma sözcüğü çalışma zamanını duraklatırız; bırakmadan sonra otomatik olarak yeniden başlar.
- İzinler: Mikrofon + Speech gerektirir; olayları görmek Erişilebilirlik/Giriş İzleme onayı gerektirir.
- Harici klavyeler: bazıları sağ Option tuşunu beklendiği gibi sunmayabilir; kullanıcılar kaçırılan algılamalar bildirirse bir yedek kısayol sunun.

## Kullanıcıya dönük ayarlar

- **Voice Wake** anahtarı: uyandırma sözcüğü çalışma zamanını etkinleştirir.
- **Konuşmak için Sağ Option'ı basılı tut**: bas-konuş izleyicisini etkinleştirir.
- Dil ve mikrofon seçiciler, canlı seviye ölçer, tetikleyici sözcük tablosu, test aracı (yalnızca yerel; iletmez).
- Mikrofon seçici, bir aygıtın bağlantısı kesilirse son seçimi korur, bağlantı kesildi ipucu gösterir ve aygıt geri dönene kadar geçici olarak sistem varsayılanına döner.
- **Sesler**: tetikleyici algılandığında ve gönderimde sesli uyarılar; varsayılan olarak macOS "Glass" sistem sesi kullanılır. Her olay için herhangi bir `NSSound` tarafından yüklenebilir dosya (örn. MP3/WAV/AIFF) seçebilir veya **Ses Yok** seçebilirsiniz.

## İletme davranışı

- Voice Wake etkin olduğunda, dökümler etkin gateway/agent'a iletilir (Mac uygulamasının geri kalanıyla aynı yerel ve uzak mod).
- Yanıtlar **son kullanılan ana sağlayıcıya** (WhatsApp/Telegram/Discord/WebChat) teslim edilir. Teslimat başarısız olursa hata günlüğe kaydedilir ve çalıştırma WebChat/oturum günlükleri üzerinden hâlâ görünür olur.

## İletme yükü

- `VoiceWakeForwarder.prefixedTranscript(_:)`, göndermeden önce makine ipucunu başa ekler. Uyandırma sözcüğü ve bas-konuş yolları arasında paylaşılır.

## Hızlı doğrulama

- Bas-konuşu açın, sağ Option'ı basılı tutun, konuşun, bırakın: bindirme kısmi sonuçları göstermeli ve sonra göndermelidir.
- Basılı tutarken menü çubuğu kulakları büyümüş kalmalıdır (`triggerVoiceEars(ttl:nil)` kullanır); bırakmadan sonra küçülürler.

## İlgili

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses bindirmesi](/tr/platforms/mac/voice-overlay)
- [macOS uygulaması](/tr/platforms/macos)
