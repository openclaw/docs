---
read_when:
    - Bir kanal Plugin'i oluşturuyor ve paylaşılan gelen tur yaşam döngüsünü istiyorsunuz
    - Bir kanal izleyicisini elle yazılmış kayıt/gönderim bağlayıcı kodundan uzaklaştırıyorsunuz
    - Kabul, alım, sınıflandırma, ön kontrol, çözümleme, kayıt, yönlendirme ve sonlandırma aşamalarını anlamanız gerekir
sidebarTitle: Channel turn
summary: runtime.channel.turn -- paketle gelen ve üçüncü taraf kanal Plugin'lerinin ajan turlarını kaydetmek, yönlendirmek ve sonlandırmak için kullandığı paylaşılan gelen tur çekirdeği
title: Kanal turu çekirdeği
x-i18n:
    generated_at: "2026-05-10T19:48:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

Kanal turu çekirdeği, normalize edilmiş bir platform olayını bir agent turuna dönüştüren paylaşılan gelen durum makinesidir. Kanal Plugin'leri platform olgularını ve teslim geri çağrısını sağlar. Çekirdek orkestrasyonu üstlenir: alma, sınıflandırma, ön kontrol, çözümleme, yetkilendirme, derleme, kaydetme, dağıtma ve sonlandırma.

Bunu, Plugin'iniz gelen mesaj sıcak yolundayken kullanın. Mesaj dışı olaylar için (slash komutları, modallar, düğme etkileşimleri, yaşam döngüsü olayları, tepkiler, ses durumu) bunları Plugin'e yerel tutun. Çekirdek yalnızca bir agent metin turuna dönüşebilecek olayları üstlenir.

<Info>
  Çekirdeğe enjekte edilen Plugin çalışma zamanı üzerinden `runtime.channel.turn.*` olarak ulaşılır. Plugin çalışma zamanı türü `openclaw/plugin-sdk/core` üzerinden dışa aktarılır, böylece üçüncü taraf yerel Plugin'ler bu giriş noktalarını paketli kanal Plugin'leriyle aynı şekilde kullanabilir.
</Info>

## Neden paylaşılan çekirdek

Kanal Plugin'leri aynı gelen akışı tekrarlar: normalize etme, yönlendirme, geçit denetimi, bağlam oluşturma, oturum meta verilerini kaydetme, agent turunu dağıtma, teslim durumunu sonlandırma. Paylaşılan bir çekirdek olmadan, mention geçitleme, yalnızca araç görünür yanıtları, oturum meta verileri, bekleyen geçmiş veya dağıtım sonlandırması üzerindeki bir değişikliğin kanal başına uygulanması gerekir.

Çekirdek dört kavramı bilinçli olarak ayrı tutar:

- `ConversationFacts`: mesajın nereden geldiği
- `RouteFacts`: hangi agent'ın ve oturumun bunu işlemesi gerektiği
- `ReplyPlanFacts`: görünür yanıtların nereye gitmesi gerektiği
- `MessageFacts`: agent'ın hangi gövdeyi ve ek bağlamı görmesi gerektiği

Slack DM'leri, Telegram konuları, Matrix iş parçacıkları ve Feishu konu oturumları pratikte bunların tümünü ayırt eder. Bunları tek bir tanımlayıcı gibi ele almak zamanla sapmaya neden olur.

## Aşama yaşam döngüsü

Çekirdek kanaldan bağımsız olarak aynı sabit işlem hattını çalıştırır:

1. `ingest` -- bağdaştırıcı ham bir platform olayını `NormalizedTurnInput` biçimine dönüştürür
2. `classify` -- bağdaştırıcı bu olayın bir agent turu başlatıp başlatamayacağını bildirir
3. `preflight` -- bağdaştırıcı tekilleştirme, öz-yankı, hidrasyon, debounce, şifre çözme, kısmi olgu ön doldurma yapar
4. `resolve` -- bağdaştırıcı tamamen derlenmiş bir tur döndürür (rota, yanıt planı, mesaj, teslim)
5. `authorize` -- DM, grup, mention ve komut ilkesi derlenmiş olgulara uygulanır
6. `assemble` -- `FinalizedMsgContext`, `buildContext` üzerinden olgulardan oluşturulur
7. `record` -- gelen oturum meta verileri ve son rota kalıcı hale getirilir
8. `dispatch` -- agent turu tamponlanmış blok dağıtıcısı üzerinden yürütülür
9. `finalize` -- bağdaştırıcı `onFinalize`, dağıtım hatasında bile çalışır

