---
read_when:
    - Kanal gönderme veya alma davranışını yeniden yapılandırma
    - Kanal turunu, yanıt gönderimini, giden kuyruğunu, önizleme akışını veya plugin SDK mesaj API'lerini değiştirme
    - Dayanıklı gönderimler, alındı bildirimleri, önizlemeler, düzenlemeler veya yeniden denemeler gerektiren yeni bir kanal Plugin'i tasarlama
summary: Birleşik kalıcı mesaj alma, gönderme, önizleme, düzenleme ve akış yaşam döngüsü için tasarım planı
title: Mesaj yaşam döngüsü yeniden düzenlemesi
x-i18n:
    generated_at: "2026-05-06T09:08:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Bu sayfa, dağınık kanal turu, yanıt gönderimi, önizleme akışı ve giden teslim yardımcılarını tek bir dayanıklı mesaj yaşam döngüsüyle değiştirmek için hedef tasarımdır.

Kısa sürüm:

- Çekirdek ilkeller **yanıt** değil, **alma** ve **gönderme** olmalıdır.
- Yanıt, yalnızca giden mesaj üzerindeki bir ilişkidir.
- Tur, teslimin sahibi değil, gelen işleme için bir kolaylıktır.
- Gönderme bağlama dayalı olmalıdır: `begin`, işle, önizle veya akışa al, son gönderimi yap,
  işle, başarısız ol.
- Alma da bağlama dayalı olmalıdır: normalleştir, yineleneni ayıkla, yönlendir, kaydet,
  dağıt, platform onayı, başarısız ol.
- Genel Plugin SDK, tek bir küçük kanal-mesaj yüzeyine indirgenmelidir.

## Sorunlar

Geçerli kanal yığını birkaç geçerli yerel ihtiyaçtan büyüdü:

- Basit gelen bağdaştırıcılar `runtime.channel.turn.run` kullanır.
- Zengin bağdaştırıcılar `runtime.channel.turn.runPrepared` kullanır.
- Eski yardımcılar `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, yanıt yükü yardımcıları, yanıt parçalama,
  yanıt referansları ve giden çalışma zamanı yardımcılarını kullanır.
- Önizleme akışı, kanala özgü dağıtıcılarda yaşar.
- Son teslim dayanıklılığı mevcut yanıt yükü yollarının etrafına ekleniyor.

Bu biçim yerel hataları düzeltir, ancak OpenClaw içinde çok fazla genel
kavram ve teslim semantiğinin sapabileceği çok fazla yer bırakır.

Bunu açığa çıkaran güvenilirlik sorunu şudur:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Hedef değişmez yalnızca Telegram'dan daha geniştir: çekirdek görünür bir
giden mesajın var olması gerektiğine karar verdiğinde, platform gönderimi
denenmeden önce niyet dayanıklı olmalı ve başarılı olduktan sonra platform
alındısı işlenmelidir. Bu, OpenClaw'a en az bir kez kurtarma sağlar. Tam olarak
bir kez davranışı yalnızca yerel idempotency kanıtlayabilen veya gönderimden
sonra bilinmeyen bir denemeyi yeniden oynatmadan önce platform durumuyla
uzlaştırabilen bağdaştırıcılarda vardır.

Bu, bu yeniden düzenlemenin nihai durumudur; her geçerli yolun açıklaması
değildir. Geçiş sırasında, mevcut giden yardımcılar en iyi çaba kuyruk
yazmaları başarısız olduğunda yine de doğrudan gönderime düşebilir. Yeniden
düzenleme ancak dayanıklı son gönderimler kapalı başarısız olduğunda veya
belgelenmiş dayanıklı olmayan bir politikayla açıkça devre dışı bırakıldığında
tamamlanmış sayılır.

## Hedefler

- Tüm kanal mesajı alma ve gönderme yolları için tek bir çekirdek yaşam döngüsü.
- Bir bağdaştırıcı yeniden oynatma açısından güvenli davranış beyan ettikten
  sonra yeni mesaj yaşam döngüsünde varsayılan olarak dayanıklı son gönderimler.
- Paylaşılan önizleme, düzenleme, akış, sonlandırma, yeniden deneme, kurtarma ve alındı
  semantiği.
- Üçüncü taraf Plugin'lerin öğrenip sürdürebileceği küçük bir Plugin SDK yüzeyi.
- Geçiş sırasında mevcut `channel.turn` çağıranları için uyumluluk.
- Yeni kanal yetenekleri için açık genişletme noktaları.
- Çekirdekte platforma özgü dallanma yok.
- Token-delta kanal mesajları yok. Kanal akışı mesaj önizlemesi,
  düzenleme, ekleme veya tamamlanmış blok teslimi olarak kalır.
- Operasyonel/sistem çıktısı için yapılandırılmış OpenClaw kökenli meta veri;
  böylece görünür Gateway hataları, bot etkinleştirilmiş paylaşılan odalara
  yeni istemler olarak tekrar girmez.

## Hedef Olmayanlar

- İlk aşamada `runtime.channel.turn.*` kaldırılmayacak.
- Her kanal aynı yerel taşıma davranışına zorlanmayacak.
- Çekirdeğe Telegram konuları, Slack yerel akışları, Matrix redaction'ları,
  Feishu kartları, QQ ses veya Teams etkinlikleri öğretilmeyecek.
- Tüm dahili geçiş yardımcıları kararlı SDK API olarak yayımlanmayacak.
- Yeniden denemeler tamamlanmış idempotent olmayan platform işlemlerini yeniden oynatmayacak.

## Referans Model

Vercel Chat iyi bir genel zihinsel modele sahiptir:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` ve geçmiş getirmeler gibi bağdaştırıcı yöntemleri
- yinelenenleri ayıklama, kilitler, kuyruklar ve kalıcılık için bir durum bağdaştırıcısı

OpenClaw yüzeyi kopyalamamalı, söz dağarcığını ödünç almalıdır.

OpenClaw'ın bu modelin ötesinde ihtiyaç duydukları:

- Doğrudan taşıma çağrılarından önce dayanıklı giden gönderim niyetleri.
- Başlatma, işleme ve başarısız olma içeren açık gönderme bağlamları.
- Platform onay politikasını bilen alma bağlamları.
- Yeniden başlatmadan sağ çıkan ve düzenleme, silme, kurtarma ve
  yinelenen bastırmayı yürütebilen alındılar.
