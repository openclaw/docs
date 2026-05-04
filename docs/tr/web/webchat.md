---
read_when:
    - WebChat erişiminde hata ayıklama veya erişimi yapılandırma
summary: Sohbet kullanıcı arayüzü için Loopback WebChat statik barındırıcısı ve Gateway WS kullanımı
title: Web Sohbet
x-i18n:
    generated_at: "2026-05-04T07:10:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Durum: macOS/iOS SwiftUI sohbet UI'ı doğrudan Gateway WebSocket ile konuşur.

## Nedir

- Gateway için yerel bir sohbet UI'ı (gömülü tarayıcı ve yerel statik sunucu yok).
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Deterministik yönlendirme: yanıtlar her zaman WebChat'e geri gider.

## Hızlı başlangıç

1. Gateway'i başlatın.
2. WebChat UI'ını (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir Gateway kimlik doğrulama yolunun yapılandırıldığından emin olun (varsayılan olarak shared-secret,
   loopback üzerinde bile).

## Nasıl çalışır (davranış)

- UI, Gateway WebSocket'e bağlanır ve `chat.history`, `chat.send` ve `chat.inject` kullanır.
- `chat.history`, kararlılık için sınırlandırılmıştır: Gateway uzun metin alanlarını kısaltabilir, ağır metadata'yı atlayabilir ve aşırı büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- `chat.history`, modern yalnızca eklemeli oturum dosyaları için aktif transkript dalını izler; bu nedenle terk edilmiş yeniden yazma dalları ve yerine yenisi geçmiş prompt kopyaları WebChat'te işlenmez.
- Compaction girdileri, açık bir sıkıştırılmış geçmiş ayırıcısı olarak işlenir. Ayırıcı, önceki turların bir checkpoint içinde korunduğunu açıklar ve operatörlerin izinleri elverdiğinde Compaction öncesi görünümü dallandırabileceği veya geri yükleyebileceği Sessions checkpoint kontrollerine bağlantı verir.
- Control UI, `chat.history` tarafından döndürülen destekleyici Gateway `sessionId` değerini hatırlar ve takip eden `chat.send` çağrılarına bunu ekler; böylece kullanıcı bir oturum başlatmadıkça veya sıfırlamadıkça yeniden bağlanmalar ve sayfa yenilemeleri aynı saklanan konuşmayı sürdürür.
- Control UI, yeni bir `chat.send` çalıştırma kimliği üretmeden önce aynı oturum, mesaj ve ekler için yinelenen devam eden gönderimleri birleştirir; Gateway yine de aynı idempotency key'i yeniden kullanan tekrarlı istekleri tekilleştirir.
- Çalışma alanı başlangıç dosyaları ve bekleyen `BOOTSTRAP.md` talimatları, WebChat kullanıcı mesajına kopyalanmak yerine ajan sistem prompt'unun Project Context'i üzerinden sağlanır. Bootstrap kısaltması yalnızca kısa bir sistem prompt kurtarma bildirimi ekler; ayrıntılı sayılar ve yapılandırma düğmeleri tanılama yüzeylerinde kalır.
- `chat.history` ayrıca görüntüleme için normalleştirilir: yalnızca çalışma zamanı OpenClaw bağlamı,
  gelen zarf sarmalayıcıları, `[[reply_to_*]]` ve `[[audio_as_voice]]` gibi satır içi teslimat yönergesi etiketleri, düz metin tool-call XML
  payload'ları (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil) ve
  sızan ASCII/tam genişlikli model kontrol token'ları görünür metinden çıkarılır
  ve tüm görünür metni yalnızca tam sessiz
  token `NO_REPLY` / `no_reply` olan asistan girdileri atlanır.
- Reasoning olarak işaretlenmiş yanıt payload'ları (`isReasoning: true`) WebChat asistan içeriğinden, transkript yeniden oynatma metninden ve ses içerik bloklarından hariç tutulur; böylece yalnızca düşünme amaçlı payload'lar görünür asistan mesajları veya oynatılabilir ses olarak yüzeye çıkmaz.
- `chat.inject`, bir asistan notunu doğrudan transkripte ekler ve UI'a yayınlar (ajan çalıştırması yok).
- Durdurulan çalıştırmalar, kısmi asistan çıktısını UI'da görünür tutabilir.
- Gateway, arabelleğe alınmış çıktı olduğunda durdurulan kısmi asistan metnini transkript geçmişine kalıcı olarak yazar ve bu girdileri durdurma metadata'sı ile işaretler.
- Geçmiş her zaman Gateway'den alınır (yerel dosya izleme yok).
- Gateway'e ulaşılamıyorsa WebChat salt okunurdur.

