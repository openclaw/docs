---
read_when:
    - Bir kanal Plugin'i geliştiriyorsunuz ve paylaşılan gelen tur yaşam döngüsünü kullanmak istiyorsunuz
    - Bir kanal izleyicisini elle yazılmış kayıt/yönlendirme bağlayıcı kodundan taşıyorsunuz
    - Kabul, içe alma, sınıflandırma, ön denetim, çözümleme, kayıt, gönderim ve sonlandırma aşamalarını anlamanız gerekir.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- paketle birlikte gelen ve üçüncü taraf kanal Plugin'lerinin ajan turlarını kaydetmek, dağıtmak ve sonlandırmak için kullandığı paylaşılan gelen tur çekirdeği
title: Kanal turu çekirdeği
x-i18n:
    generated_at: "2026-05-06T09:24:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Channel turn çekirdeği, normalize edilmiş bir platform olayını agent turn’e dönüştüren paylaşılan inbound durum makinesidir. Channel Plugin’leri platform olgularını ve teslim callback’ini sağlar. Core orkestrasyonu sahiplenir: ingest, classify, preflight, resolve, authorize, assemble, record, dispatch ve finalize.

Bunu, Plugin’iniz inbound mesaj sıcak yolundayken kullanın. Mesaj dışı olaylar için (slash komutları, modallar, düğme etkileşimleri, yaşam döngüsü olayları, tepkiler, ses durumu) bunları Plugin’e yerel tutun. Çekirdek yalnızca bir agent metin turn’üne dönüşebilecek olayları sahiplenir.

<Info>
  Çekirdeğe enjekte edilen Plugin runtime üzerinden `runtime.channel.turn.*` olarak ulaşılır. Plugin runtime türü `openclaw/plugin-sdk/core` üzerinden dışa aktarılır; bu nedenle üçüncü taraf native Plugin’ler bu giriş noktalarını bundled channel Plugin’lerinin kullandığı şekilde kullanabilir.
</Info>

## Neden paylaşılan bir çekirdek

Channel Plugin’leri aynı inbound akışı tekrarlar: normalize etme, route etme, gate uygulama, context oluşturma, session metadata kaydetme, agent turn’ünü dispatch etme, teslim durumunu finalize etme. Paylaşılan bir çekirdek olmadan mention gating, yalnızca araç görünür yanıtları, session metadata, bekleyen geçmiş veya dispatch finalization değişikliklerinin kanal başına uygulanması gerekir.

Çekirdek dört kavramı özellikle ayrı tutar:

- `ConversationFacts`: mesajın nereden geldiği
- `RouteFacts`: hangi agent ve session’ın bunu işlemesi gerektiği
- `ReplyPlanFacts`: görünür yanıtların nereye gitmesi gerektiği
- `MessageFacts`: agent’ın hangi gövdeyi ve ek context’i görmesi gerektiği

Slack DM’leri, Telegram konuları, Matrix thread’leri ve Feishu konu session’ları pratikte bunların hepsini ayırt eder. Bunları tek bir tanımlayıcı olarak ele almak zamanla sapmaya neden olur.

## Aşama yaşam döngüsü

Çekirdek, kanaldan bağımsız olarak aynı sabit pipeline’ı çalıştırır:

1. `ingest` -- adapter ham bir platform olayını `NormalizedTurnInput` biçimine dönüştürür
2. `classify` -- adapter bu olayın bir agent turn başlatıp başlatamayacağını bildirir
3. `preflight` -- adapter dedupe, self-echo, hydration, debounce, decryption ve kısmi olgu ön doldurma yapar
4. `resolve` -- adapter tamamen oluşturulmuş bir turn döndürür (route, reply plan, message, delivery)
5. `authorize` -- DM, grup, mention ve komut politikası oluşturulmuş olgulara uygulanır
6. `assemble` -- olgulardan `buildContext` aracılığıyla `FinalizedMsgContext` oluşturulur
7. `record` -- inbound session metadata ve son route kalıcılaştırılır
8. `dispatch` -- agent turn buffered block dispatcher üzerinden yürütülür
9. `finalize` -- adapter `onFinalize`, dispatch hatasında bile çalışır