- Daha küçük bir genel SDK. Paketli Plugin'ler dahili çalışma zamanı yardımcılarını kullanabilir, ancak
  üçüncü taraf Plugin'ler tek ve tutarlı bir mesaj API'si görmelidir.
- Aracıya özgü davranış: oturumlar, transkriptler, blok akışı, araç
  ilerlemesi, onaylar, medya yönergeleri, sessiz yanıtlar ve grup bahsi
  geçmişi.

`thread.post()` tarzı promise'ler OpenClaw için yeterli değildir. Bir gönderimin
kurtarılabilir olup olmadığına karar veren işlem sınırını gizlerler.

## Çekirdek Model

Yeni alan adı `src/channels/message/*` gibi dahili bir çekirdek ad alanı altında
yaşamalıdır.

Dört kavramı vardır:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive`, gelen yaşam döngüsünün sahibidir.

`send`, giden yaşam döngüsünün sahibidir.

`live`, önizleme, düzenleme, ilerleme ve akış durumunun sahibidir.

`state`, dayanıklı niyet depolama, alındılar, idempotency, kurtarma, kilitler ve
yinelenen ayıklamanın sahibidir.

## Mesaj Terimleri

### Mesaj

Normalleştirilmiş mesaj platformdan bağımsızdır:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### Hedef

Hedef, mesajın nerede yaşadığını açıklar:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### İlişki

Yanıt bir ilişkidir, API kökü değildir:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

Bu, aynı gönderme yolunun normal yanıtları, cron bildirimlerini, onay
istemlerini, görev tamamlamalarını, mesaj-aracı gönderimlerini, CLI veya Control UI
gönderimlerini, alt aracı sonuçlarını ve otomasyon gönderimlerini işlemesini sağlar.

### Köken

Köken, bir mesajı kimin ürettiğini ve OpenClaw'ın o mesajın yankılarını nasıl
ele alması gerektiğini açıklar. İlişkiden ayrıdır: bir mesaj bir kullanıcıya
yanıt olabilir ve yine de OpenClaw kökenli operasyonel çıktı olabilir.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

OpenClaw kökenli çıktının anlamı çekirdeğe aittir. Kanallar, bu kökenin
taşımlarında nasıl kodlandığına sahiptir.

İlk gerekli kullanım Gateway hata çıktısıdır. İnsanlar "Agent failed before reply"
veya "Missing API key" gibi mesajları yine de görmelidir, ancak etiketlenmiş
OpenClaw operasyonel çıktısı `allowBots` etkinleştirildiğinde paylaşılan odalarda
bot tarafından yazılmış girdi olarak kabul edilmemelidir.

### Alındı

Alındılar birinci sınıftır:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

Alındılar, dayanıklı niyetten gelecekteki düzenleme, silme, önizleme
sonlandırması, yinelenen bastırma ve kurtarmaya giden köprüdür.

Bir alındı tek bir platform mesajını veya çok parçalı bir teslimi açıklayabilir.
Parçalanmış metin, medya artı metin, ses artı metin ve kart yedekleri tüm
platform kimliklerini korumalı, aynı zamanda iş parçacığı oluşturma ve sonraki
düzenlemeler için birincil kimliği açığa çıkarmalıdır.

## Alma Bağlamı

Alma, çıplak bir yardımcı çağrısı olmamalıdır. Çekirdeğin yinelenenleri ayıklama,
yönlendirme, oturum kaydı ve platform onay politikasını bilen bir bağlama ihtiyacı vardır.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Alma akışı:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

Onay tek bir şey değildir. Alma sözleşmesi bu sinyalleri ayrı tutmalıdır:

- **Taşıma onayı:** platform webhook'una veya soketine OpenClaw'ın olay zarfını
  kabul ettiğini söyler. Bazı platformlar bunu dağıtımdan önce gerektirir.
- **Polling offset onayı:** aynı olayın tekrar getirilmemesi için imleci ilerletir.
  Bu, kurtarılamayacak işin ötesine ilerlememelidir.
- **Gelen kayıt onayı:** OpenClaw'ın bir yeniden teslimi yinelenen olarak ayıklamak
  ve yönlendirmek için yeterli gelen meta veriyi kalıcı hale getirdiğini doğrular.
- **Kullanıcıya görünür alındı:** isteğe bağlı okundu/durum/yazıyor davranışı;
  asla bir dayanıklılık sınırı değildir.

`ReceiveAckPolicy` yalnızca taşıma veya polling onayını kontrol eder. Okundu
alındıları veya durum tepkileri için yeniden kullanılmamalıdır.

Bot yetkilendirmesinden önce, kanal mesaj kökeni meta verisini çözebildiğinde
alma, paylaşılan OpenClaw yankı politikasını uygulamalıdır:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

Bu düşürme metin tabanlı değil, etiket tabanlıdır. Aynı görünür Gateway hata
metnine sahip, ancak OpenClaw köken meta verisi olmayan bot tarafından yazılmış
bir oda mesajı yine normal `allowBots` yetkilendirmesinden geçer.

Onay politikası açıktır:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling artık kalıcı yeniden başlatma watermark'ı için alma-bağlamı onay
politikasını kullanır. İzleyici, grammY güncellemelerini middleware zincirine
girerken gözlemlemeye devam eder, ancak OpenClaw yalnızca başarılı dağıtımdan
sonra güvenli tamamlanmış güncelleme kimliğini kalıcı hale getirir; başarısız
veya daha düşük bekleyen güncellemeler yeniden başlatmadan sonra yeniden
oynatılabilir kalır. Telegram'ın upstream `getUpdates` getirme offset'i hâlâ
polling kitaplığı tarafından kontrol edilir; bu yüzden OpenClaw'ın yeniden
başlatma watermark'ının ötesinde platform düzeyi yeniden teslim gerekiyorsa kalan
daha derin değişiklik tam dayanıklı bir polling kaynağıdır. Webhook platformları
anında HTTP onayına ihtiyaç duyabilir, ancak webhook'lar yeniden teslim
edebileceğinden yine de gelen yinelenen ayıklama ve dayanıklı giden gönderim
niyetlerine ihtiyaç duyarlar.

## Gönderme Bağlamı

Gönderme de bağlama dayalıdır:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Tercih edilen orkestrasyon:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

Yardımcı şuna genişler:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

Amaç, taşıma I/O'sundan önce var olmalıdır. Başlatmadan sonra ancak
commit'ten önce gerçekleşen yeniden başlatma kurtarılabilir.

Tehlikeli sınır, platform başarısından sonra ve receipt commit'inden öncedir. Bir
süreç orada ölürse, adaptör yerel idempotency veya bir receipt uzlaştırma yolu
sağlamadığı sürece OpenClaw platform iletisinin var olup olmadığını bilemez.
Bu denemeler körü körüne yeniden oynatılmamalı, `unknown_after_send` içinde
sürdürülmelidir. Uzlaştırması olmayan kanallar, yinelenen görünür iletilerin o
kanal ve ilişki için kabul edilebilir, belgelenmiş bir ödünleşim olması halinde
yalnızca en az bir kez yeniden oynatmayı seçebilir. Geçerli SDK uzlaştırma köprüsü,
adaptörün `reconcileUnknownSend` bildirmesini gerektirir, ardından bilinmeyen bir
girdiyi `sent`, `not_sent` veya `unresolved` olarak sınıflandırmak için
`durableFinal.reconcileUnknownSend` ister; yalnızca `not_sent` yeniden oynatmaya
izin verir ve çözümlenmemiş girdiler terminal olarak kalır ya da yalnızca
uzlaştırma denetimini yeniden dener.

Dayanıklılık ilkesi açık olmalıdır:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required`, core dayanıklı amacı yazamadığında kapalı biçimde başarısız olmalıdır
anlamına gelir. `best_effort`, kalıcılık kullanılamadığında devam edebilir.
`disabled` eski doğrudan gönderim davranışını korur. Geçiş sırasında, eski
wrapper'lar ve herkese açık uyumluluk yardımcıları varsayılan olarak `disabled`
kullanır; bir kanalın genel bir outbound adaptörü olmasından `required`
çıkarımı yapmamalıdırlar.

