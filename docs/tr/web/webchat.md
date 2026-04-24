---
read_when:
    - WebChat erişimini hata ayıklama veya yapılandırma
summary: Loopback WebChat statik host'u ve sohbet UI için Gateway WS kullanımı
title: WebChat
x-i18n:
    generated_at: "2026-04-24T09:38:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

Durum: macOS/iOS SwiftUI sohbet UI'si doğrudan Gateway WebSocket ile konuşur.

## Nedir

- Gateway için yerel bir sohbet UI'si (gömülü browser ve yerel statik sunucu yok).
- Diğer kanallarla aynı oturum ve yönlendirme kurallarını kullanır.
- Deterministik yönlendirme: yanıtlar her zaman WebChat'e geri gider.

## Hızlı başlangıç

1. Gateway'i başlatın.
2. WebChat UI'yi (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir gateway auth yolunun yapılandırıldığından emin olun (loopback üzerinde bile varsayılan olarak paylaşılan gizli bilgi kullanılır).

## Nasıl çalışır (davranış)

- UI, Gateway WebSocket'e bağlanır ve `chat.history`, `chat.send` ve `chat.inject` kullanır.
- `chat.history`, kararlılık için sınırlıdır: Gateway uzun metin alanlarını kısaltabilir, ağır meta verileri atlayabilir ve aşırı büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- `chat.history` ayrıca görüntüleme için normalize edilir: satır içi teslim direktifi etiketleri
  (`[[reply_to_*]]` ve `[[audio_as_voice]]` gibi), düz metin tool-call XML
  payload'ları (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kesilmiş tool-call blokları dahil) ve
  sızmış ASCII/tam genişlikte model kontrol token'ları görünür metinden çıkarılır;
  tüm görünür metni yalnızca tam sessiz
  token `NO_REPLY` / `no_reply` olan asistan girdileri atlanır.
- `chat.inject`, bir asistan notunu doğrudan transcript'e ekler ve UI'ye yayınlar (ajan çalıştırması yok).
- İptal edilen çalıştırmalar, UI'de kısmi asistan çıktısını görünür bırakabilir.
- Gateway, arabelleğe alınmış çıktı mevcut olduğunda iptal edilmiş kısmi asistan metnini transcript geçmişine kalıcı yazar ve bu girdileri iptal meta verileriyle işaretler.
- Geçmiş her zaman gateway'den alınır (yerel dosya izleme yok).
- Gateway'e erişilemiyorsa WebChat salt okunurdur.

## Control UI agents tools paneli

- Control UI `/agents` Tools panelinde iki ayrı görünüm vardır:
  - **Şu Anda Kullanılabilir**, `tools.effective(sessionKey=...)` kullanır ve geçerli
    oturumun çalışma zamanında gerçekten neleri kullanabildiğini gösterir; buna çekirdek, Plugin ve kanala ait araçlar dahildir.
  - **Araç Yapılandırması**, `tools.catalog` kullanır ve profile'lara, geçersiz kılmalara ve
    katalog semantiğine odaklı kalır.
- Çalışma zamanı kullanılabilirliği oturum kapsamlıdır. Aynı ajan üzerinde oturum değiştirmek
  **Şu Anda Kullanılabilir** listesini değiştirebilir.
- Yapılandırma düzenleyicisi çalışma zamanı kullanılabilirliğini ima etmez; etkili erişim yine politika
  önceliğini izler (`allow`/`deny`, ajan başına ve sağlayıcı/kanal geçersiz kılmaları).

## Uzak kullanım

- Uzak mod, gateway WebSocket'i SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma başvurusu (WebChat)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

WebChat seçenekleri:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` yanıtlarındaki metin alanları için en yüksek karakter sayısı. Bir transcript girdisi bu sınırı aştığında Gateway uzun metin alanlarını kısaltır ve aşırı büyük mesajları yer tutucuyla değiştirebilir. İstemci, tek bir `chat.history` çağrısı için bu varsayılanı geçersiz kılmak üzere istek başına `maxChars` da gönderebilir.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket host/port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli bilgiyle WebSocket auth.
- `gateway.auth.allowTailscale`: browser Control UI sohbet sekmesi, etkinse Tailscale
  Serve kimlik üst bilgilerini kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkında **loopback dışı** bir proxy kaynağının arkasındaki browser istemcileri için reverse-proxy auth (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Pano](/tr/web/dashboard)
