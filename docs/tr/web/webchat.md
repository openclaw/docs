---
read_when:
    - WebChat erişimini hata ayıklıyor veya yapılandırıyorsanız
summary: Sohbet arayüzü için loopback WebChat statik ana makinesi ve Gateway WS kullanımı
title: WebChat
x-i18n:
    generated_at: "2026-04-05T14:14:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2588be04e9ae38149bdf284bf4d75b6784d63899026d2351c4e0e7efdf05ff39
    source_path: web/webchat.md
    workflow: 15
---

# WebChat (Gateway WebSocket UI)

Durum: macOS/iOS SwiftUI sohbet arayüzü doğrudan Gateway WebSocket ile konuşur.

## Nedir

- Gateway için yerel bir sohbet arayüzü (gömülü tarayıcı ve yerel statik sunucu yok).
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Deterministik yönlendirme: yanıtlar her zaman WebChat'e geri döner.

## Hızlı başlangıç

1. Gateway'i başlatın.
2. WebChat UI'yi (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir gateway auth yolunun yapılandırıldığından emin olun (varsayılan olarak paylaşılan gizli anahtar,
   loopback üzerinde bile).

## Nasıl çalışır (davranış)

- UI, Gateway WebSocket'e bağlanır ve `chat.history`, `chat.send` ve `chat.inject` kullanır.
- `chat.history`, kararlılık için sınırlıdır: Gateway uzun metin alanlarını kısaltabilir, ağır meta verileri atlayabilir ve aşırı büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- `chat.history` ayrıca görüntüleme için normalize edilir: `[[reply_to_*]]` ve `[[audio_as_voice]]` gibi satır içi teslim yönergesi etiketleri, düz metin araç çağrısı XML yükleri
  (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve
  sızmış ASCII/tam genişlikli model kontrol token'ları görünür metinden çıkarılır,
  ayrıca tüm görünür metni yalnızca tam sessiz
  token `NO_REPLY` / `no_reply` olan asistan girdileri atlanır.
- `chat.inject`, doğrudan döküme bir asistan notu ekler ve bunu UI'ye yayınlar (ajan çalıştırması yok).
- İptal edilen çalıştırmalar, kısmi asistan çıktısını UI'de görünür tutabilir.
- Gateway, tamponlanmış çıktı mevcut olduğunda iptal edilmiş kısmi asistan metnini döküm geçmişine kalıcı olarak yazar ve bu girdileri iptal meta verileriyle işaretler.
- Geçmiş her zaman gateway'den alınır (yerel dosya izleme yok).
- Gateway'e ulaşılamıyorsa, WebChat salt okunurdur.

## Control UI agents araçlar paneli

- Control UI `/agents` Tools panelinin iki ayrı görünümü vardır:
  - **Şu Anda Kullanılabilir**, `tools.effective(sessionKey=...)` kullanır ve geçerli
    oturumun çalışma zamanında gerçekten kullanabildiği araçları gösterir; buna çekirdek, eklenti ve kanal sahipli araçlar dahildir.
  - **Araç Yapılandırması**, `tools.catalog` kullanır ve profillere, geçersiz kılmalara ve
    katalog semantiğine odaklanmayı sürdürür.
- Çalışma zamanı kullanılabilirliği oturum kapsamlıdır. Aynı ajan üzerinde oturum değiştirmek
  **Şu Anda Kullanılabilir** listesini değiştirebilir.
- Yapılandırma düzenleyicisi çalışma zamanı kullanılabilirliğini ima etmez; etkili erişim yine de ilke
  önceliğini izler (`allow`/`deny`, ajan başına ve sağlayıcı/kanal geçersiz kılmaları).

## Uzak kullanım

- Uzak mod, gateway WebSocket'i SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma başvurusu (WebChat)

Tam yapılandırma: [Configuration](/tr/gateway/configuration)

WebChat seçenekleri:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` yanıtlarındaki metin alanları için maksimum karakter sayısı. Bir döküm girdisi bu sınırı aştığında, Gateway uzun metin alanlarını kısaltır ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir. İstemci ayrıca tek bir `chat.history` çağrısı için bu varsayılanı geçersiz kılmak üzere istek başına `maxChars` gönderebilir.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket ana makinesi/bağlantı noktası.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli anahtar WebSocket kimlik doğrulaması.
- `gateway.auth.allowTailscale`: tarayıcıdaki Control UI sohbet sekmesi,
  etkinleştirildiğinde Tailscale Serve kimlik üst bilgilerini kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkındalığı olan **loopback olmayan** bir proxy kaynağının arkasındaki tarayıcı istemcileri için reverse-proxy kimlik doğrulaması (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.
