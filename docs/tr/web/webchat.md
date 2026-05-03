---
read_when:
    - WebChat erişiminde hata ayıklama veya erişimi yapılandırma
summary: Sohbet kullanıcı arayüzü için Loopback WebChat statik barındırıcısı ve Gateway WS kullanımı
title: Web Sohbeti
x-i18n:
    generated_at: "2026-05-03T09:01:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Durum: macOS/iOS SwiftUI sohbet kullanıcı arayüzü doğrudan Gateway WebSocket ile konuşur.

## Nedir

- Gateway için yerel bir sohbet kullanıcı arayüzü (gömülü tarayıcı ve yerel statik sunucu yok).
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Deterministik yönlendirme: yanıtlar her zaman WebChat'e geri gider.

## Hızlı başlangıç

1. Gateway'i başlatın.
2. WebChat kullanıcı arayüzünü (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir Gateway kimlik doğrulama yolunun yapılandırıldığından emin olun (varsayılan olarak paylaşılan gizli anahtar,
   loopback üzerinde bile).

## Nasıl çalışır (davranış)

- Kullanıcı arayüzü Gateway WebSocket'e bağlanır ve `chat.history`, `chat.send` ve `chat.inject` kullanır.
- `chat.history`, kararlılık için sınırlıdır: Gateway uzun metin alanlarını kısaltabilir, ağır meta verileri atlayabilir ve aşırı büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- `chat.history`, modern yalnızca eklemeli oturum dosyaları için etkin transkript dalını izler; bu nedenle terk edilmiş yeniden yazma dalları ve yerini almış istem kopyaları WebChat'te işlenmez.
- Compaction girdileri açık bir sıkıştırılmış-geçmiş ayırıcı olarak işlenir. Ayırıcı, önceki dönüşlerin bir denetim noktasında korunduğunu açıklar ve operatörlerin izinleri elverdiğinde Compaction öncesi görünümü dallandırabileceği veya geri yükleyebileceği Oturumlar denetim noktası kontrollerine bağlantı verir.
- Control UI, `chat.history` tarafından döndürülen destekleyici Gateway `sessionId` değerini hatırlar ve takip eden `chat.send` çağrılarına ekler; böylece kullanıcı bir oturum başlatmadıkça veya sıfırlamadıkça yeniden bağlantılar ve sayfa yenilemeleri aynı saklanan konuşmayı sürdürür.
- Control UI, yeni bir `chat.send` çalışma kimliği oluşturmadan önce aynı oturum, ileti ve ekler için yinelenen uçuş halindeki gönderimleri birleştirir; Gateway aynı idempotency anahtarını yeniden kullanan tekrarlı istekleri yine de tekilleştirir.
- `chat.history` ayrıca görüntü için normalleştirilir: yalnızca çalışma zamanına ait OpenClaw bağlamı,
  gelen zarf sarmalayıcıları, `[[reply_to_*]]` ve `[[audio_as_voice]]` gibi satır içi teslimat yönergesi etiketleri, düz metin araç çağrısı XML
  yükleri (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve
  sızmış ASCII/tam genişlikli model kontrol belirteçleri görünür metinden çıkarılır
  ve görünür metninin tamamı yalnızca tam sessiz
  belirteç `NO_REPLY` / `no_reply` olan asistan girdileri atlanır.
- Akıl yürütme olarak işaretlenmiş yanıt yükleri (`isReasoning: true`) WebChat asistan içeriğinden, transkript yeniden oynatma metninden ve ses içeriği bloklarından hariç tutulur; böylece yalnızca düşünme amaçlı yükler görünür asistan iletileri veya oynatılabilir ses olarak yüzeye çıkmaz.
- `chat.inject`, doğrudan transkripte bir asistan notu ekler ve bunu kullanıcı arayüzüne yayınlar (ajan çalışması yok).
- Durdurulmuş çalışmalar, kısmi asistan çıktısını kullanıcı arayüzünde görünür tutabilir.
- Gateway, arabelleğe alınmış çıktı varsa durdurulmuş kısmi asistan metnini transkript geçmişine kalıcı olarak yazar ve bu girdileri durdurma meta verileriyle işaretler.
- Geçmiş her zaman Gateway'den alınır (yerel dosya izleme yok).
- Gateway'e ulaşılamıyorsa WebChat salt okunurdur.

## Control UI ajan araçları paneli

- Control UI `/agents` Araçlar panelinde iki ayrı görünüm vardır:
  - **Şu Anda Kullanılabilir** `tools.effective(sessionKey=...)` kullanır ve mevcut
    oturumun çalışma zamanında gerçekten kullanabileceklerini gösterir; buna çekirdek, Plugin ve kanal sahipli araçlar dahildir.
  - **Araç Yapılandırması** `tools.catalog` kullanır ve profillere, geçersiz kılmalara ve
    katalog semantiğine odaklı kalır.
- Çalışma zamanı kullanılabilirliği oturum kapsamındadır. Aynı ajanda oturum değiştirmek
  **Şu Anda Kullanılabilir** listesini değiştirebilir.
- Yapılandırma düzenleyicisi çalışma zamanı kullanılabilirliği anlamına gelmez; etkin erişim yine de ilke
  önceliğini izler (`allow`/`deny`, ajan başına ve sağlayıcı/kanal geçersiz kılmaları).

## Uzaktan kullanım

- Uzak mod, Gateway WebSocket'i SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma başvurusu (WebChat)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

WebChat seçenekleri:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` yanıtlarındaki metin alanları için en yüksek karakter sayısı. Bir transkript girdisi bu sınırı aştığında, Gateway uzun metin alanlarını kısaltır ve aşırı büyük iletileri bir yer tutucuyla değiştirebilir. İstek başına `maxChars`, istemci tarafından tek bir `chat.history` çağrısı için bu varsayılanı geçersiz kılmak üzere de gönderilebilir.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket ana makinesi/bağlantı noktası.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli anahtarlı WebSocket kimlik doğrulaması.
- `gateway.auth.allowTailscale`: tarayıcı Control UI sohbet sekmesi, etkinleştirildiğinde Tailscale
  Serve kimlik başlıklarını kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkındalığı olan **loopback olmayan** bir proxy kaynağının arkasındaki tarayıcı istemcileri için ters proxy kimlik doğrulaması (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak Gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Pano](/tr/web/dashboard)
