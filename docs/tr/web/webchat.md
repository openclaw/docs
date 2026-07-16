---
read_when:
    - WebChat erişiminde hata ayıklama veya erişimi yapılandırma
summary: Sohbet kullanıcı arayüzü için loopback WebChat statik barındırıcısı ve Gateway WS kullanımı
title: WebChat
x-i18n:
    generated_at: "2026-07-16T18:01:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Durum: macOS/iOS SwiftUI sohbet kullanıcı arayüzü doğrudan Gateway WebSocket ile iletişim kurar. Gömülü tarayıcı veya yerel statik sunucu yoktur.

## Nedir?

- Gateway için yerel bir sohbet kullanıcı arayüzüdür.
- Diğer kanallarla aynı oturumları ve yönlendirme kurallarını kullanır.
- Belirlenimci yönlendirme: yanıtlar her zaman WebChat'e geri gider.
- Geçmiş her zaman Gateway'den alınır (yerel dosyalar izlenmez). Gateway'e erişilemiyorsa WebChat salt okunurdur.

## Hızlı başlangıç

1. Gateway'i başlatın.
2. WebChat kullanıcı arayüzünü (macOS/iOS uygulaması) veya Control UI sohbet sekmesini açın.
3. Geçerli bir Gateway kimlik doğrulama yolunun yapılandırıldığından emin olun (geri döngüde bile varsayılan olarak paylaşılan gizli anahtar kullanılır).

## Nasıl çalışır?

