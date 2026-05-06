---
read_when:
    - Gelen iletilerin nasıl yanıtlara dönüştüğünü açıklama
    - Oturumları, kuyruğa alma modlarını veya akış davranışını netleştirme
    - Akıl yürütme görünürlüğünü ve kullanım etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruğa alma ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-05-06T09:08:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw, gelen iletileri oturum çözümleme, kuyruğa alma, akış, araç yürütme ve akıl yürütme görünürlüğünden oluşan bir işlem hattı üzerinden ele alır. Bu sayfa, gelen iletiden yanıta giden yolu haritalandırır.

## İleti akışı (üst düzey)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Temel ayarlar yapılandırmada bulunur:

- Ön ekler, kuyruğa alma ve grup davranışı için `messages.*`.
- Blok akışı ve parçalama varsayılanları için `agents.defaults.*`.
- Sınırlar ve akış açma/kapatma seçenekleri için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.).

Tam şema için bkz. [Yapılandırma](/tr/gateway/configuration).

## Gelen yinelenenleri ayıklama

Kanallar, yeniden bağlanmalardan sonra aynı iletiyi yeniden teslim edebilir. OpenClaw, yinelenen teslimatların başka bir agent çalıştırmasını tetiklememesi için kanal/hesap/eş/oturum/ileti kimliğine göre anahtarlanan kısa ömürlü bir önbellek tutar.

## Gelen iletilerde bekletme

**Aynı gönderenden** gelen hızlı ardışık iletiler, `messages.inbound` aracılığıyla tek bir agent turunda toplu işlenebilir. Bekletme, kanal + konuşma başına kapsamlandırılır ve yanıt iş parçacığı/kimlikleri için en son iletiyi kullanır.

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

- Bekletme yalnızca **salt metin** iletilerine uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları, bağımsız kalmaları için bekletmeyi atlar; **ancak** bir kanal aynı gönderenden gelen DM birleştirmesine açıkça katılırsa (ör. [BlueBubbles `coalesceSameSenderDms`](/tr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), DM komutları bekletme penceresinde bekler; böylece bölünerek gönderilmiş bir yük aynı agent turuna katılabilir.

## Oturumlar ve cihazlar

Oturumlar istemciler tarafından değil, Gateway tarafından sahiplenilir.

- Doğrudan sohbetler, agent ana oturum anahtarına daraltılır.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve dökümler Gateway ana makinesinde yaşar.

Birden fazla cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak geri eşitlenmez. Öneri: bağlam ayrışmasını önlemek için uzun konuşmalarda tek bir birincil cihaz kullanın. Control UI ve TUI her zaman Gateway destekli oturum dökümünü gösterir; bu nedenle doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Araç sonucu meta verileri

Araç sonucu `content`, modelin görebildiği sonuçtur. Araç sonucu `details`, UI işleme, tanılama, medya teslimi ve Plugin'ler için çalışma zamanı meta verileridir.

OpenClaw bu sınırı açık tutar:

- `toolResult.details`, sağlayıcı yeniden oynatımı ve Compaction girdisinden önce kaldırılır.
- Kalıcı oturum dökümleri yalnızca sınırlı `details` tutar; aşırı büyük meta veriler `persistedDetailsTruncated: true` ile işaretlenen kompakt bir özetle değiştirilir.
- Plugin'ler ve araçlar, modelin okuması gereken metni yalnızca `details` içine değil, `content` içine koymalıdır.

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw, **istem gövdesini** **komut gövdesinden** ayırır:

- `BodyForAgent`: Geçerli ileti için modele dönük birincil metin. Kanal Plugin'leri bunu gönderenin geçerli istem taşıyan metnine odaklı tutmalıdır.
- `Body`: Eski istem yedeği. Bu, kanal zarflarını ve isteğe bağlı geçmiş sarmalayıcılarını içerebilir, ancak mevcut kanallar `BodyForAgent` kullanılabilir olduğunda birincil model girdisi olarak buna güvenmemelidir.
- `CommandBody`: Yönerge/komut ayrıştırma için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski ad (uyumluluk için tutulur).

Bir kanal geçmiş sağladığında, paylaşılan bir sarmalayıcı kullanır:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**Doğrudan olmayan sohbetler** (gruplar/kanallar/odalar) için **geçerli ileti gövdesinin** başına gönderen etiketi eklenir (geçmiş girdileri için kullanılan aynı stil). Bu, gerçek zamanlı ve kuyruğa alınmış/geçmiş iletilerini agent isteminde tutarlı tutar.

Geçmiş arabellekleri **yalnızca beklemedekileri** içerir: bir çalıştırmayı tetiklememiş grup iletilerini (örneğin, bahsetme kapılı iletiler) içerir ve oturum dökümünde zaten bulunan iletileri **hariç tutar**.

Yönerge ayıklama yalnızca **geçerli ileti** bölümüne uygulanır; böylece geçmiş bozulmadan kalır. Geçmişi sarmalayan kanallar, `CommandBody` (veya `RawBody`) değerini özgün ileti metnine ayarlamalı ve `Body` değerini birleşik istem olarak tutmalıdır. Yapılandırılmış geçmiş, yanıt, iletilen ve kanal meta verileri, istem derleme sırasında kullanıcı rolünde güvenilmeyen bağlam blokları olarak işlenir.
Geçmiş arabellekleri `messages.groupChat.historyLimit` (genel varsayılan) ve `channels.slack.historyLimit` veya `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalar üzerinden yapılandırılabilir (devre dışı bırakmak için `0` ayarlayın).

## Kuyruğa alma ve takipler

Bir çalıştırma zaten etkinse, gelen iletiler kuyruğa alınabilir, geçerli çalıştırmaya yönlendirilebilir veya bir takip turu için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) üzerinden yapılandırın.
- Varsayılan mod `steer` olur; yönlendirme kuyruğa alınmış takip teslimine geri düştüğünde 500 ms takip bekletmesi kullanılır.
- Modlar: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` ve eski her seferinde bir tane işleyen `queue` modu.

Ayrıntılar: [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Kanal çalıştırma sahipliği

Kanal Plugin'leri, bir ileti oturum kuyruğuna girmeden önce sıralamayı koruyabilir, girdiyi bekletebilir ve taşıma geri basıncı uygulayabilir. Agent turunun kendisinin etrafına ayrı bir zaman aşımı dayatmamalıdırlar. Bir ileti bir oturuma yönlendirildiğinde, uzun süren iş oturum, araç ve çalışma zamanı yaşam döngüsü tarafından yönetilir; böylece tüm kanallar yavaş turları tutarlı biçimde bildirir ve bunlardan kurtulur.

## Akış, parçalama ve toplu işleme

Blok akışı, model metin blokları ürettikçe kısmi yanıtları gönderir. Parçalama, kanal metin sınırlarına uyar ve çitli kodu bölmekten kaçınır.

Temel ayarlar:

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan kapalı)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalmaya dayalı toplu işleme)
- `agents.defaults.humanDelay` (blok yanıtları arasında insan benzeri duraklama)
- Kanal geçersiz kılmaları: `*.blockStreaming` ve `*.blockStreamingCoalesce` (Telegram dışı kanallar açıkça `*.blockStreaming: true` gerektirir)