Bir `log` callback’i sağlandığında her aşama yapılandırılmış bir log olayı üretir. Bkz. [Gözlemlenebilirlik](#observability).

## Kabul türleri

Çekirdek, bir turn gate’e takıldığında hata fırlatmaz. Bir `ChannelTurnAdmission` döndürür:

| Tür           | Ne zaman                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Turn kabul edilir. Agent turn çalışır ve görünür yanıt yolu kullanılır.                                                                         |
| `observeOnly` | Turn uçtan uca çalışır ancak delivery adapter görünür hiçbir şey göndermez. Broadcast observer agent’ları ve diğer pasif çoklu agent akışları için kullanılır. |
| `handled`     | Bir platform olayı yerel olarak tüketilmiştir (yaşam döngüsü, tepki, düğme, modal). Çekirdek dispatch’i atlar.                                  |
| `drop`        | Atlama yolu. İsteğe bağlı olarak `recordHistory: true`, mesajı bekleyen grup geçmişinde tutar; böylece gelecekteki bir mention context’e sahip olur. |

Kabul `classify` üzerinden (olay sınıfı bir turn başlatamayacağını söylediğinde), `preflight` üzerinden (dedupe, self-echo, geçmiş kaydıyla eksik mention) veya doğrudan `resolveTurn` içinden gelebilir.

## Giriş noktaları

Runtime, adapter’ların kanala uygun seviyede katılabilmesi için üç tercih edilen giriş noktası sunar.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

İki eski runtime helper’ı Plugin SDK uyumluluğu için kullanılabilir kalır:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Kanalınız inbound akışını bir `ChannelTurnAdapter<TRaw>` olarak ifade edebiliyorsa kullanın. Adapter’da `ingest`, isteğe bağlı `classify`, isteğe bağlı `preflight`, zorunlu `resolveTurn` ve isteğe bağlı `onFinalize` callback’leri bulunur.

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

`run`, kanal küçük adapter mantığına sahip olduğunda ve yaşam döngüsünü hook’lar üzerinden sahiplenmekten yararlandığında doğru biçimdir.

### runPrepared

Kanalın preview’lar, retry’lar, düzenlemeler veya thread bootstrap içeren ve kanal tarafından sahiplenilmesi gereken karmaşık bir yerel dispatcher’ı olduğunda kullanın. Çekirdek yine de inbound session’ı dispatch öncesinde kaydeder ve tek biçimli bir `DispatchedChannelTurnResult` sunar.

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

Zengin kanallar (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) `runPrepared` kullanır; çünkü dispatcher’ları çekirdeğin bilmemesi gereken platforma özgü davranışları orkestre eder.

### buildContext

Olgu paketlerini `FinalizedMsgContext` biçimine eşleyen saf bir fonksiyon. Kanalınız pipeline’ın bir bölümünü elle oluşturuyor ama tutarlı context biçimi istiyorsa bunu kullanın.

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

`buildContext`, `run` için bir turn oluştururken `resolveTurn` callback’leri içinde de kullanışlıdır.

<Note>
  `dispatchInboundReplyWithBase` gibi kullanımdan kaldırılmış SDK helper’ları hâlâ assembled-turn helper üzerinden köprülenir. Yeni Plugin kodu `run` veya `runPrepared` kullanmalıdır.
</Note>

## Olgu türleri

Çekirdeğin adapter’ınızdan tükettiği olgular platformdan bağımsızdır. Platform nesnelerini çekirdeğe vermeden önce bu biçimlere çevirin.

### NormalizedTurnInput

| Alan              | Amaç                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| `id`              | Dedupe ve loglar için kullanılan kararlı mesaj id’si                          |
| `timestamp`       | İsteğe bağlı epoch ms                                                         |
| `rawText`         | Platformdan alındığı haliyle gövde                                            |
| `textForAgent`    | Agent için isteğe bağlı temizlenmiş gövde (mention çıkarma, yazım kırpma)     |
| `textForCommands` | `/command` ayrıştırması için kullanılan isteğe bağlı gövde                    |
| `raw`             | Özgün nesneye ihtiyaç duyan adapter callback’leri için isteğe bağlı pass-through referansı |

### ChannelEventClass

| Alan                   | Amaç                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | False ise çekirdek `{ kind: "handled" }` döndürür                       |
| `requiresImmediateAck` | Dispatch öncesinde ACK gerektiren adapter’lar için ipucu                |

### SenderFacts

| Alan           | Amaç                                                               |
| -------------- | ------------------------------------------------------------------ |
| `id`           | Kararlı platform sender id’si                                      |
| `name`         | Görünen ad                                                         |
| `username`     | `name` değerinden ayrıysa handle                                   |
| `tag`          | Discord tarzı discriminator veya platform tag’i                    |
| `roles`        | Üye rolü allowlist eşleştirmesi için kullanılan rol id’leri        |
| `isBot`        | Gönderen bilinen bir bot olduğunda true (çekirdek drop için kullanır) |
| `isSelf`       | Gönderen yapılandırılmış agent’ın kendisi olduğunda true           |
| `displayLabel` | Envelope metni için önceden render edilmiş etiket                  |

### ConversationFacts

| Alan              | Amaç                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `kind`            | `direct`, `group` veya `channel`                                      |
| `id`              | Routing için kullanılan konuşma id’si                                 |
| `label`           | Envelope için insan tarafından okunabilir etiket                      |
| `spaceId`         | İsteğe bağlı dış alan tanımlayıcısı (Slack workspace, Matrix homeserver) |
| `parentId`        | Bu bir thread olduğunda dış konuşma id’si                             |
| `threadId`        | Bu mesaj bir thread içindeyken thread id’si                           |
| `nativeChannelId` | Routing id’sinden farklı olduğunda platform-native kanal id’si        |
| `routePeer`       | `resolveAgentRoute` lookup için kullanılan peer                       |

### RouteFacts

| Alan                    | Amaç                                                         |
| ----------------------- | ------------------------------------------------------------ |
| `agentId`               | Bu turn’ü işlemesi gereken agent                             |
| `accountId`             | İsteğe bağlı override (çok hesaplı kanallar)                 |
| `routeSessionKey`       | Routing için kullanılan session anahtarı                     |
| `dispatchSessionKey`    | Route anahtarından farklı olduğunda dispatch sırasında kullanılan session anahtarı |
| `persistedSessionKey`   | Kalıcı session metadata’ya yazılan session anahtarı          |
| `parentSessionKey`      | Dallanmış/thread’li session’lar için parent                  |
| `modelParentSessionKey` | Dallanmış session’lar için model tarafı parent               |
| `mainSessionKey`        | Doğrudan konuşmalar için ana DM owner pin’i                  |
| `createIfMissing`       | Record adımının eksik bir session satırı oluşturmasına izin verir |

### ReplyPlanFacts

| Alan                     | Amaç                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | `To` bağlamına yazılan mantıksal yanıt hedefi          |
| `originatingTo`           | Kaynak bağlam hedefi (`OriginatingTo`)                  |
| `nativeChannelId`         | Teslimat için platforma özgü kanal kimliği             |
| `replyTarget`             | `to` değerinden farklıysa son görünür yanıt hedefi     |
| `deliveryTarget`          | Daha düşük düzeyli teslimat geçersiz kılması           |
| `replyToId`               | Alıntılanan/sabitlenen ileti kimliği                   |
| `replyToIdFull`           | Platformda ikisi de varsa tam biçimli alıntı kimliği   |
| `messageThreadId`         | Teslimat zamanındaki iş parçacığı kimliği              |
| `threadParentId`          | İş parçacığının üst ileti kimliği                      |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` veya `none`     |

### AccessFacts

`AccessFacts`, yetkilendirme aşamasının ihtiyaç duyduğu boolean değerleri taşır. Kimlik eşleştirme kanalda kalır: çekirdek yalnızca sonucu tüketir.

| Alan       | Amaç                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM izin/eşleştirme/reddetme kararı ve `allowFrom` listesi                 |
| `group`    | Grup politikası, rota izni, gönderen izni, izin listesi, bahsetme şartı   |
| `commands` | Yapılandırılmış yetkilendiriciler genelinde komut yetkilendirmesi         |
| `mentions` | Bahsetme algılamanın mümkün olup olmadığı ve agent'tan bahsedilip bahsedilmediği |

### MessageFacts

| Alan             | Amaç                                                        |
| ---------------- | ----------------------------------------------------------- |
| `body`           | Son zarf gövdesi (biçimlendirilmiş)                         |
| `rawBody`        | Ham gelen gövde                                             |
| `bodyForAgent`   | Agent'ın gördüğü gövde                                      |
| `commandBody`    | Komut ayrıştırma için kullanılan gövde                      |
| `envelopeFrom`   | Zarf için önceden işlenmiş gönderen etiketi                 |
| `senderLabel`    | İşlenmiş gönderen için isteğe bağlı geçersiz kılma          |
| `preview`        | Günlükler için kısa, redakte edilmiş önizleme               |
| `inboundHistory` | Kanal bir arabellek tuttuğunda son gelen geçmiş girdileri   |

### SupplementalContextFacts

Ek bağlam; alıntı, iletilmiş ve iş parçacığı başlatma bağlamını kapsar. Çekirdek, yapılandırılmış `contextVisibility` politikasını uygular. Kanallar arası politika tutarlı kalsın diye kanal bağdaştırıcısı yalnızca olguları ve `senderAllowed` bayraklarını sağlar.

### InboundMediaFacts

Medya, olgu biçimindedir. Platform indirme, kimlik doğrulama, SSRF politikası, CDN kuralları ve şifre çözme kanal yerelinde kalır. Çekirdek olguları `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` ve `MediaTranscribedIndexes` içine eşler.

## Bağdaştırıcı sözleşmesi

Tam `run` için bağdaştırıcı şekli şöyledir:

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

`resolveTurn`, isteğe bağlı kabul türü içeren bir `AssembledChannelTurn` olan `ChannelTurnResolved` döndürür. `{ admission: { kind: "observeOnly" } }` döndürmek, görünür çıktı üretmeden dönüşü çalıştırır. Bağdaştırıcı teslimat geri çağrısının sahibidir; bu dönüş için yalnızca işlem yapmayan hale gelir.

`onFinalize`, gönderim hataları dahil her sonuçta çalışır. Bunu bekleyen grup geçmişini temizlemek, onay tepkilerini kaldırmak, durum göstergelerini durdurmak ve yerel durumu boşaltmak için kullanın.

## Teslimat bağdaştırıcısı

Çekirdek platformu doğrudan çağırmaz. Kanal, çekirdeğe bir `ChannelTurnDeliveryAdapter` verir:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver`, arabelleğe alınmış her yanıt parçası için bir kez çağrılır. İleti yaşam döngüsü geçişi sırasında, birleştirilmiş kanal dönüşü teslimatı varsayılan olarak kanala aittir: `durable` alanının atlanması, çekirdeğin `deliver` öğesini doğrudan çağırması gerektiği ve genel giden teslimat üzerinden yönlendirme yapmaması gerektiği anlamına gelir. `durable` öğesini yalnızca kanal denetlenip genel gönderme yolunun yanıt/iş parçacığı hedefleri, medya işleme, gönderilmiş ileti/kendi yankısı önbellekleri, durum temizliği ve döndürülen ileti kimlikleri dahil eski teslimat davranışını koruduğu kanıtlandıktan sonra ayarlayın. `durable: false`, "kanala ait geri çağrıyı kullan" için uyumluluk yazımı olarak kalır, ancak geçirilmemiş kanalların bunu eklemesi gerekmemelidir. Kanalda platform ileti kimlikleri varsa bunları döndürün; böylece dağıtıcı iş parçacığı sabitleyicilerini koruyabilir ve sonraki parçaları düzenleyebilir. Daha yeni teslimat yolları ayrıca `receipt` döndürmelidir; böylece kurtarma, önizleme sonlandırma ve yinelenen bastırma `messageIds` üzerinden taşınabilir. Yalnızca gözlem dönüşleri için `{ visibleReplySent: false }` döndürün veya `createNoopChannelTurnDeliveryAdapter()` kullanın.

Tamamen kanala ait bir dağıtıcıyla `runPrepared` kullanan kanallarda `ChannelTurnDeliveryAdapter` bulunmaz. Bu dağıtıcılar varsayılan olarak dayanıklı değildir. Eksiksiz bir hedef, yeniden oynatmaya güvenli bağdaştırıcı, alındı sözleşmesi ve kanal yan etki kancalarıyla yeni gönderme bağlamına açıkça katılana kadar doğrudan teslimat yollarını korumalıdırlar.

`recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` ve doğrudan DM yardımcıları gibi genel uyumluluk yardımcıları, geçiş sırasında davranışı korumalıdır. Çağıranın sahip olduğu `deliver` veya `reply` geri çağrılarından önce genel dayanıklı teslimatı çağırmamalıdırlar.

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

Dağıtıcı kayıt aşamasını bekler. Kayıt hata fırlatırsa çekirdek `onPreDispatchFailure` öğesini çalıştırır (`runPrepared` öğesine sağlandıysa) ve hatayı yeniden fırlatır.

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

Günlüğe kaydedilen aşamalar: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Ham gövdeleri günlüğe kaydetmekten kaçının; kısa redakte edilmiş önizlemeler için `MessageFacts.preview` kullanın.

## Kanal yerelinde kalanlar

Çekirdek orkestrasyonun sahibidir. Kanal ise şunların sahibi olmaya devam eder:

- Platform taşıyıcıları (Gateway, REST, websocket, polling, webhooks)
- Kimlik çözümleme ve görünen ad eşleştirme
- Yerel komutlar, eğik çizgi komutları, otomatik tamamlama, modallar, düğmeler, ses durumu
- Kart, modal ve uyarlanabilir kart işleme
- Medya kimlik doğrulaması, CDN kuralları, şifrelenmiş medya, transkripsiyon
- Düzenleme, tepki, redaksiyon ve varlık API'leri
- Geri doldurma ve platform tarafı geçmiş getirme
- Platforma özgü doğrulama gerektiren eşleştirme akışları

İki kanal bunlardan biri için aynı yardımcıya ihtiyaç duymaya başlarsa bunu çekirdeğe itmek yerine paylaşılan bir SDK yardımcısı çıkarın.

## Kararlılık

`runtime.channel.turn.*`, genel Plugin çalışma zamanı yüzeyinin parçasıdır. Olgu türlerine (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) ve kabul şekillerine (`ChannelTurnAdmission`, `ChannelEventClass`) `openclaw/plugin-sdk/core` üzerinden `PluginRuntime` aracılığıyla erişilebilir.

Geriye dönük uyumluluk kuralları geçerlidir: yeni olgu alanları eklemelidir, kabul türleri yeniden adlandırılmaz ve giriş noktası adları kararlı kalır. Eklemeli olmayan bir değişiklik gerektiren yeni kanal ihtiyaçları Plugin SDK geçiş sürecinden geçmelidir.

## İlgili

- Bu çekirdeği saracak planlanan gönderme/alma/canlı yaşam döngüsü için [İleti yaşam döngüsü yeniden düzenlemesi](/tr/concepts/message-lifecycle-refactor)
- Daha geniş kanal Plugin sözleşmesi için [Kanal Plugin'leri oluşturma](/tr/plugins/sdk-channel-plugins)
- Diğer `runtime.*` yüzeyleri için [Plugin çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)
- Yükleme hattı ve kayıt mekanikleri için [Plugin iç yapıları](/tr/plugins/architecture-internals)