- Kullanıcı arayüzü Gateway WebSocket'e bağlanır ve `chat.history`, `chat.send`, `chat.inject` ve `chat.message.get` RPC yöntemlerini kullanır.
- `chat.history` kararlılık amacıyla sınırlandırılmıştır: Gateway uzun metin alanlarını kısaltabilir, ağır meta verileri dışarıda bırakabilir ve aşırı büyük girdileri `[chat.history omitted: message too large]` ile değiştirebilir. API istemcileri, tek bir çağrıda varsayılan sınırı geçersiz kılmak için istek başına bir `maxChars` gönderebilir.
- Görünür bir asistan iletisi `chat.history` içinde kısaltılmışsa Control UI, varsayılan geçmiş yükünü artırmadan bir yan okuyucu açabilir ve görüntüleme için normalleştirilmiş tam girdiyi `chat.message.get` aracılığıyla isteğe bağlı olarak alabilir. `chat.message.get`, `chat.history` ile aynı döküm dalını ve görüntüleme kurallarını kullanır ancak `messageId` ile tek bir girdiyi hedefler ve tam içerik artık döndürülemiyorsa gerçeği yansıtan bir kullanılamama nedeni döndürür.
- `chat.history`, yalnızca ekleme yapılan oturum dosyalarında etkin döküm dalını izler; böylece terk edilmiş yeniden yazma dalları ve yerini daha yeni sürümlerin aldığı istem kopyaları WebChat'te işlenmez.
- Compaction girdileri, sıkıştırılmış dökümün bir kontrol noktası olarak korunduğunu açıklayan bir "Sıkıştırılmış geçmiş" ayırıcısı ve oturum kontrol noktalarını açmaya yönelik bir eylemle (izinler elverdiğinde dal oluşturma veya geri yükleme) görüntülenir.
- Control UI, `chat.history` tarafından döndürülen temel Gateway `sessionId` değerini hatırlar ve sonraki `chat.send` çağrılarına ekler; böylece kullanıcı bir oturum başlatmadığı veya sıfırlamadığı sürece yeniden bağlantılar ve sayfa yenilemeleri aynı kayıtlı konuşmayı sürdürür.
- `chat.send` bir eşgüçlülük anahtarı alır (Control UI çalıştırma kimliğini kullanır); Gateway aynı anahtarı yeniden kullanan yinelenen istekleri tekilleştirir, böylece aynı oturum/ileti/ekler için yeniden denenen veya yinelenen, işlemdeki gönderimler ikinci bir çalıştırma oluşturmaz.
- Çalışma alanı başlangıç dosyaları ve bekleyen `BOOTSTRAP.md` talimatları, WebChat kullanıcı iletisine kopyalanmak yerine aracı sistem isteminin `# Project Context` bölümü aracılığıyla sağlanır. Önyükleme içeriği kısaltılırsa sistem istemi bunun yerine kısa bir "Önyükleme Bağlamı Bildirimi" alır; ayrıntılı sayımlar ve yapılandırma ayarları tanılama yüzeylerinde kalır.
- `chat.history` üzerindeki görüntüleme normalleştirmesi şunları kaldırır: yalnızca çalışma zamanına ait OpenClaw bağlamı, gelen zarf sarmalayıcıları, `[[reply_to_current]]`, `[[reply_to:<id>]]` ve `[[audio_as_voice]]` gibi satır içi teslim yönergesi etiketleri, düz metin araç çağrısı XML yükleri (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`; kısaltılmış bloklar dâhil) ve sızmış ASCII/tam genişlikli model denetim belirteçleri. Görünür metninin tamamı yalnızca sessiz `NO_REPLY` belirtecinden oluşan asistan girdileri (büyük/küçük harfe duyarsız olarak) dışarıda bırakılır.
- Akıl yürütme işaretli yanıt yükleri (`isReasoning: true`) WebChat asistan içeriğinden, dökümün yeniden oynatma metninden ve ses içeriği bloklarından çıkarılır; böylece yalnızca düşünme içeren yükler görünür asistan iletileri veya oynatılabilir ses olarak gösterilmez.
- `chat.inject`, doğrudan döküme bir asistan notu ekler ve bunu kullanıcı arayüzüne yayınlar (aracı çalıştırılmaz).
- Durdurulan çalıştırmalarda kısmi asistan çıktısı kullanıcı arayüzünde görünür kalabilir. Arabelleğe alınmış çıktı varsa Gateway bu kısmi metni döküm geçmişine kalıcı olarak kaydeder ve girdiyi durdurma meta verileriyle işaretler.

### Döküm ve teslim modeli

WebChat'in iki ayrı veri yolu vardır:

- SQLite döküm satırları, kalıcı model/çalışma zamanı dökümüdür. Normal aracı çalıştırmalarında gömülü OpenClaw çalışma zamanı, model tarafından görülebilen `user`, `assistant` ve `toolResult` iletilerini oturum erişimcisi aracılığıyla kalıcılaştırır. WebChat bu döküme rastgele teslim, durum veya yardımcı metin yazmaz.
- Gateway `ReplyPayload` olayları canlı teslim izdüşümüdür: WebChat/kanal görüntülemesi, blok akışı, yönerge etiketleri, medya gömme, TTS/ses işaretleri ve kullanıcı arayüzü geri dönüş davranışı için normalleştirilir. Bunların kendisi kurallı oturum günlüğü değildir.
- `tools.message` aracılığıyla görünür yanıtlar gerektiren test düzenekleri, geçerli çalıştırmada WebChat'i dâhilî kaynak yanıt alıcısı olarak kullanmaya devam eder. Bu etkin WebChat çalıştırmasından gelen hedefsiz bir `message.send`, aynı sohbete yansıtılır ve oturum dökümüne kopyalanır; WebChat yeniden kullanılabilir bir giden kanal hâline gelmez ve hiçbir zaman `lastChannel` değerini devralmaz.
- WebChat, asistan döküm girdilerini yalnızca Gateway normal gömülü aracı dönüşünün dışında görüntülenen bir iletinin sahibi olduğunda ekler: `chat.inject`, aracı dışı komut yanıtları, durdurulan kısmi çıktı ve WebChat tarafından yönetilen medya dökümü ekleri.
- Canlı asistan metni bir çalıştırma sırasında görünür ancak geçmiş yeniden yüklendikten sonra kaybolursa sırasıyla şunları kontrol edin: SQLite dökümünün asistan metnini içerip içermediği, `chat.history` görüntüleme izdüşümünün bunu kaldırıp kaldırmadığı ve ardından Control UI iyimser kuyruk birleştirmesinin yerel teslim durumunu kalıcı anlık görüntüyle değiştirip değiştirmediği.

Normal aracı çalıştırmalarının nihai yanıtları kalıcı olmalıdır; çünkü gömülü çalışma zamanı asistan `message_end` girdisini yazar. Teslim edilen nihai yükü döküme kopyalayan herhangi bir geri dönüş, önce gömülü çalışma zamanının zaten yazdığı bir asistan dönüşünü yinelemekten kaçınmalıdır.

## Control UI aracı araçları paneli

- Control UI `/agents` Araçlar panelinde, `tools.effective(sessionKey=...)` tarafından desteklenen bir "Şu Anda Kullanılabilir" görünümü bulunur: çekirdek, Plugin, kanalın sahip olduğu ve önceden keşfedilmiş MCP sunucu araçları dâhil olmak üzere geçerli oturumun araç envanterinin sunucudan türetilmiş, salt okunur bir izdüşümü.
- Ayrı bir yapılandırma düzenleme görünümü (`tools.catalog` tarafından desteklenir) profilleri, aracı başına geçersiz kılmaları ve katalog anlamlarını kapsar.
- Çalışma zamanı kullanılabilirliği oturum kapsamındadır. Aynı aracıda oturum değiştirmek "Şu Anda Kullanılabilir" listesini değiştirebilir. Yapılandırılmış MCP sunucularına henüz bağlanılmadıysa veya son keşiften bu yana bunlar değiştiyse panel, okuma yolundan sessizce MCP aktarımlarını başlatmak yerine bir bildirim gösterir.
- Yapılandırma düzenleyicisi çalışma zamanı kullanılabilirliği anlamına gelmez; etkin erişim yine ilke önceliğini (`allow`/`deny`, aracı başına ve sağlayıcı/kanal geçersiz kılmaları) izler.

## Uzaktan kullanım

- Uzak mod, Gateway WebSocket'i SSH/Tailscale üzerinden tüneller.
- Ayrı bir WebChat sunucusu çalıştırmanız gerekmez.

## Yapılandırma referansı (WebChat)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

WebChat'in kalıcı bir yapılandırma bölümü yoktur. Gateway yerleşik `chat.history` görüntüleme sınırını kullanır; API istemcileri tek bir çağrı için bunu geçersiz kılmak üzere istek başına `maxChars` gönderebilir. Eski `channels.webchat` ve `gateway.webchat` yapılandırması kullanımdan kaldırılmıştır; kaldırmak için `openclaw doctor --fix` komutunu çalıştırın.

İlgili genel seçenekler:

- `gateway.port`, `gateway.bind`: WebSocket ana makinesi/bağlantı noktası.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  paylaşılan gizli anahtarlı WebSocket kimlik doğrulaması.
- `gateway.auth.allowTailscale`: tarayıcıdaki Control UI sohbet sekmesi, etkinleştirildiğinde Tailscale
  Serve kimlik üst bilgilerini kullanabilir.
- `gateway.auth.mode: "trusted-proxy"`: kimlik farkındalığına sahip **geri döngü dışı** bir proxy kaynağının arkasındaki tarayıcı istemcileri için ters proxy kimlik doğrulaması (bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: uzak Gateway hedefi.
- `session.*`: oturum depolama ve ana anahtar varsayılanları.

## İlgili

- [Control UI](/tr/web/control-ui)
- [Pano](/tr/web/dashboard)
