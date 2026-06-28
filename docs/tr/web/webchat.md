---
read_when:
    - WebChat erişimini hata ayıklama veya yapılandırma
summary: Loopback WebChat statik barındırıcısı ve sohbet kullanıcı arayüzü için Gateway WS kullanımı
title: Web Sohbet
x-i18n:
    generated_at: "2026-06-28T01:28:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

Durum: macOS/iOS SwiftUI sohbet kullanıcı arayüzü doğrudan Gateway WebSocket ile konuşur.

## Nedir

- Gateway için yerel bir sohbet kullanıcı arayüzü (gömülü tarayıcı ve yerel statik sunucu yok).
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Belirleyici yönlendirme: yanıtlar her zaman WebChat'e geri gider.

## Hızlı başlangıç

1. Gateway'i başlatın.
2. WebChat kullanıcı arayüzünü (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir Gateway kimlik doğrulama yolunun yapılandırıldığından emin olun (varsayılan olarak paylaşılan gizli anahtar,
   loopback üzerinde bile).

## Nasıl çalışır (davranış)

- Kullanıcı arayüzü Gateway WebSocket'e bağlanır ve `chat.history`, `chat.send` ve `chat.inject` kullanır.
- `chat.history` kararlılık için sınırlandırılmıştır: Gateway uzun metin alanlarını kısaltabilir, ağır meta verileri atlayabilir ve çok büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir.
- Görünür bir asistan mesajı `chat.history` içinde kısaltıldığında, Control UI varsayılan geçmiş yükünü artırmadan bir yan okuyucu açabilir ve tam görüntü-normalize girdiyi `chat.message.get` üzerinden isteğe bağlı olarak alabilir.
- `chat.history`, modern yalnızca eklemeli oturum dosyaları için etkin döküm dalını izler; bu nedenle terk edilmiş yeniden yazma dalları ve yerine geçen istem kopyaları WebChat'te işlenmez.
- Compaction girdileri açık bir sıkıştırılmış-geçmiş ayırıcı olarak işlenir. Ayırıcı, sıkıştırılmış dökümün bir kontrol noktası olarak korunduğunu açıklar ve operatörlerin izinleri elverdiğinde bu sıkıştırılmış görünümden dal oluşturabileceği veya geri yükleyebileceği Oturumlar kontrol noktası denetimlerine bağlantı verir.
- Control UI, `chat.history` tarafından döndürülen yedek Gateway `sessionId` değerini hatırlar ve sonraki `chat.send` çağrılarına ekler; böylece yeniden bağlantılar ve sayfa yenilemeleri, kullanıcı bir oturum başlatmadığı veya sıfırlamadığı sürece aynı saklanan konuşmayı sürdürür.
- Control UI, yeni bir `chat.send` çalıştırma kimliği oluşturmadan önce aynı oturum, mesaj ve ekler için yinelenen devam eden gönderimleri birleştirir; Gateway aynı idempotency anahtarını yeniden kullanan tekrarlı istekleri yine de tekilleştirir.
- Çalışma alanı başlangıç dosyaları ve bekleyen `BOOTSTRAP.md` talimatları, WebChat kullanıcı mesajına kopyalanmak yerine aracı sistem isteminin Proje Bağlamı üzerinden sağlanır. Bootstrap kısaltması yalnızca özlü bir sistem istemi kurtarma bildirimi ekler; ayrıntılı sayımlar ve yapılandırma ayarları tanılama yüzeylerinde kalır.
- `chat.history` ayrıca görüntü-normalizedir: yalnızca çalışma zamanına ait OpenClaw bağlamı,
  gelen zarf sarmalayıcıları, `[[reply_to_*]]` ve `[[audio_as_voice]]`
  gibi satır içi teslim yönergesi etiketleri, düz metin araç çağrısı XML
  yükleri (`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve
  sızmış ASCII/tam genişlikli model denetim belirteçleri görünür metinden çıkarılır
  ve görünür metninin tamamı yalnızca tam sessiz
  `NO_REPLY` / `no_reply` belirteci olan asistan girdileri atlanır.
- Akıl yürütme işaretli yanıt yükleri (`isReasoning: true`) WebChat asistan içeriğinden, döküm yeniden oynatma metninden ve ses içerik bloklarından hariç tutulur; böylece yalnızca düşünme içeren yükler görünür asistan mesajları veya oynatılabilir ses olarak yüzeye çıkmaz.
- `chat.inject`, döküme doğrudan bir asistan notu ekler ve bunu kullanıcı arayüzüne yayınlar (aracı çalıştırması yok).
- Durdurulan çalıştırmalar, kısmi asistan çıktısını kullanıcı arayüzünde görünür tutabilir.
- Gateway, ara belleğe alınmış çıktı varsa durdurulan kısmi asistan metnini döküm geçmişinde kalıcı hale getirir ve bu girdileri durdurma meta verileriyle işaretler.
- Geçmiş her zaman gateway'den alınır (yerel dosya izleme yok).
- Gateway'e ulaşılamıyorsa WebChat salt okunurdur.

### Döküm ve teslim modeli

WebChat'in iki ayrı veri yolu vardır:

- Oturum JSONL dosyası kalıcı model/çalışma zamanı dökümüdür. Normal aracı çalıştırmaları için gömülü OpenClaw çalışma zamanı, modelin görebildiği `user`, `assistant` ve `toolResult` mesajlarını oturum yöneticisi üzerinden kalıcı hale getirir. WebChat bu döküme rastgele teslim, durum veya yardımcı metin yazmaz.
- Gateway `ReplyPayload` olayları canlı teslim projeksiyonudur. WebChat/kanal görüntüleme, blok akışı, yönerge etiketleri, medya gömme, TTS/ses bayrakları ve kullanıcı arayüzü yedek davranışı için normalize edilebilirler. Kendileri kanonik oturum günlüğü değildir.
- `tools.message` üzerinden görünür yanıtlar gerektiren harness'lar, WebChat'i yine geçerli çalıştırma içi kaynak yanıt havuzu olarak kullanır. Bu etkin WebChat çalıştırmasından hedefsiz bir `message.send`, aynı sohbete yansıtılır ve oturum dökümüne aynalanır; WebChat yeniden kullanılabilir bir giden kanal haline gelmez ve hiçbir zaman `lastChannel` devralmaz.
- WebChat, yalnızca Gateway normal bir gömülü aracı dönüşü dışında görüntülenen bir mesaja sahip olduğunda asistan döküm girdileri ekler: `chat.inject`, aracı dışı komut yanıtları, durdurulan kısmi çıktı ve WebChat tarafından yönetilen medya dökümü ekleri.
- `chat.history`, saklanan oturum dökümünü okur ve WebChat görüntü projeksiyonunu uygular. Bir çalıştırma sırasında canlı asistan metni görünüyor ancak geçmiş yeniden yüklendikten sonra kayboluyorsa, önce ham JSONL'nin asistan metnini içerip içermediğini, ardından `chat.history` projeksiyonunun bunu çıkarıp çıkarmadığını, sonra da Control UI iyimser kuyruk birleştirmesinin yerel teslim durumunu kalıcı anlık görüntüyle değiştirip değiştirmediğini kontrol edin.
- `chat.message.get`, etkin aracı kapsamı dahil olmak üzere `chat.history` ile aynı döküm dalı ve görüntü projeksiyonu kurallarını kullanır, ancak `messageId` ile tek bir döküm girdisini hedefler ve tam içerik artık döndürülemediğinde dürüst bir kullanılamazlık nedeni döndürür.

Normal aracı çalıştırması nihai yanıtları kalıcı olmalıdır, çünkü gömülü çalışma zamanı asistan `message_end` değerini yazar. Teslim edilen nihai yükü döküme aynalayan herhangi bir yedek yol, önce gömülü çalışma zamanının zaten yazdığı bir asistan dönüşünü yinelemekten kaçınmalıdır.

## Control UI aracı araçları paneli

- Control UI `/agents` Araçlar panelinin iki ayrı görünümü vardır:
  - **Şu Anda Kullanılabilir**, `tools.effective(sessionKey=...)` kullanır ve çekirdek, Plugin, kanal sahipliğindeki
    ve zaten keşfedilmiş MCP sunucu araçları dahil olmak üzere geçerli oturum envanterinin sunucudan türetilmiş
    salt okunur bir projeksiyonunu gösterir.
  - **Araç Yapılandırması**, `tools.catalog` kullanır ve profillere, geçersiz kılmalara ve
    katalog semantiğine odaklanır.
- Çalışma zamanı kullanılabilirliği oturum kapsamındadır. Aynı aracı üzerinde oturum değiştirmek
  **Şu Anda Kullanılabilir** listesini değiştirebilir. Yapılandırılmış MCP sunucuları bağlanmamışsa veya son keşiften
  bu yana değiştirilmişse, panel okuma yolundan MCP taşıyıcılarını sessizce başlatmak yerine bir bildirim gösterir.
- Yapılandırma düzenleyicisi çalışma zamanı kullanılabilirliği anlamına gelmez; etkin erişim yine politika
  önceliğini (`allow`/`deny`, aracı ve sağlayıcı/kanal bazlı geçersiz kılmalar) izler.

## Uzaktan kullanım

- Uzak mod, gateway WebSocket'i SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma başvurusu (WebChat)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

WebChat'in kalıcı bir yapılandırma bölümü yoktur. Gateway yerleşik `chat.history` görüntü sınırını kullanır; API istemcileri tek bir `chat.history` çağrısı için bunu geçersiz kılmak üzere istek başına `maxChars` gönderebilir. Eski `channels.webchat` ve `gateway.webchat` yapılandırması kullanımdan kaldırılmıştır; kaldırmak için `openclaw doctor --fix` çalıştırın.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket ana makinesi/bağlantı noktası.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli anahtarlı WebSocket kimlik doğrulaması.
- `gateway.auth.allowTailscale`: tarayıcı Control UI sohbet sekmesi, etkinleştirildiğinde Tailscale
  Serve kimlik başlıklarını kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkındalıklı **loopback olmayan** bir proxy kaynağının arkasındaki tarayıcı istemcileri için ters proxy kimlik doğrulaması (bkz. [Güvenilen Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Dashboard](/tr/web/dashboard)
