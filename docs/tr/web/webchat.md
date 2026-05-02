---
read_when:
    - WebChat erişiminde hata ayıklama veya erişimi yapılandırma
summary: Loopback WebChat statik barındırıcısı ve sohbet kullanıcı arayüzü için Gateway WS kullanımı
title: Web Sohbeti
x-i18n:
    generated_at: "2026-05-02T09:10:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Status: macOS/iOS SwiftUI sohbet kullanıcı arayüzü doğrudan Gateway WebSocket ile iletişim kurar.

## Bu nedir

- Gateway için yerel bir sohbet kullanıcı arayüzü (gömülü tarayıcı ve yerel statik sunucu yok).
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Belirleyici yönlendirme: yanıtlar her zaman WebChat'e geri gider.

## Hızlı başlangıç

1. Gateway'i başlatın.
2. WebChat kullanıcı arayüzünü (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir gateway kimlik doğrulama yolunun yapılandırıldığından emin olun (varsayılan olarak paylaşılan gizli anahtar,
   loopback üzerinde bile).

## Nasıl çalışır (davranış)

- Kullanıcı arayüzü Gateway WebSocket'e bağlanır ve `chat.history`, `chat.send` ve `chat.inject` kullanır.
- `chat.history`, kararlılık için sınırlandırılmıştır: Gateway uzun metin alanlarını kısaltabilir, ağır metadata'yı atlayabilir ve aşırı büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- `chat.history`, modern yalnızca eklemeli oturum dosyaları için etkin transkript dalını izler; bu nedenle terk edilmiş yeniden yazma dalları ve yerini alan istem kopyaları WebChat'te işlenmez.
- Control UI, `chat.history` tarafından döndürülen alttaki Gateway `sessionId` değerini hatırlar ve takip eden `chat.send` çağrılarına ekler; böylece kullanıcı bir oturum başlatmadıkça veya sıfırlamadıkça yeniden bağlantılar ve sayfa yenilemeleri aynı kayıtlı konuşmayı sürdürür.
- Control UI, yeni bir `chat.send` çalıştırma kimliği oluşturmadan önce aynı oturum, mesaj ve ekler için yinelenen devam eden gönderimleri birleştirir; Gateway aynı idempotency anahtarını yeniden kullanan tekrarlanan istekleri yine de tekilleştirir.
- `chat.history` ayrıca görüntüleme için normalleştirilir: yalnızca çalışma zamanına ait OpenClaw bağlamı,
  gelen zarf sarmalayıcıları, `[[reply_to_*]]` ve `[[audio_as_voice]]` gibi satır içi teslimat yönergesi etiketleri, düz metin tool-call XML
  yükleri (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil) ve
  sızmış ASCII/tam genişlikli model kontrol belirteçleri görünür metinden çıkarılır;
  tüm görünür metni yalnızca tam sessiz
  `NO_REPLY` / `no_reply` belirteci olan assistant girdileri atlanır.
- Akıl yürütme olarak işaretlenmiş yanıt yükleri (`isReasoning: true`) WebChat assistant içeriğinden, transkript yeniden oynatma metninden ve ses içeriği bloklarından hariç tutulur; böylece yalnızca düşünme amaçlı yükler görünür assistant mesajları veya oynatılabilir ses olarak ortaya çıkmaz.
- `chat.inject`, doğrudan transkripte bir assistant notu ekler ve bunu kullanıcı arayüzüne yayınlar (agent çalıştırması yok).
- Durdurulan çalıştırmalar, kısmi assistant çıktısını kullanıcı arayüzünde görünür tutabilir.
- Gateway, arabelleğe alınmış çıktı varsa durdurulmuş kısmi assistant metnini transkript geçmişine kalıcı olarak yazar ve bu girdileri durdurma metadata'sı ile işaretler.
- Geçmiş her zaman Gateway'den alınır (yerel dosya izleme yok).
- Gateway'e ulaşılamıyorsa WebChat salt okunurdur.

## Control UI agent araçları paneli

- Control UI `/agents` Araçlar panelinde iki ayrı görünüm vardır:
  - **Şu Anda Kullanılabilir** `tools.effective(sessionKey=...)` kullanır ve mevcut
    oturumun çalışma zamanında gerçekten kullanabileceği core, plugin ve kanal sahipli araçlar dahil araçları gösterir.
  - **Araç Yapılandırması** `tools.catalog` kullanır ve profillere, geçersiz kılmalara ve
    catalog semantiğine odaklanır.
- Çalışma zamanı kullanılabilirliği oturum kapsamındadır. Aynı agent üzerinde oturum değiştirmek
  **Şu Anda Kullanılabilir** listesini değiştirebilir.
- Yapılandırma düzenleyicisi çalışma zamanı kullanılabilirliği anlamına gelmez; etkin erişim yine de ilke
  önceliğini (`allow`/`deny`, agent başına ve provider/kanal geçersiz kılmaları) izler.

## Uzak kullanım

- Uzak mod, Gateway WebSocket'i SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma başvurusu (WebChat)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

WebChat seçenekleri:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history` yanıtlarındaki metin alanları için en yüksek karakter sayısı. Bir transkript girdisi bu sınırı aştığında Gateway uzun metin alanlarını kısaltır ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir. İstemci, tek bir `chat.history` çağrısı için bu varsayılanı geçersiz kılmak üzere istek başına `maxChars` da gönderebilir.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket ana makinesi/bağlantı noktası.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli anahtar WebSocket kimlik doğrulaması.
- `gateway.auth.allowTailscale`: tarayıcı Control UI sohbet sekmesi, etkinleştirildiğinde Tailscale
  Serve kimlik başlıklarını kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkındalığı olan **non-loopback** proxy kaynağının arkasındaki tarayıcı istemcileri için ters proxy kimlik doğrulaması (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak Gateway hedefi.
- `session.*`: oturum depolaması ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Pano](/tr/web/dashboard)
