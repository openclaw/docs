---
read_when:
    - Kanal gönderme veya alma davranışını yeniden düzenleme
    - Kanal gelen iletilerini, yanıt yönlendirmeyi, giden kuyruğunu, önizleme akışını veya Plugin SDK mesaj API'lerini değiştirme
    - Kalıcı gönderimler, alındı bildirimleri, önizlemeler, düzenlemeler veya yeniden denemeler gerektiren yeni bir kanal Plugin'i tasarlama
summary: 'Kalıcı ileti alma/gönderme yaşam döngüsünün durumu: nelerin yayımlandığı, özgün tasarıma göre nelerin değiştiği ve nelerin hâlâ açık olduğu'
title: İleti yaşam döngüsü yeniden düzenlemesi
x-i18n:
    generated_at: "2026-07-12T12:15:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Bu sayfa, ileriye dönük bir tasarım önerisi olarak ortaya çıktı. Bu tasarımın
özü daha sonra `src/channels/message/*` içinde ve herkese açık
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound` alt yollarında
yayımlandı. Güncel API için [Kanal giden API'sini](/tr/plugins/sdk-channel-outbound) ve
[Kanal gelen API'sini](/tr/plugins/sdk-channel-inbound) kullanın. Bu sayfa nelerin
yayımlandığını, uygulamanın ilk taslaktan nerelerde ayrıldığını ve nelerin hâlâ
açık olduğunu izler.
</Note>

## Bu yeniden düzenleme neden yapıldı

Kanal yığını birkaç yerel düzeltmeden büyüdü: her olgunluk düzeyi için ayrı
gelen yardımcıları (basit bağdaştırıcılar için `runtime.channel.inbound.run`,
zengin olanlar için `runtime.channel.inbound.runPreparedReply`), eski yanıt
dağıtım yardımcıları (`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
kanala özgü önizleme akışı ve mevcut yanıt yükü yollarına sonradan eklenen nihai
teslimat dayanıklılığı. Bu yapı, çok fazla herkese açık kavram ve teslimat
semantiğinin birbirinden sapabileceği çok fazla yer ortaya çıkardı.

Yeniden tasarımı zorunlu kılan güvenilirlik açığı:

```text
Telegram yoklama güncellemesi onaylandı
  -> asistanın nihai metni mevcut
  -> sendMessage başarıya ulaşmadan önce süreç yeniden başlıyor
  -> nihai yanıt kayboluyor
```

Hedef değişmez: çekirdek, görünür bir giden mesajın mevcut olması gerektiğine
karar verdiğinde gönderme niyeti, platform çağrısı denenmeden önce kalıcı olmalı
ve başarıdan sonra platform alındısı kaydedilmelidir. Bu, varsayılan olarak en az
bir kez kurtarma sağlar. Tam olarak bir kez davranışı yalnızca bir bağdaştırıcının
yerel eşgüçlülüğü kanıtladığı veya gönderimden sonra durumu bilinmeyen bir
denemeyi yeniden oynatmadan önce platform durumuyla uzlaştırdığı yerlerde
mevcuttur.

## Yayımlananlar

Dahili etki alanı `src/channels/message/*` içinde bulunur:

| Dosya                       | Sahip olduğu                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                  | Bağdaştırıcı, gönderme bağlamı, alındı ve kalıcı niyet türü sözleşmeleri                                                  |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — kalıcı gönderme bağlamı                                    |
| `receive.ts`                | `createMessageReceiveContext` — gelen onaylama ilkesi durum makinesi                                                     |
| `live.ts`                   | Canlı önizleme durumu ve yerinde sonlandırma veya geri dönüş mantığı                                                     |
| `state.ts`                  | `classifyDurableSendRecoveryState` — kesinti sonrası kurtarma sınıflandırması                                            |
| `receipt.ts`                | Platform gönderme sonuçlarını `MessageReceipt` biçimine normalleştirir                                                   |
| `capabilities.ts`           | Bir yükten gerekli kalıcı nihai yetenekleri türetir                                                                      |
| `contracts.ts`              | Bildirilen bağdaştırıcı yetenekleri için sözleşme kanıtı doğrulaması                                                     |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                             |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — eski `sendText`/`sendMedia`/`sendPayload`/`sendPoll` işlevlerini sarmalar    |
| `ingress-queue.ts`          | `createChannelIngressQueue` — kalıcı gelen olay kuyruğu                                                                  |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — gelen tekilleştirmesi için kabul/beklemede/tamamla/serbest bırak günlüğü          |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` ve eski adları taşıyan sarmalayıcılar                                                      |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, yanıt öneki ve yazıyor geri çağrısı yardımcıları                                           |

Herkese açık yüzey: `openclaw/plugin-sdk/channel-outbound` (gönderme/alındı/kalıcılık/canlı/yanıt işlem hattı
yardımcıları) ve `openclaw/plugin-sdk/channel-inbound` (gelen bağlamı, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Bağdaştırıcı örnekleri, güncel tür adları ve
geçiş notları için bu sayfalara bakın; API yapısı için doğruluk kaynağı aşağıdaki
taslaklar değil, bu sayfalardır.

### Gönderme bağlamı

`withDurableMessageSendContext`, kanal koduna tek bir giden mesaj çevresinde
`render`, `previewUpdate`, `send`, `edit`, `delete`, `commit` ve `fail`
adımlarını sağlar. `sendDurableMessageBatch` yaygın durum sarmalayıcısıdır:
oluşturur, gönderir, ardından `sent`/`suppressed` durumunda kaydeder veya hata
durumunda başarısız olarak işaretler.

`sendDurableMessageBatch`, ayrıştırılmış tek bir sonuç döndürür:

| Durum            | Anlamı                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------- |
| `sent`           | En az bir görünür platform mesajı teslim edildi                                        |
| `suppressed`     | Hiçbir platform mesajı eksik kabul edilmemelidir (kanca tarafından iptal, kuru çalışma vb.) |
| `partial_failed` | Sonraki bir yük veya yan etki başarısız olmadan önce en az bir mesaj teslim edildi     |
| `failed`         | Hiçbir platform alındısı üretilmedi                                                    |

Dayanıklılık `required`, `best_effort` veya `disabled` seçeneklerinden biridir
(`src/channels/message/types.ts` içindeki `MessageDurabilityPolicy`). Kalıcı
niyet yazılamadığında `required` kapalı biçimde başarısız olur; kalıcılık
kullanılamadığında `best_effort` doğrudan gönderime geçer; `disabled` ise
yeniden düzenleme öncesindeki doğrudan gönderme davranışını korur. Eski
uyumluluk yardımcılarının varsayılanı `disabled` değeridir ve yalnızca bir
kanalın genel bir giden bağdaştırıcısı olduğu için `required` sonucunu
çıkarmazlar.

Tehlikeli kalmaya devam eden sınır, platform çağrısının başarıya ulaşmasından
alındının kaydedilmesine kadar olan aralıktır. Süreç burada sonlanırsa
bağdaştırıcı `reconcileUnknownSend` bildirmediği sürece çekirdek, platform
mesajının mevcut olup olmadığını bilemez. Bu kanca, kesintiye uğrayan bir
gönderimi `sent`, `not_sent` veya `unresolved` olarak sınıflandırır; yalnızca
`not_sent` yeniden oynatmaya izin verir. Uzlaştırması olmayan kanallar
`unknown_after_send` durumuna (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) geri döner ve görünür yinelenen
mesajlar söz konusu kanal için kabul edilebilir ve belgelenmiş bir ödünse
yalnızca en az bir kez yeniden oynatmayı seçebilir.

### Alma bağlamı

`createMessageReceiveContext`, eşgüçlü bir `ack()` ve açık bir `nack(error)` ile
her gelen olayın onaylama/olumsuz onaylama durumunu izler. Onaylama ilkesi
(`ChannelMessageReceiveAckPolicy`) şunlardan biridir:

| İlke                   | Onaylandığı zaman                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `after_receive_record` | Çekirdek, yeniden teslimatı tekilleştirmek/yönlendirmek için yeterli gelen meta verisini kalıcılaştırdığında |
| `after_agent_dispatch` | Aracı çalıştırması dağıtıldığında                                                          |
| `after_durable_send`   | Bu tur için kalıcı giden gönderim kaydedildiğinde                                          |
| `manual`               | Çağıran, onaylama zamanlamasını açıkça denetler (ilke bildirmeyen bağdaştırıcılar için varsayılan) |

Telegram yoklaması bunu, güvenli biçimde tamamlanmış bir güncelleme filigranını
(`extensions/telegram/src/bot-update-tracker.ts` içindeki `safeCompletedUpdateId`)
kalıcılaştırmak için kullanır: grammY, ara yazılım zincirine giren her güncellemeyi
görmeye devam eder ancak OpenClaw, kalıcı yeniden başlatma filigranını yalnızca
dağıtımı tamamlanan güncellemelerin ötesine ilerletir; böylece başarısız veya
hâlâ beklemede olan güncellemeler yeniden başlatmadan sonra yeniden oynatılır.
Telegram'ın yukarı akış `getUpdates` uzaklığı hâlâ grammY'ye aittir; bu filigranın
ötesinde platform düzeyinde yeniden teslimatı denetleyen tamamen kalıcı bir
yoklama kaynağı henüz oluşturulmamıştır (bkz. Açık sorular).

### Canlı önizleme

`src/channels/message/live.ts`, önizleme/düzenleme/sonlandırma işlemlerini tek
bir yaşam döngüsü olarak modeller: `createLiveMessageState`,
`markLiveMessagePreviewUpdated`, `markLiveMessageFinalized`,
`markLiveMessageCancelled` ve `deliverFinalizableLivePreviewAdapter` (bir
taslaktan nihai bir düzenleme oluşturur, uygular ve düzenleme mümkün olmadığında
veya başarısız olduğunda normal gönderime geri döner).
`LiveMessageState.phase`, `idle | previewing | finalizing | finalized |
cancelled` değerlerinden biridir; `canFinalizeInPlace`, bir önizlemenin yeni bir
gönderim yerine düzenleme yoluyla nihai mesaja dönüşüp dönüşemeyeceğini belirler.

### Kalıcı alındılar

`MessageReceipt` (`src/channels/message/types.ts`), tek bir mantıksal gönderimden
gelen bir veya daha fazla platform mesajı kimliğini `platformMessageIds` ve her
parçaya ait `parts` (tür, dizin, ileti dizisi kimliği, yanıtlanan mesaj kimliği)
biçiminde normalleştirir. İleti dizileri ve sonraki düzenlemeler için birincil
kimlik korunur. Çok parçalı teslimatları (metin ve medya, parçalara bölünmüş
metin, kart geri dönüşü) yeniden başlatma sonrasında yeniden oynatılabilir ve
tekilleştirilebilir yapan budur.

### Herkese açık SDK'nın küçültülmesi

Yeniden düzenleme, herkese açık API olarak sunulan `reply-runtime`,
`reply-dispatch-runtime`, `reply-reference`, `reply-chunking`, `reply-payload`
yardımcılarını, `inbound-reply-dispatch`, `channel-reply-pipeline` ve
`outbound-runtime` öğesinin herkese açık kullanımlarının çoğunu bünyesine kattı
veya kullanımdan kaldırdı. `src/plugin-sdk/channel-message.ts` artık
`channel-outbound` / `channel-inbound` öğelerini gösteren bir `@deprecated`
yeniden dışa aktarma varilidir; `channel.turn` çalışma zamanı takma adları
kaldırıldı ve eski `/plugins/sdk-channel-turn` belge sayfası
[Kanal gelen API'sine](/tr/plugins/sdk-channel-inbound) yönlendiriliyor. Yeni Plugin
kodu doğrudan `channel-outbound` ve `channel-inbound` öğelerini hedeflemelidir.

## Uygulamanın ilk tasarımdan ayrıldığı noktalar

Aşağıdaki tasarım taslağı hiçbir zaman kelimesi kelimesine açıklandığı biçimde
yayımlanmadı. Tarihsel doğruluk için kayıt tutulmuştur; bu tür adlarını güncel
API olarak kabul etmeyin.

- **`MessageOrigin` / `shouldDropOpenClawEcho` yok.** İlk plan, Gateway hatası
  mesajlarında bir `source: "openclaw"` köken etiketi ve paylaşımlı odalarda
  etiketli, bot tarafından yazılmış yankıları `allowBots` yetkilendirmesinden
  önce bırakan ortak bir koşul öngörüyordu. Bu tür ve koşul kod tabanında mevcut
  değildir. `allowBots`, gerçek bir kanal başına yapılandırma anahtarıdır (Slack,
  Discord, Google Chat ve diğerleri) ancak onu koruması amaçlanan köken
  etiketleme mekanizması hiçbir zaman oluşturulmadı. Botların etkin olduğu
  odalarda Gateway hatası yankılarının bastırılması, yayımlanmış bir garanti
  değil, açık bir eksik olarak kalmaktadır.
- **Birleşik `core.messages.receive/send/live/state` ad alanı yok.**
  Yayımlanan işlevler bir `core.messages.*` cephesinin arkasında değil,
  doğrudan `src/channels/message/*` içinde bulunur
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`).
- **Genel `ChannelMessage` / `MessageTarget` / `MessageRelation`
  normalleştirilmiş mesaj türü yok.** Çekirdek, tek bir platformdan bağımsız
  mesaj yapısını ve `kind: "reply" | "followup" | "broadcast" | "system"`
  ilişkisini kullanmak yerine somut yanıt yüklerini (`ReplyPayload`) ve kanala
  özgü bağlamları gönderme bağdaştırıcılarına aktarmaya devam eder.
- **Onaylama ilkesi adları taslaktan farklıdır.** Yayımlanan:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  İlk taslak, Webhook zaman aşımı nedeni alanıyla birlikte `immediate |
after-record | after-durable-send | manual` kullanıyordu; bu yapı oluşturulmadı.
- **`DurableFinalDeliveryRequirementMap` yetenek anahtarları, taslaktaki
  `MessageCapabilities` nesnesinin yerini aldı.** Yetenekler, iç içe bir
  `text.chunking` / `attachments.voice` tarzı yapı yerine
  `verifyDurableFinalCapabilityProofs` aracılığıyla doğrulanan düz Boole
  bayraklarıdır (`text`, `media`, `poll`, `payload`, `silent`, `replyTo`,
  `thread`, `nativeQuote`, `messageSendingHooks`, `batch`,
  `reconcileUnknownSend`, `afterSendSuccess`, `afterCommit`).

## Somut geçiş tehlikeleri (hâlâ geçerli)

Kanala özgü bu yan etkiler yeniden düzenlemeden önce de vardı ve yeni gönderme yolları üzerinden çalışmaya devam etmelidir. Bunlar varsayımsal değildir: her biri bugün uygulanmıştır ve kritik öneme sahiptir.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): izleyici, başarıyla gönderilen iletileri gönderimden sonra bir yankı önbelleğine kaydeder. Kalıcı nihai gönderimler bu önbelleği doldurmaya devam etmelidir; aksi takdirde OpenClaw kendi yanıtlarını gelen kullanıcı iletileri olarak yeniden işleyebilir.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): isteğe bağlı bir model imzası ekler ve grup yanıtlarından sonra katılım sağlanan ileti dizilerini kaydeder. Kalıcı teslimat bu etkileri atlamamalıdır.
- **Discord ve diğer hazırlanmış dağıtıcılar** doğrudan teslimat ve önizleme davranışını zaten yönetir. Hazırlanmış dağıtıcısı nihai iletileri açıkça gönderme bağlamı üzerinden yönlendirene kadar bir kanal uçtan uca kalıcı değildir; yalnızca genel adaptörün kapsama sağladığını varsaymayın.
- **Telegram sessiz geri dönüş teslimatı**, parçalama/geri dönüş projeksiyonundan sonra yalnızca ilk yükü değil, projeksiyonu yapılmış yük dizisinin tamamını teslim etmelidir.
- **LINE, Zalo, Nostr** ve benzeri yardımcı yollar; yanıt belirteci işleme, medya proxy'leme, gönderilmiş ileti önbellekleri veya yalnızca geri çağırma işleviyle erişilebilen hedefler içerebilir. Bu anlamlar gönderme adaptörü tarafından temsil edilip testlerle kapsanana kadar teslimat kanalın yönetiminde kalır.
- **Doğrudan DM yardımcıları**, tek doğru aktarım hedefi olan bir yanıt geri çağırma işlevine sahip olabilir. Genel giden ileti mekanizması, ham platform alanlarından hedef tahmin ederek bu geri çağırma işlevini atlamamalıdır.

## Hata sınıflandırması

Adaptörler aktarım hatalarını `DeliveryFailureKind` tarzı kapalı kategorilerde sınıflandırır (geçici, hız sınırı, kimlik doğrulama, izin, bulunamadı, geçersiz yük, çakışma, iptal edildi, bilinmiyor). Temel politika:

- Geçici ve hız sınırı hatalarını yeniden deneyin.
- Bir işleme geri dönüşü bulunmadığı sürece geçersiz yük hatalarını yeniden denemeyin.
- Yapılandırma değişene kadar kimlik doğrulama veya izin hatalarını yeniden denemeyin.
- Bulunamadı durumunda, kanal bunun güvenli olduğunu bildiriyorsa canlı sonlandırmanın düzenlemeden yeni bir gönderime geri dönmesine izin verin.
- Çakışma durumunda, iletinin zaten var olup olmadığına karar vermek için alındı/idempotans durumunu kullanın.
- Platform çağrısı başarılı olmuş olabilecekken ancak alındı kaydı kesinleştirilmeden önce oluşan her hata, adaptör platform işleminin gerçekleşmediğini kanıtlamadığı sürece `unknown_after_send` olur.

## Açık sorular

- Telegram'ın sonunda grammY (`1.43.0`) yoklama çalıştırıcısını, yalnızca OpenClaw'ın kalıcı yeniden başlatma filigranını (`safeCompletedUpdateId`) değil, platform düzeyindeki yeniden teslimatı da denetleyen tamamen kalıcı bir yoklama kaynağıyla değiştirip değiştirmemesi gerektiği.
- Canlı önizleme durumunun nihai gönderme niyetiyle aynı kayıtta mı, yoksa kardeş bir canlı durum deposunda mı tutulması gerektiği.
- Botların etkin olduğu paylaşılan odalarda Gateway hatası yankısının engellenmesi için başlangıçta planlanan kaynak etiketleme mekanizmasının mı, kanal başına daha basit bir sözleşmenin mi gerektiği, yoksa bunun kapsam dışında mı olduğu.
- Hangi kanalların botlar arası yankı engelleme için yerel kaynak/meta veri desteğine sahip olduğu ve hangilerinin kalıcı bir giden ileti kayıt defterine ihtiyaç duyduğu.

## İlgili

- [İletiler](/tr/concepts/messages)
- [Akış ve parçalama](/tr/concepts/streaming)
- [İlerleme taslakları](/tr/concepts/progress-drafts)
- [Yeniden deneme politikası](/tr/concepts/retry)
- [Kanal giden ileti API'si](/tr/plugins/sdk-channel-outbound)
- [Kanal gelen ileti API'si](/tr/plugins/sdk-channel-inbound)