Gönderim bağlamları kanal-yerel gönderim sonrası etkilerin de sahibidir.
Dayanıklı teslim, daha önce kanalın doğrudan gönderim yoluna bağlı olan yerel
davranışı atlıyorsa geçiş güvenli değildir. Örnekler arasında self-echo bastırma
önbellekleri, thread katılım işaretleyicileri, yerel düzenleme anchor'ları,
model-signature render etme ve platforma özgü yinelenen ileti korumaları bulunur.
Bu etkiler, ilgili kanal dayanıklı genel nihai teslimi etkinleştirmeden önce
gönderim adaptörüne, render adaptörüne veya adlandırılmış bir gönderim bağlamı
hook'una taşınmalıdır.

Gönderim yardımcıları receipt'leri çağıranlarına kadar geri döndürmelidir.
Dayanıklı wrapper'lar ileti id'lerini yutamaz veya bir kanal teslim sonucunu
`undefined` ile değiştiremez; buffer'lı dispatcher'lar bu id'leri thread
anchor'ları, sonraki düzenlemeler, önizleme sonlandırma ve yinelenen ileti
bastırma için kullanır.

Fallback gönderimleri tek payload'lar üzerinde değil, batch'ler üzerinde çalışır.
Silent-reply yeniden yazımları, media fallback, card fallback ve chunk projection
birden fazla teslim edilebilir ileti üretebilir; bu nedenle bir gönderim bağlamı
ya projekte edilen batch'in tamamını teslim etmeli ya da neden yalnızca bir
payload'ın geçerli olduğunu açıkça belgelemelidir.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

Böyle bir fallback dayanıklı olduğunda, projekte edilen batch'in tamamı tek bir
dayanıklı gönderim amacıyla veya başka bir atomik batch planıyla temsil
edilmelidir. Her payload'ı tek tek kaydetmek yeterli değildir: payload'lar
arasında gerçekleşen bir çökme, kalan payload'lar için dayanıklı kayıt olmadan
kısmi görünür bir fallback bırakabilir. Kurtarma, hangi birimlerin zaten
receipt'e sahip olduğunu bilmeli ve yalnızca eksik birimleri yeniden oynatmalı ya
da adaptör bunu uzlaştırana kadar batch'i `unknown_after_send` olarak
işaretlemelidir.

## Canlı bağlam

Önizleme, düzenleme, ilerleme ve akış davranışı tek bir isteğe bağlı lifecycle
olmalıdır.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

Canlı durum, yinelenenleri kurtarmaya veya bastırmaya yetecek kadar dayanıklıdır:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

Bu, geçerli davranışı kapsamalıdır:

- Telegram gönderimi ve düzenleme önizlemesi; bayat önizleme yaşından sonra taze final ile.
- Discord gönderimi ve düzenleme önizlemesi; media/hata/açık yanıt durumunda iptal.
- Thread şekline bağlı olarak Slack yerel akışı veya taslak önizlemesi.
- Mattermost taslak gönderi sonlandırması.
- Matrix taslak olay sonlandırması veya uyumsuzlukta redaksiyon.
- Teams yerel ilerleme akışı.
- QQ Bot akışı veya birikmiş fallback.

## Adaptör yüzeyi

Herkese açık SDK hedefi tek bir alt yol olmalıdır:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

Hedef şekli:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

Gönderim adaptörü:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

Alım adaptörü:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Preflight yetkilendirmesinden önce core, `origin.decode` OpenClaw kökenli
metadata döndürdüğünde paylaşılan OpenClaw echo predicate'ini çalıştırmalıdır.
Alım adaptörü bot yazarı ve oda şekli gibi platform gerçeklerini sağlar; core
drop kararının ve sıralamanın sahibidir, böylece kanallar metin filtrelerini
yeniden uygulamaz.

