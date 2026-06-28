---
read_when:
    - Gelen mesajların nasıl yanıtlara dönüştüğünü açıklama
    - Oturumları, kuyruğa alma modlarını veya akış davranışını netleştirme
    - Akıl yürütme görünürlüğünü ve kullanım etkilerini belgeleme
summary: Mesaj akışı, oturumlar, kuyruğa alma ve akıl yürütme görünürlüğü
title: Mesajlar
x-i18n:
    generated_at: "2026-06-28T00:29:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw, gelen mesajları oturum çözümleme, kuyruğa alma, akış, araç yürütme ve akıl yürütme görünürlüğünden oluşan bir işlem hattı üzerinden işler. Bu sayfa, gelen mesajdan yanıta kadar olan yolu eşler.

## Mesaj akışı (üst düzey)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Temel ayar düğmeleri yapılandırmada yer alır:

- Ön ekler, kuyruğa alma ve grup davranışı için `messages.*`.
- Blok akışı ve parçalama varsayılanları için `agents.defaults.*`.
- Sınırlar ve akış açma/kapatma ayarları için kanal geçersiz kılmaları (`channels.whatsapp.*`, `channels.telegram.*` vb.).

Tam şema için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Gelen ileti tekilleştirme

Kanallar, yeniden bağlanmalardan sonra aynı mesajı tekrar teslim edebilir. OpenClaw, yinelenen teslimlerin başka bir ajan çalıştırması tetiklememesi için kanal/hesap/eş/oturum/mesaj kimliğine göre anahtarlanan kısa ömürlü bir önbellek tutar.

## Gelen ileti geciktirme

**Aynı gönderenden** hızlı ardışık mesajlar, `messages.inbound` aracılığıyla tek bir ajan turunda toplu işlenebilir. Geciktirme kapsamı kanal + konuşma başınadır ve yanıt iş parçacığı/kimlikleri için en son mesajı kullanır.

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

- Geciktirme yalnızca **sadece metin** mesajlarına uygulanır; medya/ekler hemen boşaltılır.
- Denetim komutları, bağımsız kalmaları için geciktirmeyi atlar. Aynı gönderen DM birleştirmesine açıkça katılan kanallar, bölünmüş gönderilen bir yükün aynı ajan turuna katılabilmesi için DM komutlarını geciktirme penceresi içinde tutabilir.

## Oturumlar ve cihazlar

Oturumlar istemciler tarafından değil, Gateway tarafından sahiplenilir.

- Doğrudan sohbetler, ajanın ana oturum anahtarına daraltılır.
- Gruplar/kanallar kendi oturum anahtarlarını alır.
- Oturum deposu ve dökümler Gateway ana makinesinde bulunur.

Birden çok cihaz/kanal aynı oturuma eşlenebilir, ancak geçmiş her istemciye tam olarak geri eşitlenmez. Öneri: bağlamın ayrışmasını önlemek için uzun konuşmalarda tek bir birincil cihaz kullanın. Control UI ve TUI her zaman Gateway destekli oturum dökümünü gösterir; bu nedenle doğruluk kaynağı onlardır.

Ayrıntılar: [Oturum yönetimi](/tr/concepts/session).

## Araç sonucu meta verileri

Araç sonucu `content`, modelin görebildiği sonuçtur. Araç sonucu `details`, UI işleme, tanılama, medya teslimi ve Plugin'ler için çalışma zamanı meta verileridir.

OpenClaw bu sınırı açık tutar:

- `toolResult.details`, sağlayıcı yeniden oynatması ve Compaction girdisinden önce çıkarılır.
- Kalıcı oturum dökümleri yalnızca sınırlandırılmış `details` tutar; aşırı büyük meta veriler, `persistedDetailsTruncated: true` olarak işaretlenmiş kompakt bir özetle değiştirilir.
- Plugin'ler ve araçlar, modelin okuması gereken metni yalnızca `details` içine değil, `content` içine koymalıdır.

## Gelen gövdeler ve geçmiş bağlamı

OpenClaw, **istem gövdesini** **komut gövdesinden** ayırır:

- `BodyForAgent`: geçerli mesaj için modele yönelik birincil metin. Kanal Plugin'leri bunu gönderenin geçerli istem taşıyan metnine odaklı tutmalıdır.
- `Body`: eski istem yedeği. Bu, kanal zarflarını ve isteğe bağlı geçmiş sarmalayıcılarını içerebilir, ancak mevcut kanallar `BodyForAgent` kullanılabilir olduğunda birincil model girdisi olarak buna dayanmamalıdır.
- `CommandBody`: yönerge/komut ayrıştırması için ham kullanıcı metni.
- `RawBody`: `CommandBody` için eski takma ad (uyumluluk için tutulur).

Bir kanal geçmiş sağladığında, paylaşılan bir sarmalayıcı kullanır:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**Doğrudan olmayan sohbetlerde** (gruplar/kanallar/odalar), **geçerli mesaj gövdesinin** başına gönderen etiketi eklenir (geçmiş girdileriyle aynı stil). Bu, gerçek zamanlı ve kuyruğa alınmış/geçmiş mesajlarını ajan isteminde tutarlı tutar.

Geçmiş arabellekleri **yalnızca bekleyenleri** içerir: bir çalıştırmayı tetiklemeyen grup mesajlarını (örneğin, bahsetme kapılı mesajlar) içerir ve oturum dökümünde zaten bulunan mesajları **hariç tutar**.