Bir `log` geri çağrısı sağlandığında her aşama yapılandırılmış bir günlük olayı yayar. Bkz. [Gözlemlenebilirlik](#observability).

## Kabul türleri

Çekirdek, bir tur geçitlenmişse hata fırlatmaz. Bir `ChannelTurnAdmission` döndürür:

| Tür           | Ne zaman                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | Tur kabul edilir. Agent turu çalışır ve görünür yanıt yolu kullanılır.                                                                        |
| `observeOnly` | Tur uçtan uca çalışır ancak teslim bağdaştırıcısı görünür hiçbir şey göndermez. Yayın gözlemci agent'ları ve diğer pasif çoklu agent akışları için kullanılır. |
| `handled`     | Bir platform olayı yerel olarak tüketilmiştir (yaşam döngüsü, tepki, düğme, modal). Çekirdek dağıtımı atlar.                                 |
| `drop`        | Atlama yolu. İsteğe bağlı `recordHistory: true`, mesajı bekleyen grup geçmişinde tutar; böylece gelecekteki bir mention bağlama sahip olur.   |

Kabul `classify` üzerinden (olay sınıfı bir tur başlatamayacağını söylediğinde), `preflight` üzerinden (tekilleştirme, öz-yankı, geçmiş kaydıyla eksik mention) veya doğrudan `resolveTurn` üzerinden gelebilir.

## Giriş noktaları

Çalışma zamanı, bağdaştırıcıların kanala uyan düzeyde katılabilmesi için üç tercih edilen giriş noktası sunar.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Plugin SDK uyumluluğu için iki eski çalışma zamanı yardımcısı kullanılabilir durumda kalır:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
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

`run`, kanal küçük bağdaştırıcı mantığına sahip olduğunda ve yaşam döngüsünü kancalar üzerinden üstlenmekten yararlandığında doğru biçimdir.

### runAssembled

Kanal yönlendirmeyi zaten çözümlemiş, bir `FinalizedMsgContext`
oluşturmuş ve yalnızca paylaşılan kayıt, yanıt işlem hattı, dağıtım ve sonlandırma
sıralamasına ihtiyaç duyuyorsa kullanın. Bu, aksi halde
`createChannelMessageReplyPipeline(...)` ve `runPrepared(...)` kalıp kodunu
tekrarlayacak basit paketli gelen yollar için tercih edilen biçimdir.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

Kanalın sahip olduğu tek dağıtım davranışı son yük teslimi ile isteğe bağlı yazıyor
göstergesi, yanıt seçenekleri, dayanıklı teslim veya hata günlükleme olduğunda
`runPrepared` yerine `runAssembled` seçin.

### runPrepared

Kanalın, önizlemeler, yeniden denemeler, düzenlemeler veya kanala ait kalması gereken iş parçacığı başlatma içeren karmaşık bir yerel dağıtıcısı varsa kullanın. Çekirdek yine de dağıtımdan önce gelen oturumu kaydeder ve tek biçimli bir `DispatchedChannelTurnResult` sunar.

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

Zengin kanallar (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot), dağıtıcıları çekirdeğin öğrenmemesi gereken platforma özgü davranışı orkestre ettiği için `runPrepared` kullanır.

### buildContext

Olgu paketlerini `FinalizedMsgContext` biçimine eşleyen saf bir fonksiyon. Kanalınız işlem hattının bir kısmını elle oluşturuyor ancak tutarlı bağlam biçimi istiyorsa bunu kullanın.

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

`buildContext`, `run` için bir tur derlerken `resolveTurn` geri çağrıları içinde de kullanışlıdır.

<Note>
  `dispatchInboundReplyWithBase` gibi kullanımdan kaldırılmış SDK yardımcıları hâlâ derlenmiş tur yardımcısı üzerinden köprü kurar. Yeni Plugin kodu `run` veya `runPrepared` kullanmalıdır.
</Note>

## Olgu türleri

Çekirdeğin bağdaştırıcınızdan tükettiği olgular platformdan bağımsızdır. Platform nesnelerini çekirdeğe vermeden önce bu biçimlere çevirin.

### NormalizedTurnInput

| Alan              | Amaç                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Tekilleştirme ve günlükler için kullanılan kararlı mesaj id'si               |
| `timestamp`       | İsteğe bağlı epoch ms                                                        |
| `rawText`         | Platformdan alındığı haliyle gövde                                           |
| `textForAgent`    | Agent için isteğe bağlı temizlenmiş gövde (mention soyma, yazma kırpma)      |
| `textForCommands` | `/command` ayrıştırması için kullanılan isteğe bağlı gövde                   |
| `raw`             | Özgüne ihtiyaç duyan bağdaştırıcı geri çağrıları için isteğe bağlı geçiş referansı |

### ChannelEventClass

| Alan                   | Amaç                                                                  |
| ---------------------- | --------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | false ise çekirdek `{ kind: "handled" }` döndürür                     |
| `requiresImmediateAck` | Dağıtımdan önce ACK göndermesi gereken bağdaştırıcılar için ipucu     |

### SenderFacts

| Alan           | Amaç                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `id`           | Kararlı platform gönderen id'si                                      |
| `name`         | Görünen ad                                                           |
| `username`     | `name` değerinden farklıysa kullanıcı adı                            |
| `tag`          | Discord tarzı ayırt edici veya platform etiketi                      |
| `roles`        | Üye rolü allowlist eşleştirmesi için kullanılan rol id'leri          |
| `isBot`        | Gönderen bilinen bir bot olduğunda true (çekirdek düşürme için kullanır) |
| `isSelf`       | Gönderen yapılandırılmış agent'ın kendisi olduğunda true             |
| `displayLabel` | Zarf metni için önceden oluşturulmuş etiket                          |

### ConversationFacts

| Alan              | Amaç                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| `kind`            | `direct`, `group` veya `channel`                                        |
| `id`              | Yönlendirme için kullanılan konuşma id'si                               |
| `label`           | Zarf için insan tarafından okunabilir etiket                            |
| `spaceId`         | İsteğe bağlı dış alan tanımlayıcısı (Slack workspace, Matrix homeserver) |
| `parentId`        | Bu bir iş parçacığı olduğunda dış konuşma id'si                         |
| `threadId`        | Bu mesaj bir iş parçacığının içindeyken iş parçacığı id'si              |
| `nativeChannelId` | Yönlendirme id'sinden farklı olduğunda platforma özgü kanal id'si       |
| `routePeer`       | `resolveAgentRoute` araması için kullanılan eş                          |

### RouteFacts

| Alan                    | Amaç                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Bu dönüşü işlemesi gereken ajan                            |
| `accountId`             | İsteğe bağlı geçersiz kılma (çok hesaplı kanallar)         |
| `routeSessionKey`       | Yönlendirme için kullanılan oturum anahtarı                |
| `dispatchSessionKey`    | Rota anahtarından farklı olduğunda gönderimde kullanılan oturum anahtarı |
| `persistedSessionKey`   | Kalıcı oturum meta verilerine yazılan oturum anahtarı      |
| `parentSessionKey`      | Dallanmış/iş parçacıklı oturumlar için üst öğe             |
| `modelParentSessionKey` | Dallanmış oturumlar için model tarafındaki üst öğe         |
| `mainSessionKey`        | Doğrudan konuşmalar için ana DM sahibi sabitlemesi         |
| `createIfMissing`       | Kayıt adımının eksik bir oturum satırı oluşturmasına izin ver |

### ReplyPlanFacts

| Alan                      | Amaç                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Bağlama `To` olarak yazılan mantıksal yanıt hedefi      |
| `originatingTo`           | Kaynak bağlam hedefi (`OriginatingTo`)                  |
| `nativeChannelId`         | Teslimat için platforma özgü kanal kimliği              |
| `replyTarget`             | `to` değerinden farklıysa son görünür yanıt hedefi      |
| `deliveryTarget`          | Daha düşük düzey teslimat geçersiz kılması              |
| `replyToId`               | Alıntılanan/sabitlenen mesaj kimliği                    |
| `replyToIdFull`           | Platformda her ikisi de varsa tam biçimli alıntı kimliği |
| `messageThreadId`         | Teslimat zamanındaki iş parçacığı kimliği               |
| `threadParentId`          | İş parçacığının üst mesaj kimliği                       |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` veya `none`      |

### AccessFacts

`AccessFacts`, yetkilendirme aşamasının ihtiyaç duyduğu boole değerlerini taşır. Kimlik eşleştirme kanalda kalır: çekirdek yalnızca sonucu tüketir.

| Alan       | Amaç                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM izin/eşleştirme/reddetme kararı ve `allowFrom` listesi                 |
| `group`    | Grup ilkesi, rota izni, gönderen izni, izin listesi, bahsetme gereksinimi |
| `commands` | Yapılandırılmış yetkilendiriciler genelinde komut yetkilendirmesi         |
| `mentions` | Bahsetme algılamanın mümkün olup olmadığı ve ajandan bahsedilip bahsedilmediği |

### MessageFacts

| Alan             | Amaç                                                         |
| ---------------- | ------------------------------------------------------------ |
| `body`           | Son zarf gövdesi (biçimlendirilmiş)                          |
| `rawBody`        | Ham gelen gövde                                              |
| `bodyForAgent`   | Ajanın gördüğü gövde                                         |
| `commandBody`    | Komut ayrıştırma için kullanılan gövde                       |
| `envelopeFrom`   | Zarf için önceden işlenmiş gönderen etiketi                  |
| `senderLabel`    | İşlenmiş gönderen için isteğe bağlı geçersiz kılma           |
| `preview`        | Günlükler için kısa, redakte edilmiş önizleme                |
| `inboundHistory` | Kanal bir arabellek tuttuğunda son gelen geçmiş girdileri    |

### SupplementalContextFacts

Ek bağlam; alıntı, iletilmiş ve iş parçacığı başlatma bağlamını kapsar. Çekirdek, yapılandırılmış `contextVisibility` ilkesini uygular. Kanal bağdaştırıcısı yalnızca olguları ve `senderAllowed` bayraklarını sağlar; böylece kanallar arası ilke tutarlı kalır.

### InboundMediaFacts

Medya olgu biçimindedir. Platform indirme, kimlik doğrulama, SSRF ilkesi, CDN kuralları ve şifre çözme kanala yerel kalır. Çekirdek olguları `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` ve `MediaTranscribedIndexes` içine eşler.

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

`resolveTurn`, isteğe bağlı bir kabul türü olan bir `AssembledChannelTurn` olan `ChannelTurnResolved` döndürür. `{ admission: { kind: "observeOnly" } }` döndürmek, görünür çıktı üretmeden dönüşü çalıştırır. Bağdaştırıcı teslimat geri çağrısına hâlâ sahiptir; yalnızca o dönüş için işlem yapmayan hale gelir.

`onFinalize`, gönderim hataları dahil her sonuçta çalışır. Bekleyen grup geçmişini temizlemek, onay tepkilerini kaldırmak, durum göstergelerini durdurmak ve yerel durumu boşaltmak için kullanın.

## Teslimat bağdaştırıcısı

Çekirdek platformu doğrudan çağırmaz. Kanal çekirdeğe bir `ChannelTurnDeliveryAdapter` verir:

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

`deliver`, arabelleğe alınmış her yanıt parçası için bir kez çağrılır. Mesaj yaşam döngüsü geçişi sırasında, birleştirilmiş kanal dönüşü teslimatı varsayılan olarak kanalın sorumluluğundadır: `durable` alanının atlanması, çekirdeğin `deliver` öğesini doğrudan çağırması gerektiği ve genel giden teslimat üzerinden yönlendirmemesi gerektiği anlamına gelir. `durable` değerini yalnızca kanal denetlenip genel gönderme yolunun yanıt/iş parçacığı hedefleri, medya işleme, gönderilen mesaj/kendi yankı önbellekleri, durum temizliği ve döndürülen mesaj kimlikleri dahil eski teslimat davranışını koruduğu kanıtlandıktan sonra ayarlayın. `durable: false`, "kanala ait geri çağrıyı kullan" için uyumluluk yazımı olarak kalır, ancak geçişi yapılmamış kanalların bunu eklemesi gerekmemelidir. Kanalda platform mesaj kimlikleri varsa bunları döndürün; böylece gönderici iş parçacığı sabitlemelerini koruyabilir ve sonraki parçaları düzenleyebilir. Daha yeni teslimat yolları ayrıca `receipt` döndürmelidir; böylece kurtarma, önizleme sonlandırma ve yinelenenleri bastırma `messageIds` dışına taşınabilir. Yalnızca gözlem dönüşleri için `{ visibleReplySent: false }` döndürün veya `createNoopChannelTurnDeliveryAdapter()` kullanın.

Tamamen kanala ait bir göndericiyle `runPrepared` kullanan kanallarda `ChannelTurnDeliveryAdapter` yoktur. Bu göndericiler varsayılan olarak dayanıklı değildir. Eksiksiz hedef, yeniden oynatmaya güvenli bağdaştırıcı, alındı sözleşmesi ve kanal yan etki kancalarıyla yeni gönderme bağlamına açıkça katılana kadar doğrudan teslimat yollarını korumalıdırlar.

`recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` ve doğrudan DM yardımcıları gibi herkese açık uyumluluk yardımcıları geçiş sırasında davranışı korumalıdır. Çağırana ait `deliver` veya `reply` geri çağrılarından önce genel dayanıklı teslimatı çağırmamalıdırlar.

## Kayıt seçenekleri

Kayıt aşaması `recordInboundSession` öğesini sarar. Çoğu kanal varsayılanları kullanabilir. `record` üzerinden geçersiz kılın:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

Gönderici kayıt aşamasını bekler. Kayıt hata fırlatırsa çekirdek `onPreDispatchFailure` öğesini çalıştırır (`runPrepared` için sağlandıysa) ve hatayı yeniden fırlatır.

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

Günlüğe yazılan aşamalar: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Ham gövdeleri günlüğe yazmaktan kaçının; kısa, redakte edilmiş önizlemeler için `MessageFacts.preview` kullanın.

## Kanalda yerel kalanlar

Çekirdek orkestrasyona sahiptir. Kanal hâlâ şunlara sahiptir:

- Platform taşıyıcıları (Gateway, REST, websocket, polling, Webhook'lar)
- Kimlik çözümleme ve görünen ad eşleştirme
- Yerel komutlar, eğik çizgi komutları, otomatik tamamlama, modallar, düğmeler, ses durumu
- Kart, modal ve uyarlanabilir kart işleme
- Medya kimlik doğrulaması, CDN kuralları, şifreli medya, transkripsiyon
- Düzenleme, tepki, redaksiyon ve varlık API'leri
- Geri doldurma ve platform tarafı geçmiş getirme
- Platforma özgü doğrulama gerektiren eşleştirme akışları

İki kanal bunlardan biri için aynı yardımcıya ihtiyaç duymaya başlarsa, bunu çekirdeğe itmek yerine paylaşılan bir SDK yardımcısı çıkarın.

## Kararlılık

`runtime.channel.turn.*`, herkese açık Plugin çalışma zamanı yüzeyinin parçasıdır. Olgu türlerine (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) ve kabul şekillerine (`ChannelTurnAdmission`, `ChannelEventClass`) `openclaw/plugin-sdk/core` içinden `PluginRuntime` aracılığıyla erişilebilir.

Geriye dönük uyumluluk kuralları geçerlidir: yeni olgu alanları eklemelidir, kabul türleri yeniden adlandırılmaz ve giriş noktası adları kararlı kalır. Eklemeli olmayan bir değişiklik gerektiren yeni kanal ihtiyaçları Plugin SDK geçiş sürecinden geçmelidir.

## İlgili

- Bu çekirdeği saracak planlanan gönderme/alma/canlı yaşam döngüsü için [Mesaj yaşam döngüsü refaktörü](/tr/concepts/message-lifecycle-refactor)
- Daha geniş kanal Plugin sözleşmesi için [Kanal Plugin'leri oluşturma](/tr/plugins/sdk-channel-plugins)
- Diğer `runtime.*` yüzeyleri için [Plugin çalışma zamanı yardımcıları](/tr/plugins/sdk-runtime)
- Yükleme hattı ve kayıt mekaniği için [Plugin iç yapıları](/tr/plugins/architecture-internals)