Origin adaptörü:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core `MessageOrigin` ayarlar. Kanallar onu yalnızca yerel taşıma metadata'sına
çevirir ve oradan geri çevirir. Slack bunu
`chat.postMessage({ metadata })` ve inbound `message.metadata` ile eşler; Matrix
bunu ek olay içeriğine eşleyebilir; yerel metadata'sı olmayan kanallar, mevcut en
iyi yaklaşım bu olduğunda bir receipt/outbound registry kullanabilir.

Yetenekler:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## Herkese açık SDK azaltımı

Yeni herkese açık yüzey şu kavramsal alanları içine almalı veya kullanımdan
kaldırmalıdır:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` için çoğu herkese açık kullanım
- ad hoc taslak akış lifecycle yardımcıları

Uyumluluk alt yolları wrapper olarak kalabilir, ancak yeni üçüncü taraf
Plugin'lerin bunlara ihtiyaç duymaması gerekir.

Birlikte gelen Plugin'ler geçiş sırasında ayrılmış runtime alt yolları üzerinden
dahili yardımcı import'larını koruyabilir. Herkese açık belgeler, var olduğunda
Plugin yazarlarını `plugin-sdk/channel-message` yoluna yönlendirmelidir.

## Kanal turn ile ilişki

`runtime.channel.turn.*` geçiş sırasında kalmalıdır.

Bir uyumluluk adaptörüne dönüşmelidir:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` da başlangıçta kalmalıdır:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Birlikte gelen tüm Plugin'ler ve bilinen üçüncü taraf uyumluluk yolları
köprülendikten sonra, `channel.turn` kullanımdan kaldırılabilir. Yayımlanmış bir
SDK geçiş yolu ve eski Plugin'lerin hâlâ çalıştığını ya da net bir sürüm hatasıyla
başarısız olduğunu kanıtlayan sözleşme testleri olmadan kaldırılmamalıdır.

## Uyumluluk korkulukları

Geçiş sırasında, mevcut teslim callback'i "bu payload'ı gönder" dışında yan
etkilere sahip olan herhangi bir kanal için genel dayanıklı teslim isteğe
bağlıdır.

Eski giriş noktaları varsayılan olarak dayanıklı değildir:

- `channel.turn.run` ve `dispatchAssembledChannelTurn`, ilgili kanal açıkça
  denetlenmiş bir dayanıklı ilke/seçenekler nesnesi sağlamadığı sürece kanalın
  teslim callback'ini kullanır.
- Hazırlanmış dispatcher gönderim bağlamını açıkça çağırana kadar
  `channel.turn.runPrepared` kanal sahipliğinde kalır.
- `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` ve
  direct-DM yardımcıları gibi herkese açık uyumluluk yardımcıları, çağıranın
  sağladığı `deliver` veya `reply` callback'inden önce hiçbir zaman genel
  dayanıklı teslim enjekte etmez.

Geçiş köprüsü türleri için `durable: undefined` "dayanıklı değil" anlamına gelir.
Dayanıklı yol yalnızca açık bir ilke/seçenekler değeriyle etkinleştirilir.
`durable: false` uyumluluk yazımı olarak kalabilir, ancak uygulama her geçmemiş
kanalın bunu eklemesini gerektirmemelidir.

Geçerli köprü kodu dayanıklılık kararını açık tutmalıdır:

- Dayanıklı nihai teslim, ayrıştırılmış bir durum döndürür. `handled_visible` ve
  `handled_no_send` terminaldir; `unsupported` ve `not_applicable`, kanalın sahip
  olduğu teslime geri dönebilir; `failed` gönderme hatasını iletir.
- Genel dayanıklı nihai teslim, sessiz teslim, yanıt hedefinin korunması, yerel
  alıntının korunması ve ileti gönderme kancaları gibi adaptör kabiliyetleriyle
  sınırlandırılır. Eksik eşdeğerlik, kullanıcıya görünen davranışı değiştiren
  genel bir gönderimi değil, kanalın sahip olduğu teslimi seçmelidir.
- Kuyruk destekli dayanıklı gönderimler bir teslim niyeti referansı sunar. Mevcut
  `pendingFinalDelivery*` oturum alanları geçiş sırasında niyet kimliğini
  taşıyabilir; nihai durum, dondurulmuş yanıt metni ve geçici bağlam alanları
  yerine bir `MessageSendIntent` deposudur.

Aşağıdakilerin tümü doğru olana kadar bir kanal için genel dayanıklı yolu
etkinleştirmeyin:

- Genel gönderim adaptörü, eski doğrudan yolla aynı işleme ve taşıma davranışını
  yürütür.
- Yerel gönderim sonrası yan etkiler, gönderim bağlamı üzerinden korunur.
- Adaptör, tüm platform ileti kimlikleriyle birlikte alındı bilgileri veya teslim
  sonuçları döndürür.
- Hazırlanmış dağıtıcı yolları ya yeni gönderim bağlamını çağırır ya da dayanıklı
  garantinin dışında olarak belgelenmiş kalır.
- Geri dönüş teslimi, yalnızca ilkini değil, öngörülen her yükü işler.
- Dayanıklı geri dönüş teslimi, öngörülen yük dizisinin tamamını tek bir yeniden
  oynatılabilir niyet veya toplu plan olarak kaydeder.

Korunması gereken somut geçiş tehlikeleri:

- iMessage izleyici teslimi, başarılı bir gönderimden sonra gönderilen iletileri
  bir yankı önbelleğine kaydeder. Dayanıklı nihai gönderimler bu önbelleği hâlâ
  doldurmalıdır; aksi halde OpenClaw kendi nihai yanıtlarını gelen kullanıcı
  iletileri olarak yeniden alabilir.
- Tlon isteğe bağlı bir model imzası ekler ve grup yanıtlarından sonra katılım
  sağlanan iş parçacıklarını kaydeder. Genel dayanıklı teslim bu etkileri
  atlamamalıdır; bunları Tlon işleme/gönderme/sonlandırma adaptörlerine taşıyın
  veya Tlon'u kanalın sahip olduğu yolda tutun.
- Discord ve diğer hazırlanmış dağıtıcılar doğrudan teslim ve önizleme
  davranışına zaten sahiptir. Hazırlanmış dağıtıcıları nihai iletileri açıkça
  gönderim bağlamı üzerinden yönlendirmeden, birleştirilmiş tur dayanıklı
  garantisi kapsamında değildirler.
