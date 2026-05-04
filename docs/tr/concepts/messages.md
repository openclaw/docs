---
read_when:
    - Gelen iletilerin nasıl yanıtlara dönüştüğünü açıklama
    - Oturumları, kuyruğa alma modlarını veya akış davranışını açıklığa kavuşturma
    - Akıl yürütme görünürlüğünü ve kullanıma ilişkin etkileri belgeleme
summary: Mesaj akışı, oturumlar, kuyruğa alma ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-05-04T07:03:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gelen iletileri oturum çözümleme, kuyruğa alma, akış, araç yürütme ve akıl yürütme görünürlüğünden oluşan bir işlem hattı üzerinden ele alır. Bu sayfa, gelen iletiden yanıta giden yolu eşler.

## İleti akışı (üst düzey)

```
Gelen ileti
  -> yönlendirme/bağlamalar -> oturum anahtarı
  -> kuyruk (bir çalıştırma etkinse)
  -> aracı çalıştırma (akış + araçlar)
  -> giden yanıtlar (kanal sınırları + parçalama)
```

Temel ayarlar yapılandırmada bulunur:

- `messages.*` önekler, kuyruğa alma ve grup davranışı için.
- `agents.defaults.*` blok akışı ve parçalama varsayılanları için.
- Kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.) sınırlar ve akış anahtarları için.

Tam şema için bkz. [Yapılandırma](/tr/gateway/configuration).

## Gelen tekilleştirme

Kanallar, yeniden bağlanmalardan sonra aynı iletiyi yeniden teslim edebilir. OpenClaw, yinelenen teslimlerin başka bir aracı çalıştırmasını tetiklememesi için kanal/hesap/eş/oturum/ileti kimliğiyle anahtarlanan kısa ömürlü bir önbellek tutar.

## Gelen geciktirme

**Aynı gönderenden** gelen hızlı ardışık iletiler, `messages.inbound` aracılığıyla tek bir aracı turunda toplu işlenebilir. Geciktirme kanal + konuşma başına kapsamlanır ve yanıt iş parçacığı/kimlikleri için en son iletiyi kullanır.

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

- Geciktirme **yalnızca metin** iletilerine uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları, bağımsız kalmaları için geciktirmeyi atlar — bir kanalın aynı gönderenli DM birleştirmeye açıkça katıldığı durumlar **hariçtir** (örn. [BlueBubbles `coalesceSameSenderDms`](/tr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)); burada DM komutları, bölünmüş gönderim yükünün aynı aracı turuna katılabilmesi için geciktirme penceresi içinde bekler.

## Oturumlar ve cihazlar

Oturumların sahibi istemciler değil Gateway'dir.

- Doğrudan sohbetler, aracının ana oturum anahtarına daraltılır.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve dökümler Gateway ana makinesinde bulunur.

Birden fazla cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak geri eşitlenmez. Öneri: bağlam ayrışmasını önlemek için uzun konuşmalarda tek bir birincil cihaz kullanın. Control UI ve TUI her zaman Gateway destekli oturum dökümünü gösterir, bu nedenle doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Araç sonucu meta verileri

Araç sonucu `content`, model tarafından görülebilen sonuçtur. Araç sonucu `details`, UI işleme, tanılama, medya teslimi ve Plugin'ler için çalışma zamanı meta verileridir.

OpenClaw bu sınırı açık tutar:

- `toolResult.details`, sağlayıcı yeniden oynatması ve Compaction girdisinden önce çıkarılır.
- Kalıcı oturum dökümleri yalnızca sınırlı `details` tutar; aşırı büyük meta veriler, `persistedDetailsTruncated: true` ile işaretlenmiş kompakt bir özetle değiştirilir.
- Plugin'ler ve araçlar, modelin okuması gereken metni yalnızca `details` içine değil, `content` içine koymalıdır.

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw **prompt gövdesini** **komut gövdesinden** ayırır:

- `BodyForAgent`: Geçerli ileti için birincil model odaklı metin. Kanal Plugin'leri bunu gönderenin mevcut prompt taşıyan metnine odaklı tutmalıdır.
- `Body`: Eski prompt yedeği. Bu, kanal zarflarını ve isteğe bağlı geçmiş sarmalayıcılarını içerebilir, ancak mevcut kanallar `BodyForAgent` kullanılabilir olduğunda birincil model girdisi olarak buna güvenmemelidir.
- `CommandBody`: Yönerge/komut ayrıştırma için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski takma ad (uyumluluk için tutulur).

Bir kanal geçmiş sağladığında, paylaşılan bir sarmalayıcı kullanır:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**Doğrudan olmayan sohbetlerde** (gruplar/kanallar/odalar), **geçerli ileti gövdesi** gönderen etiketiyle öneklenir (geçmiş girdileriyle aynı stil kullanılır). Bu, gerçek zamanlı ve kuyruğa alınmış/geçmiş iletileri aracı prompt'unda tutarlı tutar.

