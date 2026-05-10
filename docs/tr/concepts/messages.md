---
read_when:
    - Gelen mesajların nasıl yanıtlara dönüştüğünü açıklama
    - Oturumları, kuyruğa alma modlarını veya akış davranışını netleştirme
    - Akıl yürütme görünürlüğünü ve kullanım etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruğa alma ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-05-10T19:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw, gelen mesajları oturum çözümleme, kuyruğa alma, akış, araç yürütme ve akıl yürütme görünürlüğünden oluşan bir işlem hattı üzerinden işler. Bu sayfa, gelen mesajdan yanıta giden yolu eşler.

## Mesaj akışı (üst düzey)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Temel ayarlar yapılandırmada bulunur:

- Önekler, kuyruğa alma ve grup davranışı için `messages.*`.
- Blok akışı ve parçalama varsayılanları için `agents.defaults.*`.
- Sınırlar ve akış açma kapama ayarları için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.).

Tam şema için bkz. [Yapılandırma](/tr/gateway/configuration).

## Gelen tekilleştirme

Kanallar, yeniden bağlanmalardan sonra aynı mesajı yeniden teslim edebilir. OpenClaw, yinelenen teslimatların başka bir ajan çalıştırmasını tetiklememesi için kanal/hesap/eş/oturum/mesaj kimliğine göre anahtarlanan kısa ömürlü bir önbellek tutar.

## Gelen debounce

**Aynı gönderenden** hızlı ardışık mesajlar, `messages.inbound` aracılığıyla tek bir ajan turunda toplu işlenebilir. Debounce, kanal + konuşma başına kapsamlanır ve yanıt iş parçacığı/ID'leri için en son mesajı kullanır.

Yapılandırma (genel varsayılan + kanal başına geçersiz kılmalar):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Notlar:

- Debounce, **yalnızca metin** mesajlarına uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları, bağımsız kalmaları için debounce'u atlar. Aynı gönderenli DM birleştirmesine açıkça katılan kanallar, bölünmüş gönderim yükünün aynı ajan turuna katılabilmesi için DM komutlarını debounce penceresi içinde tutabilir.

## Oturumlar ve cihazlar

Oturumların sahibi istemciler değil, Gateway'dir.

- Doğrudan sohbetler ajan ana oturum anahtarına daraltılır.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve dökümler Gateway ana makinesinde bulunur.

Birden fazla cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak geri eşitlenmez. Öneri: ayrışan bağlamdan kaçınmak için uzun konuşmalarda tek bir birincil cihaz kullanın. Denetim arayüzü ve TUI her zaman Gateway destekli oturum dökümünü gösterir, bu nedenle doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Araç sonucu meta verileri

Araç sonucu `content`, modelin görebildiği sonuçtur. Araç sonucu `details`, arayüz işleme, tanılama, medya teslimi ve plugin'ler için çalışma zamanı meta verileridir.

OpenClaw bu sınırı açık tutar:

- `toolResult.details`, sağlayıcı yeniden yürütmesi ve Compaction girdisinden önce çıkarılır.
- Kalıcı oturum dökümleri yalnızca sınırlı `details` tutar; aşırı büyük meta veriler, `persistedDetailsTruncated: true` ile işaretlenmiş kompakt bir özetle değiştirilir.
- Plugin'ler ve araçlar, modelin okuması gereken metni yalnızca `details` içine değil, `content` içine koymalıdır.

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw, **istem gövdesini** **komut gövdesinden** ayırır:

- `BodyForAgent`: geçerli mesaj için birincil model odaklı metin. Kanal plugin'leri bunu gönderenin geçerli istem taşıyan metnine odaklı tutmalıdır.
- `Body`: eski istem yedeği. Bu, kanal zarflarını ve isteğe bağlı geçmiş sarmalayıcılarını içerebilir, ancak güncel kanallar `BodyForAgent` mevcut olduğunda birincil model girdisi olarak buna güvenmemelidir.
- `CommandBody`: yönerge/komut ayrıştırması için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski takma ad (uyumluluk için korunur).

Bir kanal geçmiş sağladığında, paylaşılan bir sarmalayıcı kullanır:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**Doğrudan olmayan sohbetlerde** (gruplar/kanallar/odalar), **geçerli mesaj gövdesi** gönderen etiketiyle öneklenir (geçmiş girdileriyle aynı stil kullanılır). Bu, gerçek zamanlı ve kuyruğa alınmış/geçmiş mesajlarını ajan isteminde tutarlı tutar.

Geçmiş tamponları **yalnızca bekleyen** öğelerdir: bir çalıştırmayı tetiklemeyen grup mesajlarını (örneğin, bahsetme kapılı mesajlar) içerir ve oturum dökümünde zaten bulunan mesajları **hariç tutar**.

