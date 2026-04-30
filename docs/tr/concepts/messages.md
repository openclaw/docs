---
read_when:
    - Gelen mesajların nasıl yanıtlara dönüştüğünü açıklama
    - Oturumları, kuyruğa alma modlarını veya akış davranışını netleştirme
    - Akıl yürütme görünürlüğünü ve kullanım üzerindeki etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruğa alma ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-04-30T09:17:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw, gelen mesajları oturum çözümleme, kuyruğa alma, akış, araç yürütme ve akıl yürütme görünürlüğünden oluşan bir işlem hattıyla işler. Bu sayfa, gelen mesajdan yanıta giden yolu haritalandırır.

## Mesaj akışı (üst düzey)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Temel ayar düğmeleri yapılandırmada bulunur:

- Ön ekler, kuyruğa alma ve grup davranışı için `messages.*`.
- Blok akışı ve parçalama varsayılanları için `agents.defaults.*`.
- Sınırlar ve akış geçişleri için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.).

Tam şema için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Gelen tekilleştirme

Kanallar, yeniden bağlantılardan sonra aynı mesajı tekrar teslim edebilir. OpenClaw, yinelenen teslimlerin başka bir ajan çalıştırmasını tetiklememesi için kanal/hesap/eş/oturum/mesaj kimliğiyle anahtarlanan kısa ömürlü bir önbellek tutar.

## Gelen debounce işlemi

**Aynı gönderenden** gelen hızlı ardışık mesajlar, `messages.inbound` aracılığıyla tek bir ajan turunda toplu işlenebilir. Debounce, kanal + konuşma başına kapsamlanır ve yanıt iş parçacığı/kimlikleri için en son mesajı kullanır.

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

- Debounce, **yalnızca metin** mesajlarına uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları, bağımsız kalmaları için debounce işlemini atlar — bir kanalın aynı gönderenden gelen DM birleştirmesine açıkça katılması **hariç** (ör. [BlueBubbles `coalesceSameSenderDms`](/tr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)); bu durumda DM komutları, bölünmüş gönderim yükünün aynı ajan turuna katılabilmesi için debounce penceresi içinde bekler.

## Oturumlar ve cihazlar

Oturumlar istemciler tarafından değil, Gateway tarafından sahiplenilir.

- Doğrudan sohbetler, ajanın ana oturum anahtarına daraltılır.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve transkriptler Gateway ana makinesinde bulunur.

Birden fazla cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak geri senkronize edilmez. Öneri: bağlamın ayrışmasını önlemek için uzun konuşmalarda tek bir birincil cihaz kullanın. Control UI ve TUI her zaman Gateway destekli oturum transkriptini gösterir; bu yüzden doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Araç sonucu meta verileri

Araç sonucu `content`, model tarafından görülebilen sonuçtur. Araç sonucu `details`, UI işleme, tanılama, medya teslimi ve Plugin'ler için çalışma zamanı meta verileridir.

OpenClaw bu sınırı açık tutar:

- `toolResult.details`, sağlayıcı tekrar oynatma ve Compaction girdisinden önce çıkarılır.
- Kalıcı oturum transkriptleri yalnızca sınırlandırılmış `details` tutar; aşırı büyük meta veriler, `persistedDetailsTruncated: true` ile işaretlenmiş kompakt bir özetle değiştirilir.
- Plugin'ler ve araçlar, modelin okuması gereken metni yalnızca `details` içine değil, `content` içine koymalıdır.

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw, **istem gövdesini** **komut gövdesinden** ayırır:

- `Body`: ajana gönderilen istem metni. Bu, kanal zarflarını ve isteğe bağlı geçmiş sarmalayıcılarını içerebilir.
- `CommandBody`: yönerge/komut ayrıştırma için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski takma ad (uyumluluk için korunur).

Bir kanal geçmiş sağladığında, paylaşılan bir sarmalayıcı kullanır:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**Doğrudan olmayan sohbetlerde** (gruplar/kanallar/odalar), **geçerli mesaj gövdesi** gönderen etiketiyle ön eklenir (geçmiş girdileri için kullanılan aynı stil). Bu, gerçek zamanlı ve kuyruklanmış/geçmiş mesajlarını ajan isteminde tutarlı tutar.

Geçmiş arabellekleri **yalnızca bekleyen** yapıdadır: bir çalıştırmayı tetiklemeyen grup mesajlarını (örneğin, bahsetme geçitli mesajlar) içerir ve oturum transkriptinde zaten bulunan mesajları **hariç tutar**.

