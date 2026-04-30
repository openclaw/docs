---
read_when:
    - Gelen iletilerin yanıtlara nasıl dönüştüğünü açıklama
    - Oturumları, kuyruğa alma modlarını veya akış davranışını netleştirme
    - Akıl yürütme görünürlüğünü ve kullanım etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruğa alma ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-04-30T16:28:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gelen mesajları oturum çözümleme, kuyruğa alma, akış, araç yürütme ve akıl yürütme görünürlüğünden oluşan bir işlem hattıyla ele alır. Bu sayfa, gelen mesajdan yanıta giden yolu haritalandırır.

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
- Sınırlar ve akış anahtarları için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.).

Tam şema için bkz. [Yapılandırma](/tr/gateway/configuration).

## Gelen yinelenenleri ayıklama

Kanallar, yeniden bağlanmalardan sonra aynı mesajı yeniden teslim edebilir. OpenClaw, yinelenen teslimlerin başka bir ajan çalıştırmasını tetiklememesi için kanal/hesap/eş/oturum/mesaj kimliğine göre anahtarlanan kısa ömürlü bir önbellek tutar.

## Gelenleri bekletip birleştirme

**Aynı gönderenden** gelen hızlı ardışık mesajlar, `messages.inbound` aracılığıyla tek bir ajan turunda toplu işlenebilir. Bekletip birleştirme, kanal + konuşma başına kapsamlanır ve yanıt iş parçacığı/kimlikleri için en son mesajı kullanır.

Yapılandırma (küresel varsayılan + kanal başına geçersiz kılmalar):

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

- Bekletip birleştirme **yalnızca metin** mesajlarına uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları, bağımsız kalmaları için bekletip birleştirmeyi atlar; **ancak** bir kanal aynı gönderenden DM birleştirmesine açıkça katıldığında bu geçerli değildir (ör. [BlueBubbles `coalesceSameSenderDms`](/tr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)); burada DM komutları, bölünmüş gönderim yükünün aynı ajan turuna katılabilmesi için bekletip birleştirme penceresinde bekler.

## Oturumlar ve cihazlar

Oturumların sahibi istemciler değil, Gateway’dir.

- Doğrudan sohbetler ajan ana oturum anahtarına daraltılır.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve dökümler Gateway ana makinesinde yaşar.

Birden çok cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak geri eşitlenmez. Öneri: bağlamın ayrışmasını önlemek için uzun konuşmalarda tek bir birincil cihaz kullanın. Control UI ve TUI her zaman Gateway destekli oturum dökümünü gösterir; bu nedenle doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Araç sonucu meta verileri

Araç sonucu `content`, modelin görebildiği sonuçtur. Araç sonucu `details`; UI işleme, tanılama, medya teslimi ve Plugin’ler için çalışma zamanı meta verileridir.

OpenClaw bu sınırı açık tutar:

- `toolResult.details`, sağlayıcı yeniden oynatma ve Compaction girdisinden önce çıkarılır.
- Kalıcı oturum dökümleri yalnızca sınırlı `details` tutar; aşırı büyük meta veriler, `persistedDetailsTruncated: true` ile işaretlenmiş kompakt bir özetle değiştirilir.
- Plugin’ler ve araçlar, modelin okuması gereken metni yalnızca `details` içine değil, `content` içine koymalıdır.

## Gelen gövdeleri ve geçmiş bağlamı

OpenClaw, **istem gövdesini** **komut gövdesinden** ayırır:

- `BodyForAgent`: geçerli mesaj için modele dönük birincil metin. Kanal Plugin’leri bunu gönderenin geçerli istem taşıyan metnine odaklı tutmalıdır.
- `Body`: eski istem yedeği. Bu, kanal zarflarını ve isteğe bağlı geçmiş sarmalayıcılarını içerebilir; ancak mevcut kanallar, `BodyForAgent` kullanılabilir olduğunda birincil model girdisi olarak buna güvenmemelidir.
- `CommandBody`: yönerge/komut ayrıştırması için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski takma ad (uyumluluk için tutulur).

Bir kanal geçmiş sağladığında, paylaşılan bir sarmalayıcı kullanır:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**Doğrudan olmayan sohbetler** (gruplar/kanallar/odalar) için **geçerli mesaj gövdesinin** başına gönderen etiketi eklenir (geçmiş girdileri için kullanılan aynı stil). Bu, gerçek zamanlı ve kuyruğa alınmış/geçmiş mesajlarını ajan isteminde tutarlı tutar.

Geçmiş arabellekleri **yalnızca bekleyenleri** içerir: bir çalıştırmayı tetiklemeyen grup mesajlarını (örneğin, bahsetme kapısıyla sınırlanan mesajlar) içerir ve oturum dökümünde zaten bulunan mesajları **hariç tutar**.