- Telegram sessiz geri dönüş teslimi, öngörülen yük dizisinin tamamını teslim
  etmelidir. Tek yüklü bir kısayol, projeksiyondan sonra ek geri dönüş yüklerini
  düşürebilir.
- LINE, BlueBubbles, Zalo, Nostr ve diğer mevcut birleştirilmiş/yardımcı yolların
  yanıt belirteci işleme, medya vekilleme, gönderilen ileti önbellekleri,
  yükleme/durum temizliği veya yalnızca geri çağırma hedefleri olabilir. Bu
  semantik gönderim adaptörüyle temsil edilip testlerle doğrulanana kadar
  kanalın sahip olduğu teslimde kalırlar.
- Direct-DM yardımcılarında, tek doğru taşıma hedefi olan bir yanıt geri çağırması
  bulunabilir. Genel giden gönderim `OriginatingTo` veya `To` üzerinden tahmin
  yürütüp bu geri çağırmayı atlamamalıdır.
- OpenClaw Gateway hata çıktısı insanlara görünür kalmalıdır, ancak etiketlenmiş
  bot tarafından yazılmış oda yankıları `allowBots` yetkilendirmesinden önce
  düşürülmelidir. Kanallar bunu kısa süreli acil durum geçici önlemi dışında
  görünür metin önek filtreleriyle uygulamamalıdır; dayanıklı sözleşme,
  yapılandırılmış kaynak meta verisidir.

## İç depolama

Dayanıklı kuyruk, yanıt yüklerini değil, ileti gönderim niyetlerini depolamalıdır.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

Kurtarma döngüsü:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

Kuyruk, yeniden başlatmadan sonra aynı hesap, iş parçacığı, hedef,
biçimlendirme politikası ve medya kuralları üzerinden yeniden oynatmaya yetecek
kimliği tutmalıdır.

## Hata sınıfları

Kanal adaptörleri taşıma hatalarını kapalı kategorilerde sınıflandırır:

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

Çekirdek politika:

- `transient` ve `rate_limit` için yeniden deneyin.
- Bir işleme geri dönüşü yoksa `invalid_payload` için yeniden denemeyin.
- Yapılandırma değişene kadar `auth` veya `permission` için yeniden denemeyin.
- `not_found` için, kanal bunun güvenli olduğunu bildirdiğinde canlı
  sonlandırmanın düzenlemeden yeni gönderime geri dönmesine izin verin.
- `conflict` için iletinin zaten mevcut olup olmadığına karar vermek amacıyla
  alındı/idempotency kurallarını kullanın.
- Adaptör platform G/Ç'sini tamamlamış olabilecekken alındı kaydı işlenmeden önce
  oluşan herhangi bir hata, adaptör platform işleminin gerçekleşmediğini
  kanıtlayamadığı sürece `unknown_after_send` olur.

## Kanal eşlemesi

| Kanal                   | Hedef geçiş                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Ack ilkesini ve dayanıklı nihai gönderimleri alır. Canlı adaptör gönderimi ve önizleme düzenlemeyi, eskimiş önizleme nihai gönderimini, konuları, alıntı-yanıt önizleme atlamasını, medya yedek yolunu ve retry-after işlemeyi üstlenir.                                                                                                                       |
| Discord                  | Gönderim adaptörü mevcut dayanıklı yük teslimini sarmalar. Canlı adaptör taslak düzenlemeyi, ilerleme taslağını, medya/hata önizleme iptalini, yanıt hedefinin korunmasını ve mesaj kimliği alındılarını üstlenir. Paylaşılan odalarda bot tarafından yazılmış Gateway hatası yankılarını denetleyin; Discord normal mesajlarda köken meta verilerini taşıyamıyorsa bir giden kayıt defteri veya başka bir yerel eşdeğer kullanın. |
| Slack                    | Gönderim adaptörü normal sohbet gönderilerini işler. Canlı adaptör, ileti dizisi şekli destekliyorsa yerel akışı, aksi halde taslak önizlemeyi seçer. Alındılar ileti dizisi zaman damgalarını korur. Köken adaptörü OpenClaw Gateway hatalarını Slack `chat.postMessage.metadata` ile eşler ve `allowBots` yetkilendirmesinden önce etiketlenmiş bot-odası yankılarını düşürür. |
| WhatsApp                 | Gönderim adaptörü metin/medya gönderimini dayanıklı nihai niyetlerle üstlenir. Alım adaptörü grup bahsini ve gönderen kimliğini işler. WhatsApp düzenlenebilir bir taşıma sağlayana kadar canlı adaptör bulunmayabilir.                                                                                                                                             |
| Matrix                   | Canlı adaptör taslak olay düzenlemelerini, sonlandırmayı, redaksiyonu, şifreli medya kısıtlarını ve yanıt-hedefi uyumsuzluğu yedek yolunu üstlenir. Alım adaptörü şifreli olay doldurmayı ve tekilleştirmeyi üstlenir. Köken adaptörü OpenClaw Gateway hatası kökenini Matrix olay içeriğine kodlamalı ve `allowBots` işleminden önce yapılandırılmış bot oda yankılarını düşürmelidir. |
| Mattermost               | Canlı adaptör tek bir taslak gönderiyi, ilerleme/araç katlamayı, yerinde sonlandırmayı ve yeni gönderim yedek yolunu üstlenir.                                                                                                                                                                                                                                  |
| Microsoft Teams          | Canlı adaptör yerel ilerleme ve blok akışı davranışını üstlenir. Gönderim adaptörü etkinlikleri ve ek/kart alındılarını üstlenir.                                                                                                                                                                                                                               |
| Feishu                   | İşleme adaptörü metin/kart/ham işlemeyi üstlenir. Canlı adaptör akış kartlarını ve yinelenen nihai bastırmayı üstlenir. Gönderim adaptörü yorumları, konu oturumlarını, medyayı ve ses bastırmayı üstlenir.                                                                                                                                                      |
| QQ Bot                   | Canlı adaptör C2C akışını, biriktirici zaman aşımını ve yedek nihai gönderimi üstlenir. İşleme adaptörü medya etiketlerini ve metin-olarak-sesi üstlenir.                                                                                                                                                                                                        |
| Signal                   | Basit alım ve gönderim adaptörü. signal-cli güvenilir düzenleme desteği eklemediği sürece canlı adaptör yoktur.                                                                                                                                                                                                                                                |
| iMessage and BlueBubbles | Basit alım ve gönderim adaptörü. Dayanıklı nihai gönderimler izleyici teslimini atlayabilmeden önce iMessage gönderimi izleyici yankı-önbelleği doldurmasını korumalıdır. BlueBubbles'a özgü yazıyor göstergesi, tepkiler ve ekler adaptör yetenekleri olarak kalır.                                                                                            |
| Google Chat              | Alanlara ve ileti dizisi kimliklerine eşlenen ileti dizisi ilişkisiyle basit alım ve gönderim adaptörü. Etiketlenmiş OpenClaw Gateway hatası yankıları için `allowBots=true` oda davranışını denetleyin.                                                                                                                                                         |
| LINE                     | Yanıt belirteci kısıtları hedef/ilişki yeteneği olarak modellenmiş basit alım ve gönderim adaptörü.                                                                                                                                                                                                                                                            |
| Nextcloud Talk           | SDK alım köprüsü ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                                          |
| IRC                      | Basit alım ve gönderim adaptörü, dayanıklı düzenleme alındıları yok.                                                                                                                                                                                                                                                                                            |
| Nostr                    | Şifreli DM'ler için alım ve gönderim adaptörü; alındılar olay kimlikleridir.                                                                                                                                                                                                                                                                                    |
| QA Channel               | Alım, gönderim, canlı, yeniden deneme ve kurtarma davranışı için sözleşme testi adaptörü.                                                                                                                                                                                                                                                                       |
| Synology Chat            | Basit alım ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                                               |
| Tlon                     | Genel dayanıklı nihai teslim etkinleştirilmeden önce gönderim adaptörü model-imzası işlemeyi ve katılınan-ileti dizisi takibini korumalıdır.                                                                                                                                                                                                                    |
| Twitch                   | Hız sınırı sınıflandırmasıyla basit alım ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                 |
| Zalo                     | Basit alım ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                                               |
| Zalo Personal            | Basit alım ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                                               |