Yönerge ayıklama yalnızca **geçerli mesaj** bölümüne uygulanır, böylece geçmiş bozulmadan kalır. Geçmişi saran kanallar, `CommandBody` (veya `RawBody`) değerini özgün mesaj metnine ayarlamalı ve `Body` değerini birleşik istem olarak tutmalıdır. Geçmiş arabellekleri `messages.groupChat.historyLimit` (küresel varsayılan) ve `channels.slack.historyLimit` veya `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalar aracılığıyla yapılandırılabilir (devre dışı bırakmak için `0` ayarlayın).

## Kuyruğa alma ve takipler

Bir çalıştırma zaten etkinse, gelen mesajlar kuyruğa alınabilir, geçerli çalıştırmaya yönlendirilebilir veya bir takip turu için toplanabilir.

- `messages.queue` (ve `messages.queue.byChannel`) aracılığıyla yapılandırın.
- Varsayılan mod `steer` olup, yönlendirme kuyruklanmış takip teslimine geri düştüğünde 500 ms takip debounce süresi kullanır.
- Modlar: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` ve eski teker teker `queue` modu.

Ayrıntılar: [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Kanal çalıştırma sahipliği

Kanal Plugin'leri, bir mesaj oturum kuyruğuna girmeden önce sıralamayı koruyabilir, girdiye debounce uygulayabilir ve taşıma geri basıncı uygulayabilir. Ajan turunun kendisi etrafında ayrı bir zaman aşımı dayatmamalıdırlar. Bir mesaj oturuma yönlendirildikten sonra, uzun süren işler oturum, araç ve çalışma zamanı yaşam döngüsü tarafından yönetilir; böylece tüm kanallar yavaş turları tutarlı şekilde raporlar ve toparlar.

## Akış, parçalama ve toplu işleme

Blok akışı, model metin blokları ürettikçe kısmi yanıtlar gönderir. Parçalama, kanal metin sınırlarına uyar ve çitle çevrili kodu bölmekten kaçınır.

Temel ayarlar:

- `agents.defaults.blockStreamingDefault` (`on|off`, varsayılan kapalı)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (boşta kalmaya dayalı toplu işleme)
- `agents.defaults.humanDelay` (blok yanıtları arasında insana benzer duraklama)
- Kanal geçersiz kılmaları: `*.blockStreaming` ve `*.blockStreamingCoalesce` (Telegram dışı kanallar açıkça `*.blockStreaming: true` gerektirir)

Ayrıntılar: [Akış + parçalama](/tr/concepts/streaming).

## Akıl yürütme görünürlüğü ve token'lar

OpenClaw, model akıl yürütmesini gösterebilir veya gizleyebilir:

- `/reasoning on|off|stream` görünürlüğü denetler.
- Akıl yürütme içeriği, model tarafından üretildiğinde token kullanımına yine de dahil edilir.
- Telegram, taslak balonuna akıl yürütme akışını destekler.

Ayrıntılar: [Düşünme + akıl yürütme yönergeleri](/tr/tools/thinking) ve [Token kullanımı](/tr/reference/token-use).

## Ön ekler, iş parçacığı oluşturma ve yanıtlar

Giden mesaj biçimlendirme `messages` içinde merkezileştirilir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden ön ek basamaklandırması), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen ön eki)
- `replyToMode` ve kanal başına varsayılanlar aracılığıyla yanıt iş parçacığı oluşturma

Ayrıntılar: [Yapılandırma](/tr/gateway/config-agents#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz token `NO_REPLY` / `no_reply`, “kullanıcı tarafından görülebilen bir yanıt teslim etme” anlamına gelir. Bir turda oluşturulmuş TTS sesi gibi bekleyen araç medyası da varsa, OpenClaw sessiz metni çıkarır ancak medya ekini yine de teslim eder. OpenClaw bu davranışı konuşma türüne göre çözer:

- Doğrudan konuşmalar varsayılan olarak sessizliğe izin vermez ve çıplak bir sessiz yanıtı kısa, görünür bir yedek yanıta yeniden yazar.
- Gruplar/kanallar varsayılan olarak sessizliğe izin verir.
- Dahili orkestrasyon varsayılan olarak sessizliğe izin verir.

OpenClaw, doğrudan olmayan sohbetlerde herhangi bir asistan yanıtından önce gerçekleşen dahili çalıştırıcı hataları için de sessiz yanıtlar kullanır; böylece gruplar/kanallar Gateway hata kalıp metnini görmez. Doğrudan sohbetler varsayılan olarak kompakt hata metni gösterir; ham çalıştırıcı ayrıntıları yalnızca `/verbose` `on` veya `full` olduğunda gösterilir.

Varsayılanlar `agents.defaults.silentReply` ve `agents.defaults.silentReplyRewrite` altında bulunur; `surfaces.<id>.silentReply` ve `surfaces.<id>.silentReplyRewrite` bunları yüzey başına geçersiz kılabilir.

Üst oturumda bekleyen bir veya daha fazla oluşturulmuş alt ajan çalıştırması olduğunda, çıplak sessiz yanıtlar yeniden yazılmak yerine tüm yüzeylerde bırakılır; böylece üst oturum, alt tamamlanma olayı gerçek yanıtı teslim edene kadar sessiz kalır.

## İlgili

- [Akış](/tr/concepts/streaming) — gerçek zamanlı mesaj teslimi
- [Yeniden deneme](/tr/concepts/retry) — mesaj teslimi yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — mesaj işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