Yönerge ayıklama yalnızca **geçerli mesaj** bölümüne uygulanır, böylece geçmiş bozulmadan kalır. Geçmişi sarmalayan kanallar, `CommandBody` (veya `RawBody`) değerini özgün mesaj metnine ayarlamalı ve `Body` değerini birleştirilmiş istem olarak tutmalıdır. Yapılandırılmış geçmiş, yanıt, iletilmiş içerik ve kanal meta verileri, istem birleştirme sırasında kullanıcı rolündeki güvenilmeyen bağlam blokları olarak işlenir.
Geçmiş arabellekleri `messages.groupChat.historyLimit` (küresel varsayılan) ve `channels.slack.historyLimit` ya da `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalarla yapılandırılabilir (devre dışı bırakmak için `0` ayarlayın).

## Kuyruğa alma ve takipler

Bir çalıştırma zaten etkinse, gelen mesajlar kuyruğa alınabilir, geçerli çalıştırmaya yönlendirilebilir veya bir takip turu için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) aracılığıyla yapılandırın.
- Varsayılan mod `steer`’dır; yönlendirme kuyruğa alınmış takip teslimine geri döndüğünde 500 ms takip bekletip birleştirmesi vardır.
- Modlar: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` ve eski tek seferde bir `queue` modu.

Ayrıntılar: [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Kanal çalıştırma sahipliği

Kanal Plugin’leri, bir mesaj oturum kuyruğuna girmeden önce sıralamayı koruyabilir, girdiyi bekletip birleştirebilir ve aktarım geri basıncı uygulayabilir. Ajan turunun kendisi etrafında ayrı bir zaman aşımı dayatmamalıdırlar. Bir mesaj bir oturuma yönlendirildikten sonra, uzun süren işler oturum, araç ve çalışma zamanı yaşam döngüsü tarafından yönetilir; böylece tüm kanallar yavaş turları tutarlı şekilde raporlar ve bunlardan kurtulur.

## Akış, parçalama ve toplu işleme

Blok akışı, model metin blokları ürettikçe kısmi yanıtlar gönderir.
Parçalama, kanal metin sınırlarına uyar ve çitle çevrili kodu bölmekten kaçınır.

Temel ayarlar:

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan kapalı)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalmaya dayalı toplu işleme)
- `agents.defaults.humanDelay` (blok yanıtları arasında insan benzeri duraklama)
- Kanal geçersiz kılmaları: `*.blockStreaming` ve `*.blockStreamingCoalesce` (Telegram olmayan kanallar açıkça `*.blockStreaming: true` gerektirir)

Ayrıntılar: [Akış + parçalama](/tr/concepts/streaming).

## Akıl yürütme görünürlüğü ve token’lar

OpenClaw, model akıl yürütmesini gösterebilir veya gizleyebilir:

- `/reasoning on|off|stream` görünürlüğü denetler.
- Akıl yürütme içeriği, model tarafından üretildiğinde yine token kullanımına dahil edilir.
- Telegram, taslak balonuna akıl yürütme akışını destekler.

Ayrıntılar: [Düşünme + akıl yürütme yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Önekler, iş parçacığı oluşturma ve yanıtlar

Giden mesaj biçimlendirmesi `messages` içinde merkezileştirilir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden önek basamaklandırması), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen öneki)
- `replyToMode` ve kanal başına varsayılanlar aracılığıyla yanıt iş parçacığı oluşturma

Ayrıntılar: [Yapılandırma](/tr/gateway/config-agents#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz token `NO_REPLY` / `no_reply`, “kullanıcıya görünür bir yanıt teslim etme” anlamına gelir.
Bir turda üretilmiş TTS sesi gibi bekleyen araç medyası da varsa OpenClaw sessiz metni çıkarır ancak medya ekini yine teslim eder.
OpenClaw bu davranışı konuşma türüne göre çözer:

- Doğrudan konuşmalar varsayılan olarak sessizliğe izin vermez ve yalın bir sessiz yanıtı kısa, görünür bir yedeğe yeniden yazar.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir.
- Dahili orkestrasyon varsayılan olarak sessizliğe izin verir.

OpenClaw ayrıca, doğrudan olmayan sohbetlerde herhangi bir asistan yanıtından önce gerçekleşen dahili çalıştırıcı hataları için sessiz yanıtlar kullanır; böylece gruplar/kanallar Gateway hata kalıp metnini görmez. Doğrudan sohbetler varsayılan olarak kompakt hata metni gösterir; ham çalıştırıcı ayrıntıları yalnızca `/verbose` `on` veya `full` olduğunda gösterilir.

Varsayılanlar `agents.defaults.silentReply` ve `agents.defaults.silentReplyRewrite` altında bulunur; `surfaces.<id>.silentReply` ve `surfaces.<id>.silentReplyRewrite` bunları yüzey başına geçersiz kılabilir.

Üst oturumda bir veya daha fazla bekleyen oluşturulmuş alt ajan çalıştırması olduğunda, yalın sessiz yanıtlar yeniden yazılmak yerine tüm yüzeylerde bırakılır; böylece üst oturum, alt tamamlanma olayı gerçek yanıtı teslim edene kadar sessiz kalır.

## İlgili

- [Akış](/tr/concepts/streaming) — gerçek zamanlı mesaj teslimi
- [Yeniden deneme](/tr/concepts/retry) — mesaj teslimi yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — mesaj işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