## Geçiş planı

### Aşama 1: Dahili Mesaj Alanı

- Mesajlar, hedefler, ilişkiler,
  kökenler, alındılar, yetenekler, dayanıklı niyetler, alım bağlamı, gönderim
  bağlamı, canlı bağlam ve hata sınıfları için `src/channels/message/*` türleri ekleyin.
- Geçerli yanıt teslimi tarafından kullanılan geçiş köprüsü yük türüne
  `origin?: MessageOrigin` ekleyin, ardından refactor yanıt yüklerini değiştirdikçe
  bu alanı `ChannelMessage` ve işlenmiş mesaj türlerine taşıyın.
- Adaptörler ve testler şekli kanıtlayana kadar bunu dahili tutun.
- Durum geçişleri ve serileştirme için saf birim testleri ekleyin.

### Aşama 2: Dayanıklı Gönderim Çekirdeği

- Mevcut giden kuyruğunu yanıt-yükü dayanıklılığından dayanıklı
  mesaj gönderim niyetlerine taşıyın.
- Dayanıklı bir gönderim niyetinin yalnızca tek bir yanıt yükü değil,
  yansıtılmış bir yük dizisi veya toplu iş planı taşımasına izin verin.
- Uyumluluk dönüşümü yoluyla mevcut kuyruk kurtarma davranışını koruyun.
- `deliverOutboundPayloads` işlevinin `messages.send` çağırmasını sağlayın.
- Adaptör yeniden oynatma güvenliğini bildirdikten sonra, yeni mesaj yaşam döngüsünde
  dayanıklı niyet yazılamadığında nihai-gönderim dayanıklılığını varsayılan yapın
  ve kapalı başarısız olun. Mevcut kanal-tur ve SDK uyumluluk yolları bu aşamada
  varsayılan olarak doğrudan gönderim olarak kalır.
- Alındıları tutarlı biçimde kaydedin.
- Dayanıklı gönderimi son bir yan etki olarak ele almak yerine, alındıları ve
  teslim sonuçlarını özgün dispatcher çağıranına döndürün.
- Kurtarma, yeniden oynatma ve parçalı gönderimlerin OpenClaw operasyonel kökenini
  koruması için mesaj kökenini dayanıklı gönderim niyetleri boyunca kalıcılaştırın.

### Aşama 3: Kanal Turu Köprüsü

- `channel.turn.run` ve `dispatchAssembledChannelTurn` öğelerini
  `messages.receive` ve `messages.send` üzerine yeniden uygulayın.
- Geçerli olgu türlerini kararlı tutun.
- Varsayılan olarak eski davranışı koruyun. Birleştirilmiş-tur kanalı yalnızca
  adaptörü yeniden oynatma güvenli bir dayanıklılık ilkesiyle açıkça katıldığında
  dayanıklı hale gelir.
- Yerel düzenlemeleri sonlandıran ve henüz güvenle yeniden oynatılamayan yollar için
  uyumluluk kaçış yolu olarak `durable: false` değerini koruyun, ancak geçirilmemiş
  kanalları korumak için `false` işaretlerine güvenmeyin.
- Birleştirilmiş-tur dayanıklılığını yalnızca yeni mesaj yaşam döngüsünde,
  kanal eşlemesi genel gönderim yolunun eski kanal teslim semantiğini koruduğunu
  kanıtladıktan sonra varsayılan yapın.

### Aşama 4: Hazırlanmış Dispatcher Köprüsü

- `deliverDurableInboundReplyPayload` yerine bir gönderme-bağlamı köprüsü kullanın.
- Eski yardımcıyı bir sarmalayıcı olarak tutun.
- Önce Telegram, WhatsApp, Slack, Signal, iMessage ve Discord'u taşıyın; çünkü
  bunlarda zaten durable-final çalışması veya daha basit gönderme yolları var.
- Her hazırlanmış dispatcher'ı, gönderme bağlamına açıkça dahil olana kadar
  kapsanmamış kabul edin. Belgeler ve changelog girdileri, tüm otomatik final
  yanıtlarını kapsadığını iddia etmek yerine "birleştirilmiş kanal dönüşleri"
  demeli veya taşınan kanal yollarını adlandırmalıdır.