Yönerge çıkarma yalnızca **geçerli mesaj** bölümüne uygulanır, böylece geçmiş bozulmadan kalır. Geçmişi sarmalayan kanallar `CommandBody` (veya `RawBody`) değerini özgün mesaj metnine ayarlamalı ve `Body` değerini birleştirilmiş istem olarak tutmalıdır. Yapılandırılmış geçmiş, yanıt, iletilmiş mesaj ve kanal meta verileri, istem derleme sırasında kullanıcı rolünde güvenilmeyen bağlam blokları olarak işlenir.
Geçmiş arabellekleri `messages.groupChat.historyLimit` (genel varsayılan) ve `channels.slack.historyLimit` ya da `channels.telegram.accounts.<id>.historyLimit` gibi kanal başına geçersiz kılmalar ile yapılandırılabilir (devre dışı bırakmak için `0` ayarlayın).

## Kuyruğa alma ve takip iletileri

Bir çalıştırma zaten etkinse, gelen mesajlar varsayılan olarak geçerli çalıştırmaya yönlendirilir. `messages.queue`, etkin çalıştırma mesajlarının yönlendirilip yönlendirilmeyeceğini, daha sonrası için kuyruğa alınıp alınmayacağını, daha sonraki tek bir turda toplanıp toplanmayacağını veya etkin çalıştırmayı kesip kesmeyeceğini seçer.

- `messages.queue` (ve `messages.queue.byChannel`) üzerinden yapılandırın.
- Varsayılan mod `steer` olup Codex yönlendirme toplu işleri ve takip/toplama kuyrukları için 500 ms geciktirme kullanır.
- Modlar: `steer`, `followup`, `collect` ve `interrupt`.

Ayrıntılar: [Komut kuyruğu](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Kanal çalıştırma sahipliği

Kanal Plugin'leri, bir mesaj oturum kuyruğuna girmeden önce sıralamayı koruyabilir, girdiyi geciktirebilir ve aktarım geri basıncı uygulayabilir. Ajan turunun kendisi etrafında ayrı bir zaman aşımı dayatmamalıdırlar. Bir mesaj oturuma yönlendirildikten sonra, uzun süren iş oturum, araç ve çalışma zamanı yaşam döngüsü tarafından yönetilir; böylece tüm kanallar yavaş turları tutarlı biçimde raporlar ve toparlar.

## Akış, parçalama ve toplu işleme

Blok akışı, model metin blokları ürettikçe kısmi yanıtlar gönderir.
Parçalama, kanal metin sınırlarına uyar ve çitli kodu bölmekten kaçınır.

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

## Ön ekler, iş parçacıkları ve yanıtlar

Giden mesaj biçimlendirmesi `messages` içinde merkezileştirilmiştir:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` ve `channels.<channel>.accounts.<id>.responsePrefix` (giden ön ek kademesi), ayrıca `channels.whatsapp.messagePrefix` (WhatsApp gelen ön eki)
- `replyToMode` ve kanal başına varsayılanlar üzerinden yanıt iş parçacığı

Ayrıntılar: [Yapılandırma](/tr/gateway/config-agents#messages) ve kanal belgeleri.

## Sessiz yanıtlar

Tam sessiz token `NO_REPLY` / `no_reply`, "kullanıcının görebileceği bir yanıt teslim etme" anlamına gelir.
Bir turda oluşturulmuş TTS sesi gibi bekleyen araç medyası da varsa, OpenClaw sessiz metni çıkarır ancak medya ekini yine de teslim eder.
OpenClaw bu davranışı konuşma türüne göre çözümler:

- Doğrudan konuşmalar hiçbir zaman `NO_REPLY` istem yönlendirmesi almaz. Doğrudan bir çalıştırma yanlışlıkla yalın bir sessiz token döndürürse, OpenClaw bunu yeniden yazmak veya teslim etmek yerine bastırır.
- Gruplar/kanallar varsayılan olarak yalnızca otomatik grup yanıtları için sessizliğe izin verir. `message_tool` görünür yanıt modunda sessizlik, modelin `message(action=send)` çağırmadığı anlamına gelir.
- Dahili orkestrasyon varsayılan olarak sessizliğe izin verir.

OpenClaw ayrıca doğrudan olmayan sohbetlerde genel dahili çalıştırıcı hataları için sessiz yanıtlar kullanır, böylece gruplar/kanallar Gateway hata şablon metnini görmez.
Eksik kimlik doğrulama, hız sınırı veya aşırı yük bildirimleri gibi kullanıcıya yönelik kurtarma metni bulunan sınıflandırılmış hatalar yine de teslim edilebilir. Doğrudan sohbetler varsayılan olarak kompakt hata metni gösterir; ham çalıştırıcı ayrıntıları yalnızca `/verbose full` etkin olduğunda gösterilir.

Varsayılanlar `agents.defaults.silentReply` altında bulunur; `surfaces.<id>.silentReply` yüzey başına grup/dahili ilkeyi geçersiz kılabilir.

Yalın sessiz yanıtlar tüm yüzeylerde düşürülür; böylece üst oturumlar, sentinel metni yedek konuşma metnine yeniden yazmak yerine sessiz kalır.

## İlgili

- [Mesaj yaşam döngüsü refaktörü](/tr/concepts/message-lifecycle-refactor) - dayanıklı gönderme ve alma tasarımını hedefler
- [Akış](/tr/concepts/streaming) — gerçek zamanlı mesaj teslimi
- [Yeniden deneme](/tr/concepts/retry) — mesaj teslimi yeniden deneme davranışı
- [Kuyruk](/tr/concepts/queue) — mesaj işleme kuyruğu
- [Kanallar](/tr/channels) — mesajlaşma platformu entegrasyonları
