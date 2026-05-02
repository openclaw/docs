---
read_when:
    - WebChat erişiminde hata ayıklama veya erişimi yapılandırma
summary: Loopback WebChat statik barındırıcısı ve sohbet arayüzü için Gateway WS kullanımı
title: Web Sohbet
x-i18n:
    generated_at: "2026-05-02T23:39:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

Durum: macOS/iOS SwiftUI sohbet arayüzü doğrudan Gateway WebSocket ile konuşur.

## Nedir

- Gateway için yerel bir sohbet arayüzü (gömülü tarayıcı ve yerel statik sunucu yok).
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Belirleyici yönlendirme: yanıtlar her zaman WebChat'e geri gider.

## Hızlı başlangıç

1. Gateway'i başlatın.
2. WebChat arayüzünü (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir Gateway kimlik doğrulama yolunun yapılandırıldığından emin olun (varsayılan olarak paylaşılan gizli anahtar,
   loopback üzerinde bile).

## Nasıl çalışır (davranış)

- Arayüz Gateway WebSocket'e bağlanır ve `chat.history`, `chat.send`, `chat.inject` ve `chat.transcribeAudio` kullanır.
- `chat.history`, kararlılık için sınırlıdır: Gateway uzun metin alanlarını kısaltabilir, ağır metaverileri atlayabilir ve çok büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- `chat.history`, modern yalnızca eklemeli oturum dosyaları için etkin transcript dalını izler; böylece terk edilmiş yeniden yazma dalları ve yerini almış prompt kopyaları WebChat'te işlenmez.
- Control UI, `chat.history` tarafından döndürülen destekleyici Gateway `sessionId` değerini hatırlar ve bunu takip eden `chat.send` çağrılarına ekler; böylece kullanıcı bir oturum başlatmadıkça veya sıfırlamadıkça yeniden bağlantılar ve sayfa yenilemeleri aynı depolanan konuşmayı sürdürür.
- Control UI, yeni bir `chat.send` çalıştırma kimliği oluşturmadan önce aynı oturum, mesaj ve ekler için yinelenen devam eden gönderimleri birleştirir; Gateway, aynı idempotency anahtarını yeniden kullanan yinelenen istekleri yine de tekilleştirir.
- `chat.history` ayrıca görüntü için normalize edilir: yalnızca çalışma zamanına ait OpenClaw bağlamı,
  gelen envelope sarmalayıcıları, `[[reply_to_*]]` ve `[[audio_as_voice]]` gibi satır içi teslimat yönergesi etiketleri, düz metin araç çağrısı XML
  yükleri (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve
  sızan ASCII/tam genişlikli model kontrol token'ları görünür metinden ayıklanır;
  görünür metninin tamamı yalnızca tam sessiz
  token `NO_REPLY` / `no_reply` olan assistant girdileri atlanır.
- Reasoning işaretli yanıt yükleri (`isReasoning: true`) WebChat assistant içeriğinden, transcript yeniden oynatma metninden ve ses içeriği bloklarından çıkarılır; böylece yalnızca düşünme amaçlı yükler görünür assistant mesajları veya oynatılabilir ses olarak yüzeye çıkmaz.
- `chat.transcribeAudio`, Control UI sohbet oluşturucusunda sunucu tarafı dikteyi sağlar. Tarayıcı mikrofon sesini kaydeder, base64 olarak Gateway'e gönderir ve Gateway yapılandırılmış `tools.media.audio` işlem hattını çalıştırır. Döndürülen transcript taslağa eklenir; kullanıcı göndermeden hiçbir ajan çalıştırması başlatılmaz.
- `chat.inject`, transcript'e doğrudan bir assistant notu ekler ve bunu arayüze yayınlar (ajan çalıştırması yok).
- Durdurulan çalıştırmalar, kısmi assistant çıktısını arayüzde görünür tutabilir.
- Gateway, arabelleğe alınmış çıktı varsa durdurulan kısmi assistant metnini transcript geçmişine kalıcı olarak kaydeder ve bu girdileri durdurma metaverileriyle işaretler.
- Geçmiş her zaman Gateway'den alınır (yerel dosya izleme yok).
- Gateway'e ulaşılamıyorsa WebChat salt okunurdur.

## Control UI ajan araçları paneli

- Control UI `/agents` Araçlar panelinde iki ayrı görünüm vardır:
  - **Şu Anda Kullanılabilir**, `tools.effective(sessionKey=...)` kullanır ve mevcut
    oturumun çalışma zamanında gerçekten kullanabileceği çekirdek, Plugin ve kanal sahibi araçlar dahil her şeyi gösterir.
  - **Araç Yapılandırması**, `tools.catalog` kullanır ve profillere, geçersiz kılmalara ve
    katalog semantiğine odaklı kalır.
- Çalışma zamanı kullanılabilirliği oturum kapsamındadır. Aynı ajanda oturum değiştirmek,
  **Şu Anda Kullanılabilir** listesini değiştirebilir.
- Yapılandırma düzenleyicisi çalışma zamanı kullanılabilirliği anlamına gelmez; etkin erişim yine de ilke
  önceliğini (`allow`/`deny`, ajan başına ve sağlayıcı/kanal geçersiz kılmaları) izler.

## Uzaktan kullanım

- Uzak mod, Gateway WebSocket'i SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma başvurusu (WebChat)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

WebChat seçenekleri:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` yanıtlarındaki metin alanları için maksimum karakter sayısı. Bir transcript girdisi bu sınırı aştığında Gateway uzun metin alanlarını kısaltır ve çok büyük mesajları bir yer tutucuyla değiştirebilir. İstemci, tek bir `chat.history` çağrısı için bu varsayılanı geçersiz kılmak üzere istek başına `maxChars` da gönderebilir.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket ana makinesi/bağlantı noktası.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli anahtarlı WebSocket kimlik doğrulaması.
- `gateway.auth.allowTailscale`: etkinleştirildiğinde tarayıcı Control UI sohbet sekmesi Tailscale
  Serve kimlik üstbilgilerini kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkındalığı olan **loopback olmayan** bir proxy kaynağının arkasındaki tarayıcı istemcileri için ters proxy kimlik doğrulaması (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak Gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Pano](/tr/web/dashboard)