- `recordInboundSessionAndDispatchReply`, doğrudan-DM yardımcıları ve benzer
  herkese açık uyumluluk yardımcılarını davranışı koruyacak şekilde tutun. Daha
  sonra açık bir gönderme-bağlamı katılımı sunabilirler, ancak çağıranın sahip
  olduğu teslim callback'inden önce otomatik olarak genel durable teslimat
  denememelidirler.

### Aşama 5: Birleşik Canlı Yaşam Döngüsü

- İki kanıt adapter'ı ile `messages.live` oluşturun:
  - Gönderme, düzenleme ve eskimiş final gönderimi için Telegram.
  - Taslak finalizasyonu ve redaction fallback için Matrix.
- Ardından Discord, Slack, Mattermost, Teams, QQ Bot ve Feishu'yu taşıyın.
- Yinelenen önizleme finalizasyon kodunu ancak her kanalın eşdeğerlik testleri
  olduktan sonra silin.

### Aşama 6: Herkese Açık SDK

- `openclaw/plugin-sdk/channel-message` ekleyin.
- Bunu tercih edilen kanal Plugin API'si olarak belgeleyin.
- Paket export'larını, entrypoint envanterini, üretilmiş API baseline'larını ve
  Plugin SDK belgelerini güncelleyin.
- Kanal-message SDK yüzeyine `MessageOrigin`, origin encode/decode hook'ları ve
  paylaşılan `shouldDropOpenClawEcho` predicate'ini dahil edin.
- Eski alt yollar için uyumluluk sarmalayıcılarını tutun.
- Paketlenmiş Plugin'ler taşındıktan sonra reply adlı SDK yardımcılarını
  belgelerde deprecated olarak işaretleyin.

### Aşama 7: Tüm Göndericiler

Yanıt olmayan tüm outbound üreticileri `messages.send` üzerine taşıyın:

- cron ve heartbeat bildirimleri
- görev tamamlanmaları
- hook sonuçları
- onay istemleri ve onay sonuçları
- message tool gönderimleri
- subagent tamamlama duyuruları
- açık CLI veya Control UI gönderimleri
- otomasyon/broadcast yolları

Modelin "agent yanıtları" olmaktan çıkıp "OpenClaw mesaj gönderir" haline
geldiği yer burasıdır.

### Aşama 8: Turn'ü Deprecated Yapma

- `channel.turn` değerini en az bir uyumluluk penceresi boyunca sarmalayıcı
  olarak tutun.
- Geçiş notlarını yayımlayın.
- Eski import'lara karşı Plugin SDK uyumluluk testlerini çalıştırın.
- Eski dahili yardımcıları ancak hiçbir paketlenmiş Plugin bunlara ihtiyaç
  duymadığında ve üçüncü taraf sözleşmelerin kararlı bir yerine geçen çözümü
  olduğunda kaldırın veya gizleyin.

## Test planı

Birim testleri:

- Durable gönderme intent serileştirme ve kurtarma.
- Idempotency key yeniden kullanımı ve yinelenenleri bastırma.
- Receipt commit ve replay atlama.
- Bir adapter reconciliation desteklediğinde replay'den önce uzlaştıran
  `unknown_after_send` kurtarması.
- Hata sınıflandırma politikası.
- Receive ack policy sıralaması.
- Reply, followup, system ve broadcast gönderimleri için ilişki eşlemesi.
- Gateway-failure origin factory ve `shouldDropOpenClawEcho` predicate'i.
- Payload normalizasyonu, chunking, durable queue serileştirme ve kurtarma
  boyunca origin'in korunması.

Entegrasyon testleri:

- `channel.turn.run` basit adapter'ı hâlâ kaydeder ve gönderir.
- Eski birleştirilmiş-turn teslimatı, kanal açıkça dahil olmadıkça durable hale
  gelmez.
- `channel.turn.runPrepared` köprüsü hâlâ kaydeder ve finalize eder.
- Herkese açık uyumluluk yardımcıları varsayılan olarak çağıranın sahip olduğu
  teslim callback'lerini çağırır ve bu callback'lerden önce generic-send yapmaz.
- Durable fallback teslimatı, yeniden başlatmadan sonra tüm projected payload
  dizisini replay eder ve erken bir çökmeden sonra sonraki payload'ları kayıtsız
  bırakamaz.
- Durable birleştirilmiş-turn teslimatı, platform mesaj id'lerini buffered
  dispatcher'a döndürür.
- Özel teslim hook'ları, durable teslimat devre dışı veya kullanılamaz olduğunda
  da platform mesaj id'lerini döndürür.
- Final yanıt, assistant tamamlaması ile platform gönderimi arasındaki yeniden
  başlatmadan sağ çıkar.
- Önizleme taslağı izin verildiğinde yerinde finalize edilir.
- Medya/hata/yanıt-hedefi uyuşmazlığı normal teslimat gerektirdiğinde önizleme
  taslağı iptal edilir veya redacted yapılır.
- Block streaming ve preview streaming aynı metni birlikte teslim etmez.
- Erken stream edilen medya final teslimatta yinelenmez.

Kanal testleri:

- Polling ack'i receive context'in güvenli completed watermark'ına kadar
  geciktirilmiş Telegram konu yanıtı.
- Kabul edilmiş ama teslim edilmemiş güncellemeler için Telegram polling
  kurtarması, kalıcı safe-completed offset modeliyle kapsanır.
- Telegram eskimiş önizlemesi yeni final gönderir ve önizlemeyi temizler.
- Telegram sessiz fallback, her projected fallback payload'unu gönderir.
- Telegram sessiz fallback durability, her döngü iterasyonu için tek bir
  single-payload durable intent değil, tam projected fallback dizisini atomik
  olarak kaydeder.
- Medya/hata/açık yanıt durumunda Discord önizleme iptali.
- Discord final-reply durability belgelerde veya changelog'da iddia edilmeden
  önce Discord hazırlanmış dispatcher final'ları gönderme bağlamı üzerinden
  yönlendirilir.
- iMessage durable final gönderimleri, monitor sent-message echo cache'ini
  doldurur.
