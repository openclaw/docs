---
read_when:
    - Bir kanal Plugin oluşturuyor ve paylaşılan gelen tur yaşam döngüsünü kullanmak istiyorsunuz
    - Bir kanal izleyicisini elle yazılmış kayıt/gönderim bağlayıcı kodundan taşıyorsunuz
    - Kabul, içe alma, sınıflandırma, ön kontrol, çözümleme, kaydetme, dağıtım ve sonlandırma aşamalarını anlamanız gerekir
sidebarTitle: Channel turn
summary: runtime.channel.turn -- paketle gelen ve üçüncü taraf kanal Pluginlerinin ajan dönüşlerini kaydetmek, dağıtmak ve sonlandırmak için kullandığı paylaşılan gelen dönüş çekirdeği
title: Kanal turu çekirdeği
x-i18n:
    generated_at: "2026-04-30T09:36:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Kanal turu çekirdeği, normalleştirilmiş bir platform olayını bir ajan turuna dönüştüren paylaşılan gelen durum makinesidir. Kanal Plugin’leri platform olgularını ve teslim geri çağrısını sağlar. Çekirdek orkestrasyonu sahiplenir: alma, sınıflandırma, ön kontrol, çözümleme, yetkilendirme, birleştirme, kaydetme, dağıtma ve sonlandırma.

Plugin’iniz gelen mesaj sıcak yolundaysa bunu kullanın. Mesaj dışı olaylar için (slash komutları, modallar, düğme etkileşimleri, yaşam döngüsü olayları, tepkiler, ses durumu), bunları Plugin’e yerel tutun. Çekirdek yalnızca bir ajan metin turuna dönüşebilecek olayları sahiplenir.

<Info>
  Çekirdeğe enjekte edilen Plugin çalışma zamanı üzerinden `runtime.channel.turn.*` olarak ulaşılır. Plugin çalışma zamanı türü `openclaw/plugin-sdk/core` içinden dışa aktarılır, bu nedenle üçüncü taraf yerel Plugin’ler bu giriş noktalarını paketlenmiş kanal Plugin’leriyle aynı şekilde kullanabilir.
</Info>

## Neden paylaşılan bir çekirdek

Kanal Plugin’leri aynı gelen akışı tekrarlar: normalleştir, yönlendir, kapıdan geçir, bağlam oluştur, oturum meta verilerini kaydet, ajan turunu dağıt, teslim durumunu sonlandır. Paylaşılan bir çekirdek olmadan, bahsetme kapısı, yalnızca araç görünür yanıtları, oturum meta verileri, bekleyen geçmiş veya dağıtım sonlandırmasıyla ilgili bir değişikliğin kanal başına uygulanması gerekir.

Çekirdek dört kavramı bilinçli olarak ayrı tutar:

- `ConversationFacts`: mesajın nereden geldiği
- `RouteFacts`: hangi ajanın ve oturumun bunu işlemesi gerektiği
- `ReplyPlanFacts`: görünür yanıtların nereye gitmesi gerektiği
- `MessageFacts`: ajanın hangi gövdeyi ve ek bağlamı görmesi gerektiği

Slack DM’leri, Telegram konuları, Matrix iş parçacıkları ve Feishu konu oturumları bunları pratikte birbirinden ayırır. Bunları tek bir tanımlayıcı olarak ele almak zamanla sapmaya neden olur.

## Aşama yaşam döngüsü

Çekirdek, kanaldan bağımsız olarak aynı sabit işlem hattını çalıştırır:

1. `ingest` -- bağdaştırıcı ham bir platform olayını `NormalizedTurnInput` biçimine dönüştürür
2. `classify` -- bağdaştırıcı bu olayın bir ajan turu başlatıp başlatamayacağını bildirir
3. `preflight` -- bağdaştırıcı tekilleştirme, öz-yankı, hidrasyon, debounce, şifre çözme, kısmi olgu ön doldurma yapar
4. `resolve` -- bağdaştırıcı tamamen birleştirilmiş bir tur döndürür (rota, yanıt planı, mesaj, teslim)
5. `authorize` -- birleştirilmiş olgulara DM, grup, bahsetme ve komut politikası uygulanır
6. `assemble` -- `buildContext` aracılığıyla olgulardan `FinalizedMsgContext` oluşturulur
7. `record` -- gelen oturum meta verileri ve son rota kalıcı hale getirilir
8. `dispatch` -- ajan turu arabelleğe alınmış blok dağıtıcısı üzerinden yürütülür
9. `finalize` -- dağıtım hatasında bile bağdaştırıcı `onFinalize` çalışır

Bir `log` geri çağrısı sağlandığında her aşama yapılandırılmış bir günlük olayı yayar. Bkz. [Gözlemlenebilirlik](#observability).

## Kabul türleri

Çekirdek, bir tur kapıdan geçirilip engellendiğinde hata fırlatmaz. Bir `ChannelTurnAdmission` döndürür:

| Tür           | Ne zaman                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Tur kabul edilir. Ajan turu çalışır ve görünür yanıt yolu kullanılır.                                                                         |
| `observeOnly` | Tur uçtan uca çalışır ancak teslim bağdaştırıcısı görünür hiçbir şey göndermez. Yayın gözlemci ajanları ve diğer pasif çok ajanlı akışlar için kullanılır. |
| `handled`     | Bir platform olayı yerel olarak tüketilmiştir (yaşam döngüsü, tepki, düğme, modal). Çekirdek dağıtımı atlar.                                |
| `drop`        | Atlama yolu. İsteğe bağlı olarak `recordHistory: true`, gelecekteki bir bahsetmenin bağlamı olması için mesajı bekleyen grup geçmişinde tutar. |

Kabul `classify` içinden (olay sınıfı bunun bir tur başlatamayacağını söylediğinde), `preflight` içinden (tekilleştirme, öz-yankı, geçmiş kaydıyla eksik bahsetme) veya doğrudan `resolveTurn` içinden gelebilir.

## Giriş noktaları

Çalışma zamanı üç tercih edilen giriş noktası sunar; böylece bağdaştırıcılar kanala uyan seviyede dahil olabilir.

```typescript
runtime.channel.turn.run(...)             // bağdaştırıcı güdümlü tam işlem hattı
runtime.channel.turn.runPrepared(...)     // kanal dağıtımı sahiplenir; çekirdek record + finalize çalıştırır
runtime.channel.turn.buildContext(...)    // saf olgulardan FinalizedMsgContext eşlemesi
```

Plugin SDK uyumluluğu için iki eski çalışma zamanı yardımcısı kullanılabilir durumda kalır:

```typescript
runtime.channel.turn.runResolved(...)      // kullanımdan kaldırılmış uyumluluk diğer adı; run tercih edin
runtime.channel.turn.dispatchAssembled(...) // kullanımdan kaldırılmış uyumluluk diğer adı; run veya runPrepared tercih edin
```

### run

Kanalınız gelen akışını bir `ChannelTurnAdapter<TRaw>` olarak ifade edebiliyorsa kullanın. Bağdaştırıcıda `ingest`, isteğe bağlı `classify`, isteğe bağlı `preflight`, zorunlu `resolveTurn` ve isteğe bağlı `onFinalize` için geri çağrılar bulunur.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run`, kanal küçük bağdaştırıcı mantığına sahipse ve yaşam döngüsünü kancalar üzerinden sahiplenmekten yararlanıyorsa doğru biçimdir.

### runPrepared

Kanalda önizlemeler, yeniden denemeler, düzenlemeler veya kanalın sahipliğinde kalması gereken iş parçacığı başlatma içeren karmaşık bir yerel dağıtıcı varsa kullanın. Çekirdek yine de dağıtımdan önce gelen oturumu kaydeder ve tek biçimli bir `DispatchedChannelTurnResult` sunar.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

Zengin kanallar (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) `runPrepared` kullanır; çünkü dağıtıcıları çekirdeğin öğrenmemesi gereken platforma özgü davranışları orkestre eder.

### buildContext

Olgu paketlerini `FinalizedMsgContext` biçimine eşleyen saf bir işlev. Kanalınız işlem hattının bir bölümünü elle yürütüyorsa ancak tutarlı bağlam biçimi istiyorsa bunu kullanın.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext`, `run` için bir tur birleştirirken `resolveTurn` geri çağrılarının içinde de kullanışlıdır.

<Note>
  `dispatchInboundReplyWithBase` gibi kullanımdan kaldırılmış SDK yardımcıları hâlâ birleştirilmiş tur yardımcısı üzerinden köprü kurar. Yeni Plugin kodu `run` veya `runPrepared` kullanmalıdır.
</Note>

## Olgu türleri

Çekirdeğin bağdaştırıcınızdan tükettiği olgular platformdan bağımsızdır. Platform nesnelerini çekirdeğe vermeden önce bu biçimlere çevirin.

### NormalizedTurnInput

| Alan              | Amaç                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Tekilleştirme ve günlükler için kullanılan kararlı mesaj kimliği             |
| `timestamp`       | İsteğe bağlı epoch ms                                                        |
| `rawText`         | Platformdan alındığı haliyle gövde                                           |
| `textForAgent`    | Ajan için isteğe bağlı temizlenmiş gövde (bahsetme çıkarma, yazma kırpma)    |
| `textForCommands` | `/command` ayrıştırması için kullanılan isteğe bağlı gövde                   |
| `raw`             | Özgüne ihtiyaç duyan bağdaştırıcı geri çağrıları için isteğe bağlı geçiş başvurusu |

### ChannelEventClass

| Alan                   | Amaç                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | False ise çekirdek `{ kind: "handled" }` döndürür                       |
| `requiresImmediateAck` | Dağıtımdan önce ACK göndermesi gereken bağdaştırıcılar için ipucu       |

### SenderFacts

| Alan           | Amaç                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `id`           | Kararlı platform gönderici kimliği                                   |
| `name`         | Görünen ad                                                           |
| `username`     | `name` değerinden farklıysa kullanıcı adı                            |
| `tag`          | Discord tarzı ayırt edici veya platform etiketi                      |
| `roles`        | Üye rolü izin listesi eşleştirmesi için kullanılan rol kimlikleri    |
| `isBot`        | Gönderici bilinen bir bot olduğunda true (çekirdek düşürmek için kullanır) |
| `isSelf`       | Gönderici yapılandırılmış ajanın kendisi olduğunda true               |
| `displayLabel` | Zarf metni için önceden işlenmiş etiket                              |

### ConversationFacts

| Alan              | Amaç                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `kind`            | `direct`, `group` veya `channel`                                      |
| `id`              | Yönlendirme için kullanılan konuşma kimliği                           |
| `label`           | Zarf için insan tarafından okunabilir etiket                          |
| `spaceId`         | İsteğe bağlı dış alan tanımlayıcısı (Slack çalışma alanı, Matrix homeserver) |
| `parentId`        | Bu bir iş parçacığı olduğunda dış konuşma kimliği                     |
| `threadId`        | Bu mesaj bir iş parçacığının içindeyse iş parçacığı kimliği           |
| `nativeChannelId` | Yönlendirme kimliğinden farklı olduğunda platforma özgü kanal kimliği |
| `routePeer`       | `resolveAgentRoute` araması için kullanılan eş                        |

### RouteFacts

| Alan                    | Amaç                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Bu turu işlemesi gereken ajan                              |
| `accountId`             | İsteğe bağlı geçersiz kılma (çok hesaplı kanallar)         |
| `routeSessionKey`       | Yönlendirme için kullanılan oturum anahtarı                |
| `dispatchSessionKey`    | Rota anahtarından farklı olduğunda dağıtımda kullanılan oturum anahtarı |
| `persistedSessionKey`   | Kalıcı oturum meta verilerine yazılan oturum anahtarı      |
| `parentSessionKey`      | Dallanmış/iş parçacıklı oturumlar için üst                 |
| `modelParentSessionKey` | Dallanmış oturumlar için model tarafındaki üst             |
| `mainSessionKey`        | Doğrudan konuşmalar için ana DM sahibi sabitlemesi         |
| `createIfMissing`       | Kayıt adımının eksik bir oturum satırı oluşturmasına izin ver |

### ReplyPlanFacts

| Alan                      | Amaç                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| `to`                      | `To` bağlamına yazılan mantıksal yanıt hedefi                         |
| `originatingTo`           | Kaynak bağlam hedefi (`OriginatingTo`)                                |
| `nativeChannelId`         | Teslimat için platforma özgü kanal kimliği                            |
| `replyTarget`             | `to` değerinden farklıysa son görünür yanıt hedefi                    |
| `deliveryTarget`          | Daha düşük seviyeli teslimat geçersiz kılması                         |
| `replyToId`               | Alıntılanan/sabitlenen ileti kimliği                                  |
| `replyToIdFull`           | Platformda ikisi de varsa tam biçimli alıntı kimliği                  |
| `messageThreadId`         | Teslimat zamanındaki iş parçacığı kimliği                             |
| `threadParentId`          | İş parçacığının üst ileti kimliği                                     |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` veya `none`                    |

### AccessFacts

`AccessFacts`, yetkilendirme aşamasının ihtiyaç duyduğu boolean değerleri taşır. Kimlik eşleştirme kanalda kalır: çekirdek yalnızca sonucu tüketir.

| Alan       | Amaç                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| `dm`       | DM izin/eşleştirme/red kararı ve `allowFrom` listesi                                 |
| `group`    | Grup politikası, rota izni, gönderen izni, izin listesi, bahsetme gereksinimi        |
| `commands` | Yapılandırılmış yetkilendiriciler genelinde komut yetkilendirmesi                    |
| `mentions` | Bahsetme algılamanın mümkün olup olmadığı ve ajandan bahsedilip bahsedilmediği       |

### MessageFacts

| Alan             | Amaç                                                                |
| ---------------- | ------------------------------------------------------------------- |
| `body`           | Son zarf gövdesi (biçimlendirilmiş)                                 |
| `rawBody`        | Ham gelen gövde                                                     |
| `bodyForAgent`   | Ajanın gördüğü gövde                                                |
| `commandBody`    | Komut ayrıştırma için kullanılan gövde                              |
| `envelopeFrom`   | Zarf için önceden işlenmiş gönderen etiketi                         |
| `senderLabel`    | İşlenen gönderen için isteğe bağlı geçersiz kılma                   |
| `preview`        | Günlükler için kısa, redakte edilmiş önizleme                       |
| `inboundHistory` | Kanal bir tampon tuttuğunda son gelen geçmiş girdileri              |

### SupplementalContextFacts

Ek bağlam; alıntı, iletilen ve iş parçacığı başlatma bağlamını kapsar. Çekirdek, yapılandırılmış `contextVisibility` politikasını uygular. Kanal bağdaştırıcısı yalnızca olgular ve `senderAllowed` bayrakları sağlar; böylece kanallar arası politika tutarlı kalır.

### InboundMediaFacts

Medya, olgu biçimindedir. Platform indirme, kimlik doğrulama, SSRF politikası, CDN kuralları ve şifre çözme kanal içinde kalır. Çekirdek olguları `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` ve `MediaTranscribedIndexes` içine eşler.

## Bağdaştırıcı sözleşmesi

Tam `run` için bağdaştırıcı biçimi şöyledir:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn`, isteğe bağlı bir kabul türü olan bir `AssembledChannelTurn` olan `ChannelTurnResolved` döndürür. `{ admission: { kind: "observeOnly" } }` döndürmek, görünür çıktı üretmeden turu çalıştırır. Bağdaştırıcı teslimat geri çağrısına yine sahip olur; yalnızca o tur için işlem yapmayan hale gelir.

`onFinalize`, gönderim hataları dahil her sonuçta çalışır. Bekleyen grup geçmişini temizlemek, onay tepkilerini kaldırmak, durum göstergelerini durdurmak ve yerel durumu boşaltmak için kullanın.

## Teslimat bağdaştırıcısı

Çekirdek platformu doğrudan çağırmaz. Kanal, çekirdeğe bir `ChannelTurnDeliveryAdapter` verir:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver`, tamponlanan her yanıt parçası için bir kez çağrılır. Kanalda mevcutsa platform ileti kimliklerini döndürün; böylece gönderici iş parçacığı sabitlerini koruyabilir ve sonraki parçaları düzenleyebilir. Yalnızca gözlem turları için `{ visibleReplySent: false }` döndürün veya `createNoopChannelTurnDeliveryAdapter()` kullanın.

## Kayıt seçenekleri

Kayıt aşaması `recordInboundSession` öğesini sarmalar. Çoğu kanal varsayılanları kullanabilir. `record` üzerinden geçersiz kılın:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Gönderici, kayıt aşamasını bekler. Kayıt hata fırlatırsa çekirdek `onPreDispatchFailure` çalıştırır (`runPrepared` öğesine sağlanmışsa) ve hatayı yeniden fırlatır.

## Gözlemlenebilirlik

Bir `log` geri çağrısı sağlandığında her aşama yapılandırılmış bir olay yayar:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

Günlüğe kaydedilen aşamalar: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Ham gövdeleri günlüğe kaydetmekten kaçının; kısa, redakte edilmiş önizlemeler için `MessageFacts.preview` kullanın.

## Kanal içinde kalanlar

Çekirdek orkestrasyona sahiptir. Kanal yine de şunlara sahiptir:

- Platform aktarımları (gateway, REST, websocket, polling, webhooks)
- Kimlik çözümleme ve görünen ad eşleştirme
- Yerel komutlar, eğik çizgi komutları, otomatik tamamlama, modallar, düğmeler, ses durumu
- Kart, modal ve uyarlanabilir kart işleme
- Medya kimlik doğrulaması, CDN kuralları, şifreli medya, transkripsiyon
- Düzenleme, tepki, redaksiyon ve durum API'leri
- Geri doldurma ve platform taraflı geçmiş getirme
- Platforma özgü doğrulama gerektiren eşleştirme akışları

İki kanal bunlardan biri için aynı yardımcıya ihtiyaç duymaya başlarsa bunu çekirdeğe itmek yerine paylaşılan bir SDK yardımcısı çıkarın.

## Kararlılık

`runtime.channel.turn.*`, herkese açık Plugin çalışma zamanı yüzeyinin parçasıdır. Olgu türlerine (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) ve kabul biçimlerine (`ChannelTurnAdmission`, `ChannelEventClass`) `openclaw/plugin-sdk/core` üzerinden `PluginRuntime` aracılığıyla erişilebilir.

Geriye dönük uyumluluk kuralları geçerlidir: yeni olgu alanları eklemelidir, kabul türlerinin adları değiştirilmez ve giriş noktası adları kararlı kalır. Eklemeli olmayan bir değişiklik gerektiren yeni kanal ihtiyaçları Plugin SDK geçiş sürecinden geçmelidir.

## İlgili

- Daha geniş kanal Plugin sözleşmesi için [Kanal pluginleri oluşturma](/tr/plugins/sdk-channel-plugins)
- Diğer `runtime.*` yüzeyleri için [Plugin çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)
- Yükleme hattı ve kayıt mekanikleri için [Plugin iç yapıları](/tr/plugins/architecture-internals)