Ayrıntılar: [Akış + parçalama](/tr/concepts/streaming).

## Akıl yürütme görünürlüğü ve token'lar

OpenClaw, model akıl yürütmesini gösterebilir veya gizleyebilir:

- `/reasoning on|off|stream` görünürlüğü denetler.
- Akıl yürütme içeriği, model tarafından üretildiğinde token kullanımına yine de sayılır.
- Telegram, son teslimden sonra silinen geçici bir taslak balonuna akıl yürütme akışını destekler; kalıcı akıl yürütme çıktısı için `/reasoning on` kullanın.

Ayrıntılar: [Düşünme + akıl yürütme yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Ön ekler, iş parçacığı ve yanıtlar

Giden ileti biçimlendirme `messages` içinde merkezileştirilir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden ön ek basamaklandırması), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen ön eki)
- `replyToMode` ve kanal başına varsayılanlar üzerinden yanıt iş parçacığı

Ayrıntılar: [Yapılandırma](/tr/gateway/config-agents#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz token `NO_REPLY` / `no_reply`, "kullanıcıya görünür bir yanıt teslim etme" anlamına gelir.
Bir turda oluşturulmuş TTS sesi gibi bekleyen araç medyası da olduğunda, OpenClaw sessiz metni kaldırır ancak medya ekini yine de teslim eder.
OpenClaw bu davranışı konuşma türüne göre çözer:

- Doğrudan konuşmalar varsayılan olarak sessizliğe izin vermez ve tek başına bir sessiz yanıtı kısa görünür bir yedeğe yeniden yazar.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir.
- İç düzenleme varsayılan olarak sessizliğe izin verir.

OpenClaw, doğrudan olmayan sohbetlerde herhangi bir asistan yanıtından önce gerçekleşen iç çalıştırıcı hataları için de sessiz yanıtları kullanır; böylece gruplar/kanallar Gateway hata kalıp metnini görmez. Doğrudan sohbetler varsayılan olarak kompakt hata metni gösterir; ham çalıştırıcı ayrıntıları yalnızca `/verbose` `on` veya `full` olduğunda gösterilir.

Varsayılanlar `agents.defaults.silentReply` ve `agents.defaults.silentReplyRewrite` altında bulunur; `surfaces.<id>.silentReply` ve `surfaces.<id>.silentReplyRewrite` bunları yüzey başına geçersiz kılabilir.

Üst oturumda bekleyen bir veya daha fazla oluşturulmuş alt agent çalıştırması olduğunda, tek başına sessiz yanıtlar yeniden yazılmak yerine tüm yüzeylerde bırakılır; böylece üst oturum, çocuk tamamlama olayı gerçek yanıtı teslim edene kadar sessiz kalır.

## İlgili

- [İleti yaşam döngüsü yeniden düzenlemesi](/tr/concepts/message-lifecycle-refactor) - dayanıklı gönderme ve alma tasarım hedefi
- [Akış](/tr/concepts/streaming) — gerçek zamanlı ileti teslimi
- [Yeniden deneme](/tr/concepts/retry) — ileti teslimi yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — ileti işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