- LINE, BlueBubbles, Zalo ve Nostr eski teslimat yolları, adapter eşdeğerlik
  testleri var olana kadar genel durable send tarafından bypass edilmez.
- Direct-DM/Nostr callback teslimatı, eksiksiz bir message target'a ve
  replay-safe send adapter'a açıkça taşınmadıkça authoritative kalır.
- Slack etiketlenmiş OpenClaw Gateway failure mesajları outbound olarak görünür
  kalır, etiketlenmiş bot-room echo'ları `allowBots` öncesinde düşer ve aynı
  görünür metne sahip etiketsiz bot mesajları normal bot yetkilendirmesini
  izlemeye devam eder.
- Üst seviye DM'lerde Slack native stream fallback'i draft preview'e düşer.
- Matrix önizleme finalizasyonu ve redaction fallback.
- Yapılandırılmış bot hesaplarından gelen Matrix etiketlenmiş OpenClaw
  gateway-failure oda echo'ları `allowBots` işleme alınmadan önce düşer.
- Discord ve Google Chat paylaşımlı-oda gateway-failure cascade denetimleri,
  burada genel koruma iddia edilmeden önce `allowBots` modlarını kapsar.
- Mattermost taslak finalizasyonu ve fresh-send fallback.
- Teams native progress finalizasyonu.
- Feishu yinelenen final bastırma.
- QQ Bot accumulator timeout fallback.
- Tlon durable final gönderimleri model-signature rendering ve participated
  thread tracking'i korur.
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal basit durable final
  gönderimleri.

Doğrulama:

- Geliştirme sırasında hedeflenmiş Vitest dosyaları.
- Tam changed yüzeyi için Testbox içinde `pnpm check:changed`.
- Tam refactor'ı land etmeden önce veya herkese açık SDK/export değişiklikleri
  sonrasında Testbox içinde daha geniş `pnpm check`.
- Uyumluluk sarmalayıcılarını kaldırmadan önce en az bir düzenleme-yetenekli
  kanal ve bir basit yalnızca-gönder kanal için live veya qa-channel smoke.

## Açık sorular

- Telegram'ın sonunda grammY runner kaynağını, yalnızca OpenClaw'ın kalıcı
  restart watermark'ını değil platform düzeyi yeniden teslimatı da kontrol
  edebilen tamamen durable bir polling source ile değiştirip değiştirmemesi.
- Durable live preview state'in final send intent ile aynı queue kaydında mı,
  yoksa kardeş bir live-state store'da mı saklanması gerektiği.
- `plugin-sdk/channel-message` gönderildikten sonra uyumluluk sarmalayıcılarının
  ne kadar süre belgelenmiş kalacağı.
- Üçüncü taraf Plugin'lerin receive adapter'larını doğrudan mı uygulaması
  gerektiği, yoksa yalnızca `defineChannelMessageAdapter` üzerinden
  normalize/send/live hook'ları mı sağlaması gerektiği.
- Hangi receipt alanlarının herkese açık SDK'da, hangilerinin dahili runtime
  state'te gösterilmesinin güvenli olduğu.
- Self-echo cache'leri ve participated-thread marker'ları gibi yan etkilerin
  send-context hook'ları, adapter'a ait finalize adımları veya receipt
  subscriber'ları olarak mı modellenmesi gerektiği.
- Hangi kanalların native origin metadata'ya sahip olduğu, hangilerinin kalıcı
  outbound registry'lere ihtiyaç duyduğu ve hangilerinin güvenilir cross-bot
  echo suppression sunamayacağı.

## Kabul ölçütleri

- Paketlenmiş her mesaj kanalı final görünür çıktıyı `messages.send` üzerinden
  gönderir.
- Her inbound mesaj kanalı `messages.receive` veya belgelenmiş bir uyumluluk
  sarmalayıcısı üzerinden girer.
- Her preview/edit/stream kanalı, taslak state ve finalizasyon için
  `messages.live` kullanır.
- `channel.turn` yalnızca bir sarmalayıcıdır.
- Reply adlı SDK yardımcıları önerilen yol değil, uyumluluk export'larıdır.
- Durable recovery, final yanıtı kaybetmeden veya zaten commit edilmiş
  gönderimleri yinelemeden yeniden başlatma sonrasında bekleyen final
  gönderimleri replay edebilir; platform sonucu bilinmeyen gönderimler
  replay'den önce uzlaştırılır veya o adapter için at-least-once olarak
  belgelenir.
- Durable final gönderimleri, durable intent yazılamadığında, çağıran açıkça
  belgelenmiş non-durable bir mod seçmedikçe fail closed davranır.
- Eski channel-turn ve SDK uyumluluk yardımcıları varsayılan olarak doğrudan
  kanalın sahip olduğu teslimatı kullanır; generic durable send yalnızca açık
  katılımdır.
- Receipt'ler, çok parçalı teslimatlar için tüm platform mesaj id'lerini ve
  threading/edit kolaylığı için bir primary id'yi korur.
- Durable sarmalayıcılar, doğrudan teslim callback'lerini değiştirmeden önce
  kanal-yerel yan etkileri korur.
- Hazırlanmış dispatcher'lar, final teslimat yolları açıkça gönderme bağlamını
  kullanana kadar durable sayılmaz.
- Fallback teslimatı her projected payload'u işler.
- Durable fallback teslimatı her projected payload'u tek bir replay edilebilir
  intent veya batch plan içinde kaydeder.
- OpenClaw kaynaklı Gateway failure çıktısı insanlar için görünürdür, ancak
  etiketlenmiş bot-yazarlı oda echo'ları, origin sözleşmesini desteklediğini
  bildiren kanallarda bot yetkilendirmesinden önce düşürülür.
- Belgeler send, receive, live, state, receipt'ler, ilişkiler, hata politikası,
  geçiş ve test kapsamını açıklar.

## İlgili

- [Mesajlar](/tr/concepts/messages)
- [Streaming ve chunking](/tr/concepts/streaming)
- [İlerleme taslakları](/tr/concepts/progress-drafts)
- [Retry policy](/tr/concepts/retry)
- [Channel turn kernel](/tr/plugins/sdk-channel-turn)