### Transkript ve teslimat modeli

WebChat'in iki ayrı veri yolu vardır:

- Oturum JSONL dosyası, dayanıklı model/çalışma zamanı transkriptidir. Normal ajan çalıştırmaları için Pi, model tarafından görülebilen `user`, `assistant` ve `toolResult` mesajlarını oturum yöneticisi üzerinden kalıcılaştırır. WebChat bu transkripte keyfi teslimat, durum veya yardımcı metin yazmaz.
- Gateway `ReplyPayload` olayları canlı teslimat projeksiyonudur. WebChat/kanal görüntüleme, blok akışı, yönerge etiketleri, medya gömme, TTS/ses bayrakları ve UI fallback davranışı için normalleştirilebilirler. Kendileri kanonik oturum günlüğü değildir.
- WebChat, yalnızca Gateway normal bir Pi asistan turu dışında görüntülenen bir mesaja sahip olduğunda asistan transkript girdileri enjekte eder: `chat.inject`, ajan olmayan komut yanıtları, durdurulmuş kısmi çıktı ve WebChat tarafından yönetilen medya transkript ekleri.
- `chat.history`, saklanan oturum transkriptini okur ve WebChat görüntüleme projeksiyonunu uygular. Bir çalıştırma sırasında canlı asistan metni görünüp geçmiş yeniden yüklendikten sonra kayboluyorsa önce ham JSONL'nin asistan metnini içerip içermediğini, sonra `chat.history` projeksiyonunun bunu çıkarıp çıkarmadığını, ardından Control UI iyimser kuyruk birleştirmesinin yerel teslimat durumunu kalıcı snapshot ile değiştirip değiştirmediğini kontrol edin.

Normal ajan çalıştırması final yanıtları dayanıklı olmalıdır, çünkü Pi asistan `message_end` değerini yazar. Teslim edilen bir final payload'ını transkripte yansıtan herhangi bir fallback, önce Pi'ın zaten yazdığı bir asistan turunu çoğaltmaktan kaçınmalıdır.

## Control UI ajan araçları paneli

- Control UI `/agents` Tools panelinde iki ayrı görünüm vardır:
  - **Şu Anda Kullanılabilir** `tools.effective(sessionKey=...)` kullanır ve geçerli
    oturumun çalışma zamanında gerçekten ne kullanabileceğini gösterir; buna core, Plugin ve kanal sahibi araçlar dahildir.
  - **Araç Yapılandırması** `tools.catalog` kullanır ve profiller, geçersiz kılmalar ve
    katalog semantiğine odaklı kalır.
- Çalışma zamanı kullanılabilirliği oturum kapsamındadır. Aynı ajanda oturum değiştirmek
  **Şu Anda Kullanılabilir** listesini değiştirebilir.
- Yapılandırma düzenleyici çalışma zamanı kullanılabilirliği anlamına gelmez; etkili erişim yine de policy
  önceliğini (`allow`/`deny`, ajan başına ve provider/kanal geçersiz kılmaları) izler.

## Uzaktan kullanım

- Uzak mod, Gateway WebSocket'i SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma referansı (WebChat)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

WebChat seçenekleri:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` yanıtlarındaki metin alanları için maksimum karakter sayısı. Bir transkript girdisi bu sınırı aştığında Gateway uzun metin alanlarını kısaltır ve aşırı büyük mesajları bir yer tutucu ile değiştirebilir. İstemci, tek bir `chat.history` çağrısı için bu varsayılanı geçersiz kılmak üzere istek başına `maxChars` da gönderebilir.

İlgili global seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket host/port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret WebSocket kimlik doğrulaması.
- `gateway.auth.allowTailscale`: tarayıcı Control UI sohbet sekmesi, etkinleştirildiğinde Tailscale
  Serve kimlik başlıklarını kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkındalığı olan **non-loopback** proxy kaynağının arkasındaki tarayıcı istemcileri için reverse-proxy kimlik doğrulaması (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak Gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Dashboard](/tr/web/dashboard)