Geçmiş arabellekleri **yalnızca bekleyen** niteliktedir: bir çalıştırmayı tetiklememiş grup iletilerini (örneğin, mention geçitli iletiler) içerir ve oturum dökümünde zaten bulunan iletileri **hariç tutar**.

Yönerge çıkarma yalnızca **geçerli ileti** bölümüne uygulanır, böylece geçmiş bozulmadan kalır. Geçmişi sarmalayan kanallar `CommandBody` (veya `RawBody`) değerini özgün ileti metnine ayarlamalı ve `Body` değerini birleşik prompt olarak tutmalıdır. Yapılandırılmış geçmiş, yanıt, iletilmiş ileti ve kanal meta verileri, prompt derleme sırasında kullanıcı rolünde güvenilmeyen bağlam blokları olarak işlenir.
Geçmiş arabellekleri `messages.groupChat.historyLimit` (genel varsayılan) ve `channels.slack.historyLimit` veya `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalar aracılığıyla yapılandırılabilir (devre dışı bırakmak için `0` ayarlayın).

## Kuyruğa alma ve takipler

Bir çalıştırma zaten etkinse, gelen iletiler kuyruğa alınabilir, geçerli çalıştırmaya yönlendirilebilir veya bir takip turu için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) aracılığıyla yapılandırın.
- Varsayılan mod `steer` olup yönlendirme kuyruğa alınmış takip teslimine geri düştüğünde 500 ms takip geciktirmesi kullanır.
- Modlar: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` ve eski tek seferde bir `queue` modu.

Ayrıntılar: [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Kanal çalıştırma sahipliği

Kanal Plugin'leri, bir ileti oturum kuyruğuna girmeden önce sıralamayı koruyabilir, girdiyi geciktirebilir ve aktarım geri basıncı uygulayabilir. Aracı turunun kendisi etrafında ayrı bir zaman aşımı dayatmamalıdır. Bir ileti bir oturuma yönlendirildiğinde, uzun süren işler oturum, araç ve çalışma zamanı yaşam döngüsü tarafından yönetilir; böylece tüm kanallar yavaş turları tutarlı şekilde bildirir ve kurtarır.

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
- Telegram, son teslimden sonra silinen geçici bir taslak balonuna akıl yürütme akışını destekler; kalıcı akıl yürütme çıktısı için `/reasoning on` kullanın.

Ayrıntılar: [Düşünme + akıl yürütme yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Önekler, iş parçacığı ve yanıtlar

Giden ileti biçimlendirmesi `messages` içinde merkezileştirilir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden önek basamaklaması), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen öneki)
- `replyToMode` ve kanal başına varsayılanlar aracılığıyla yanıt iş parçacığı oluşturma

Ayrıntılar: [Yapılandırma](/tr/gateway/config-agents#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz token `NO_REPLY` / `no_reply`, “kullanıcı tarafından görülebilir bir yanıt teslim etme” anlamına gelir.
Bir turda üretilmiş TTS sesi gibi bekleyen araç medyası da varsa, OpenClaw sessiz metni çıkarır ancak medya ekini yine de teslim eder.
OpenClaw bu davranışı konuşma türüne göre çözümler:

- Doğrudan konuşmalar varsayılan olarak sessizliğe izin vermez ve çıplak sessiz yanıtı kısa, görünür bir yedeğe yeniden yazar.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir.
- İç orkestrasyon varsayılan olarak sessizliğe izin verir.

OpenClaw, doğrudan olmayan sohbetlerde herhangi bir asistan yanıtından önce gerçekleşen iç çalıştırıcı hataları için de sessiz yanıtları kullanır; böylece gruplar/kanallar Gateway hata kalıp metnini görmez. Doğrudan sohbetler varsayılan olarak kompakt hata metni gösterir; ham çalıştırıcı ayrıntıları yalnızca `/verbose` `on` veya `full` olduğunda gösterilir.

Varsayılanlar `agents.defaults.silentReply` ve `agents.defaults.silentReplyRewrite` altında bulunur; `surfaces.<id>.silentReply` ve `surfaces.<id>.silentReplyRewrite` bunları yüzey başına geçersiz kılabilir.

Üst oturumda bekleyen bir veya daha fazla başlatılmış alt aracı çalıştırması olduğunda, çıplak sessiz yanıtlar yeniden yazılmak yerine tüm yüzeylerde bırakılır; böylece alt tamamlanma olayı gerçek yanıtı teslim edene kadar üst oturum sessiz kalır.

## İlgili

- [Akış](/tr/concepts/streaming) — gerçek zamanlı ileti teslimi
- [Yeniden deneme](/tr/concepts/retry) — ileti teslimi yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — ileti işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