Yönerge çıkarma yalnızca **geçerli mesaj** bölümüne uygulanır, böylece geçmiş bozulmadan kalır. Geçmişi sarmalayan kanallar, `CommandBody` (veya `RawBody`) değerini özgün mesaj metnine ayarlamalı ve `Body` değerini birleştirilmiş istem olarak tutmalıdır. Yapılandırılmış geçmiş, yanıt, iletilmiş mesaj ve kanal meta verileri, istem oluşturma sırasında kullanıcı rolünde güvenilmeyen bağlam blokları olarak işlenir.
Geçmiş tamponları, `messages.groupChat.historyLimit` (genel varsayılan) ve `channels.slack.historyLimit` veya `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalar aracılığıyla yapılandırılabilir (devre dışı bırakmak için `0` ayarlayın).

## Kuyruğa alma ve takipler

Bir çalıştırma zaten etkinse, gelen mesajlar kuyruğa alınabilir, geçerli çalıştırmaya yönlendirilebilir veya bir takip turu için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) aracılığıyla yapılandırın.
- Varsayılan mod `steer` modudur; yönlendirme kuyruğa alınmış takip teslimine geri düştüğünde 500 ms takip debounce'u kullanılır.
- Modlar: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` ve eski tek seferde bir `queue` modu.

Ayrıntılar: [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Kanal çalıştırma sahipliği

Kanal plugin'leri, bir mesaj oturum kuyruğuna girmeden önce sıralamayı koruyabilir, girdiye debounce uygulayabilir ve aktarım geri basıncı uygulayabilir. Ajan turunun kendisinin etrafında ayrı bir zaman aşımı dayatmamalıdırlar. Bir mesaj bir oturuma yönlendirildiğinde, uzun süren iş oturum, araç ve çalışma zamanı yaşam döngüsü tarafından yönetilir; böylece tüm kanallar yavaş turları tutarlı biçimde raporlar ve kurtarır.

## Akış, parçalama ve toplu işleme

Blok akışı, model metin blokları ürettikçe kısmi yanıtlar gönderir. Parçalama, kanal metin sınırlarına uyar ve çitli kodu bölmekten kaçınır.

Temel ayarlar:

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan kapalı)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalmaya dayalı toplu işleme)
- `agents.defaults.humanDelay` (blok yanıtları arasında insan benzeri duraklama)
- Kanal geçersiz kılmaları: `*.blockStreaming` ve `*.blockStreamingCoalesce` (Telegram dışı kanallar açıkça `*.blockStreaming: true` gerektirir)

Ayrıntılar: [Akış + parçalama](/tr/concepts/streaming).

## Akıl yürütme görünürlüğü ve token'lar

OpenClaw model akıl yürütmesini gösterebilir veya gizleyebilir:

- `/reasoning on|off|stream` görünürlüğü denetler.
- Akıl yürütme içeriği, model tarafından üretildiğinde token kullanımına yine de dahil edilir.
- Telegram, akıl yürütme akışını son teslimden sonra silinen geçici bir taslak balonuna destekler; kalıcı akıl yürütme çıktısı için `/reasoning on` kullanın.

Ayrıntılar: [Düşünme + akıl yürütme yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Önekler, iş parçacığı oluşturma ve yanıtlar

Giden mesaj biçimlendirme `messages` içinde merkezileştirilmiştir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden önek kademesi), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen öneki)
- `replyToMode` ve kanal başına varsayılanlar aracılığıyla yanıt iş parçacığı

Ayrıntılar: [Yapılandırma](/tr/gateway/config-agents#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz token `NO_REPLY` / `no_reply`, "kullanıcıya görünür bir yanıt teslim etme" anlamına gelir.
Bir turda üretilmiş TTS sesi gibi bekleyen araç medyası da varsa, OpenClaw sessiz metni çıkarır ancak medya ekini yine de teslim eder.
OpenClaw bu davranışı konuşma türüne göre çözümler:

- Doğrudan konuşmalar varsayılan olarak sessizliğe izin vermez ve yalın bir sessiz yanıtı kısa görünür bir yedeğe yeniden yazar.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir.
- İç orkestrasyon varsayılan olarak sessizliğe izin verir.

OpenClaw ayrıca doğrudan olmayan sohbetlerde herhangi bir asistan yanıtından önce gerçekleşen iç çalıştırıcı hataları için sessiz yanıtlar kullanır; böylece gruplar/kanallar Gateway hata kalıp metnini görmez. Doğrudan sohbetler varsayılan olarak kompakt hata metni gösterir; ham çalıştırıcı ayrıntıları yalnızca `/verbose` `on` veya `full` olduğunda gösterilir.

Varsayılanlar `agents.defaults.silentReply` ve `agents.defaults.silentReplyRewrite` altında bulunur; `surfaces.<id>.silentReply` ve `surfaces.<id>.silentReplyRewrite` bunları yüzey başına geçersiz kılabilir.

Üst oturumda bekleyen bir veya daha fazla oluşturulmuş alt ajan çalıştırması olduğunda, yalın sessiz yanıtlar yeniden yazılmak yerine tüm yüzeylerde düşürülür; böylece üst öğe, alt tamamlanma olayı gerçek yanıtı teslim edene kadar sessiz kalır.

## İlgili

- [Mesaj yaşam döngüsü refaktörü](/tr/concepts/message-lifecycle-refactor) - dayanıklı gönderme ve alma tasarımı hedefi
- [Akış](/tr/concepts/streaming) — gerçek zamanlı mesaj teslimi
- [Yeniden deneme](/tr/concepts/retry) — mesaj teslimi yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — mesaj işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
