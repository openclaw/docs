---
read_when:
    - WebChat erişiminde hata ayıklama veya erişimi yapılandırma
summary: Geri döngü WebChat statik barındırıcısı ve sohbet arayüzü için Gateway WS kullanımı
title: WebChat
x-i18n:
    generated_at: "2026-04-30T09:53:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

Durum: macOS/iOS SwiftUI sohbet kullanıcı arayüzü doğrudan Gateway WebSocket ile konuşur.

## Nedir

- Gateway için yerel bir sohbet kullanıcı arayüzü (gömülü tarayıcı yok ve yerel statik sunucu yok).
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Deterministik yönlendirme: yanıtlar her zaman WebChat’e geri döner.

## Hızlı başlangıç

1. Gateway’i başlatın.
2. WebChat kullanıcı arayüzünü (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir Gateway kimlik doğrulama yolunun yapılandırıldığından emin olun (varsayılan olarak paylaşılan gizli anahtar,
   loopback üzerinde bile).

## Nasıl çalışır (davranış)

- Kullanıcı arayüzü Gateway WebSocket’e bağlanır ve `chat.history`, `chat.send` ve `chat.inject` kullanır.
- `chat.history` kararlılık için sınırlıdır: Gateway uzun metin alanlarını kısaltabilir, ağır meta verileri atlayabilir ve aşırı büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- `chat.history`, modern yalnızca sona eklemeli oturum dosyaları için etkin transkript dalını izler; bu nedenle terk edilmiş yeniden yazma dalları ve yerini alan istem kopyaları WebChat’te işlenmez.
- Control UI, yeni bir `chat.send` çalıştırma kimliği oluşturmadan önce aynı oturum, mesaj ve ekler için yinelenen devam eden gönderimleri birleştirir; Gateway aynı idempotency anahtarını yeniden kullanan tekrarlanan istekleri yine de tekilleştirir.
- `chat.history` ayrıca görüntüleme için normalleştirilir: yalnızca çalışma zamanına ait OpenClaw bağlamı,
  gelen zarf sarmalayıcıları, `[[reply_to_*]]` ve `[[audio_as_voice]]` gibi satır içi teslim yönergesi etiketleri, düz metin araç çağrısı XML
  yükleri (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve
  sızmış ASCII/tam genişlikli model kontrol belirteçleri görünür metinden çıkarılır
  ve tüm görünür metni yalnızca tam sessiz
  belirteç `NO_REPLY` / `no_reply` olan asistan girdileri atlanır.
- Akıl yürütme bayraklı yanıt yükleri (`isReasoning: true`) WebChat asistan içeriğinden, transkript yeniden oynatma metninden ve ses içerik bloklarından hariç tutulur; böylece yalnızca düşünme amaçlı yükler görünür asistan mesajları veya oynatılabilir ses olarak görünmez.
- `chat.inject`, bir asistan notunu doğrudan transkripte ekler ve kullanıcı arayüzüne yayınlar (ajan çalıştırması yok).
- İptal edilen çalıştırmalar, kısmi asistan çıktısını kullanıcı arayüzünde görünür tutabilir.
- Gateway, arabelleğe alınmış çıktı varsa iptal edilmiş kısmi asistan metnini transkript geçmişinde kalıcı hale getirir ve bu girdileri iptal meta verileriyle işaretler.
- Geçmiş her zaman Gateway’den alınır (yerel dosya izleme yok).
- Gateway erişilemezse WebChat salt okunurdur.

## Control UI ajan araçları paneli

- Control UI `/agents` Araçlar panelinde iki ayrı görünüm vardır:
  - **Şu Anda Kullanılabilir** `tools.effective(sessionKey=...)` kullanır ve mevcut
    oturumun çalışma zamanında gerçekten neleri kullanabileceğini gösterir; buna çekirdek, Plugin ve kanalın sahip olduğu araçlar dahildir.
  - **Araç Yapılandırması** `tools.catalog` kullanır ve profillere, geçersiz kılmalara ve
    katalog semantiğine odaklanır.
- Çalışma zamanı kullanılabilirliği oturum kapsamındadır. Aynı ajanda oturum değiştirmek
  **Şu Anda Kullanılabilir** listesini değiştirebilir.
- Yapılandırma düzenleyicisi çalışma zamanı kullanılabilirliği anlamına gelmez; etkin erişim yine de politika
  önceliğini (`allow`/`deny`, ajan başına ve sağlayıcı/kanal geçersiz kılmaları) izler.

## Uzak kullanım

- Uzak mod, Gateway WebSocket’i SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma başvurusu (WebChat)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

WebChat seçenekleri:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` yanıtlarındaki metin alanları için azami karakter sayısı. Bir transkript girdisi bu sınırı aştığında Gateway uzun metin alanlarını kısaltır ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir. İstemci, tek bir `chat.history` çağrısı için bu varsayılanı geçersiz kılmak üzere istek başına `maxChars` da gönderebilir.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket ana makinesi/bağlantı noktası.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli anahtarlı WebSocket kimlik doğrulaması.
- `gateway.auth.allowTailscale`: tarayıcı Control UI sohbet sekmesi, etkinleştirildiğinde Tailscale
  Serve kimlik başlıklarını kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkında **loopback olmayan** bir proxy kaynağının arkasındaki tarayıcı istemcileri için ters proxy kimlik doğrulaması (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak Gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Pano](/tr/web/dashboard)
