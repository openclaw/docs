---
read_when:
    - WebChat erişimini hata ayıklama veya yapılandırma
summary: Sohbet UI’si için loopback WebChat statik ana makinesi ve Gateway WS kullanımı
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:44:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

Durum: macOS/iOS SwiftUI sohbet UI’si doğrudan Gateway WebSocket’i ile konuşur.

## Nedir?

- Gateway için yerel bir sohbet UI’sidir (gömülü tarayıcı ve yerel statik sunucu yoktur).
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Deterministik yönlendirme: yanıtlar her zaman WebChat’e geri gider.

## Hızlı başlangıç

1. Gateway’i başlatın.
2. WebChat UI’sini (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir Gateway auth yolunun yapılandırıldığından emin olun (loopback üzerinde bile
   varsayılan olarak paylaşılan gizli bilgi kullanılır).

## Nasıl çalışır? (davranış)

- UI, Gateway WebSocket’ine bağlanır ve `chat.history`, `chat.send` ve `chat.inject` kullanır.
- `chat.history`, kararlılık için sınırlıdır: Gateway uzun metin alanlarını kırpabilir, ağır meta verileri atlayabilir ve aşırı büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- `chat.history` ayrıca görüntüleme için normalleştirilir: yalnızca çalışma zamanına ait OpenClaw bağlamı,
  gelen zarf sarmalayıcıları, `[[reply_to_*]]` ve `[[audio_as_voice]]` gibi satır içi teslim yönergesi etiketleri,
  düz metin araç çağrısı XML yükleri (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları dahil) ve
  sızan ASCII/tam genişlikli model denetim token’ları görünür metinden çıkarılır;
  ve tüm görünür metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` olan yardımcı girdileri atlanır.
- Reasoning işaretli yanıt yükleri (`isReasoning: true`), WebChat yardımcı içeriğinden, transcript tekrar oynatma metninden ve ses içerik bloklarından hariç tutulur; böylece yalnızca thinking içeren yükler görünür yardımcı mesajları veya oynatılabilir ses olarak görünmez.
- `chat.inject`, transcript’e doğrudan bir yardımcı notu ekler ve bunu UI’ye yayınlar (aracı çalıştırması yoktur).
- İptal edilen çalıştırmalar, UI’de kısmi yardımcı çıktısının görünür kalmasına neden olabilir.
- Gateway, tamponlanmış çıktı mevcut olduğunda iptal edilen kısmi yardımcı metnini transcript geçmişine kalıcı olarak yazar ve bu girdileri iptal meta verisiyle işaretler.
- Geçmiş her zaman Gateway’den alınır (yerel dosya izleme yoktur).
- Gateway’e ulaşılamıyorsa WebChat salt okunur olur.

## Control UI aracılar araçlar paneli

- Control UI `/agents` Tools panelinin iki ayrı görünümü vardır:
  - **Available Right Now**, `tools.effective(sessionKey=...)` kullanır ve geçerli
    oturumun çalışma zamanında gerçekten kullanabildiği şeyleri gösterir; buna çekirdek, Plugin ve kanal sahipli araçlar dahildir.
  - **Tool Configuration**, `tools.catalog` kullanır ve profillere, geçersiz kılmalara ve
    katalog anlambilimine odaklanır.
- Çalışma zamanı kullanılabilirliği oturum kapsamlıdır. Aynı aracı üzerinde oturum değiştirmek
  **Available Right Now** listesini değiştirebilir.
- Config düzenleyicisi çalışma zamanı kullanılabilirliğini ima etmez; etkin erişim yine ilke
  önceliğini (`allow`/`deny`, aracı başına ve sağlayıcı/kanal geçersiz kılmaları) izler.

## Uzak kullanım

- Uzak mod, Gateway WebSocket’ini SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma başvurusu (WebChat)

Tam yapılandırma: [Configuration](/tr/gateway/configuration)

WebChat seçenekleri:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` yanıtlarındaki metin alanları için azami karakter sayısı. Bir transcript girdisi bu sınırı aşarsa Gateway uzun metin alanlarını kırpar ve aşırı büyük mesajları yer tutucuyla değiştirebilir. İstemci ayrıca tek bir `chat.history` çağrısı için bu varsayılanı geçersiz kılmak üzere istek başına `maxChars` da gönderebilir.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket ana makinesi/portu.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli bilgi WebSocket auth’ı.
- `gateway.auth.allowTailscale`: etkin olduğunda tarayıcıdaki Control UI sohbet sekmesi Tailscale
  Serve kimlik başlıklarını kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkındalığı olan **loopback olmayan** bir proxy kaynağının arkasındaki tarayıcı istemcileri için ters proxy auth’ı (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak Gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Dashboard](/tr/web/dashboard)
