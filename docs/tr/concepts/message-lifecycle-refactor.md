---
read_when:
    - Kanal gönderme veya alma davranışını yeniden düzenleme
    - Kanal turunu, yanıt gönderimini, giden kuyruğunu, önizleme akışını veya Plugin SDK mesaj API'lerini değiştirme
    - Kalıcı gönderimler, alındı bildirimleri, önizlemeler, düzenlemeler veya yeniden denemeler gerektiren yeni bir kanal Plugin tasarlama
summary: Birleşik kalıcı mesaj alma, gönderme, önizleme, düzenleme ve akış yaşam döngüsü için tasarım planı
title: Mesaj yaşam döngüsü yeniden düzenlemesi
x-i18n:
    generated_at: "2026-05-10T19:32:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Bu sayfa, dağınık kanal turn, reply dispatch, önizleme akışı ve giden teslimat yardımcılarını tek bir dayanıklı ileti yaşam döngüsüyle değiştirmek için hedef tasarımdır.

Kısa sürüm:

- Temel ilkel öğeler **reply** değil, **receive** ve **send** olmalıdır.
- Yanıt, yalnızca giden bir ileti üzerindeki ilişkidir.
- Turn, gelen işleme için bir kolaylıktır; teslimatın sahibi değildir.
- Gönderme bağlam tabanlı olmalıdır: `begin`, render, preview veya stream, final send, commit, fail.
- Alma da bağlam tabanlı olmalıdır: normalize, dedupe, route, record, dispatch, platform ack, fail.
- Herkese açık Plugin SDK tek, küçük bir kanal-ileti yüzeyine indirgenmelidir.

## Sorunlar

Mevcut kanal yığını birkaç geçerli yerel ihtiyaçtan doğdu:

- Basit gelen bağdaştırıcılar `runtime.channel.turn.run` kullanır.
- Zengin bağdaştırıcılar `runtime.channel.turn.runPrepared` kullanır.
- Eski yardımcılar `dispatchInboundReplyWithBase`,
  `recordInboundSessionAndDispatchReply`, yanıt yükü yardımcıları, yanıt parçalama,
  yanıt referansları ve giden çalışma zamanı yardımcılarını kullanır.
- Önizleme akışı kanala özgü dispatcher'larda yaşar.
- Nihai teslimat dayanıklılığı mevcut yanıt yükü yolları etrafında ekleniyor.

Bu yapı yerel hataları düzeltir, ancak OpenClaw'da çok fazla herkese açık kavram
ve teslimat semantiklerinin sapabileceği çok fazla yer bırakır.

Bunu ortaya çıkaran güvenilirlik sorunu şudur:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Hedef değişmez yalnızca Telegram'dan daha geniştir: çekirdek görünür bir giden
iletinin var olması gerektiğine karar verdiğinde, platform gönderimi denenmeden
önce niyet dayanıklı olmalı ve başarılı olduktan sonra platform alındısı commit
edilmelidir. Bu, OpenClaw'a en az bir kez kurtarma sağlar. Tam olarak bir kez
davranışı yalnızca yerel idempotency kanıtlayabilen veya gönderimden sonra
bilinmeyen bir denemeyi yeniden oynatmadan önce platform durumuyla uzlaştırabilen
bağdaştırıcılarda vardır.

Bu, bu refactor için son durumdur; her mevcut yolun açıklaması değildir. Geçiş
sırasında, mevcut giden yardımcılar en iyi çaba kuyruk yazımları başarısız
olduğunda hâlâ doğrudan gönderime düşebilir. Refactor ancak dayanıklı nihai
gönderimler kapalı başarısız olduğunda veya belgelenmiş dayanıklı olmayan bir
politikayla açıkça dışarıda bırakıldığında tamamlanır.

## Hedefler

- Tüm kanal iletisi alma ve gönderme yolları için tek bir çekirdek yaşam döngüsü.
- Bir bağdaştırıcı yeniden oynatma açısından güvenli davranış bildirdikten sonra yeni ileti yaşam döngüsünde varsayılan olarak dayanıklı nihai gönderimler.
- Paylaşılan önizleme, düzenleme, akış, sonlandırma, yeniden deneme, kurtarma ve alındı semantikleri.
- Üçüncü taraf Plugin'lerin öğrenip sürdürebileceği küçük bir Plugin SDK yüzeyi.
- Geçiş sırasında mevcut `channel.turn` çağıranları için uyumluluk.
- Yeni kanal yetenekleri için net genişletme noktaları.
- Çekirdekte platforma özgü dallar yok.
- Token-delta kanal iletileri yok. Kanal akışı ileti önizlemesi, düzenleme, ekleme veya tamamlanmış blok teslimatı olarak kalır.
- Görünür Gateway hatalarının paylaşılan bot etkin odalara yeni prompt'lar olarak yeniden girmemesi için operasyonel/sistem çıktısına yönelik yapılandırılmış OpenClaw kaynak metadatası.

## Hedef dışı kalanlar

- İlk aşamada `runtime.channel.turn.*` kaldırılmayacak.
- Her kanal aynı yerel aktarım davranışına zorlanmayacak.
- Çekirdeğe Telegram konuları, Slack yerel akışları, Matrix redaction'ları,
  Feishu kartları, QQ sesleri veya Teams etkinlikleri öğretilmeyecek.
- Tüm dahili geçiş yardımcıları kararlı SDK API olarak yayımlanmayacak.
- Yeniden denemeler tamamlanmış idempotent olmayan platform işlemlerini yeniden oynatmayacak.

## Referans model

Vercel Chat iyi bir herkese açık zihinsel modele sahiptir:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- `postMessage`, `editMessage`, `deleteMessage`,
  `stream`, `startTyping` ve geçmiş getirmeleri gibi bağdaştırıcı yöntemleri
- dedupe, kilitler, kuyruklar ve kalıcılık için bir durum bağdaştırıcısı

OpenClaw yüzeyi kopyalamamalı, sözcük dağarcığını ödünç almalıdır.

OpenClaw'ın bu modelin ötesinde ihtiyaç duyduğu şeyler:

- Doğrudan aktarım çağrılarından önce dayanıklı giden gönderim niyetleri.
- Begin, commit ve fail içeren açık gönderim bağlamları.
- Platform ack politikasını bilen alma bağlamları.
- Yeniden başlatmadan sağ çıkan ve düzenleme, silme, kurtarma ve kopya bastırmayı yönlendirebilen alındılar.
- Daha küçük bir herkese açık SDK. Birlikte gelen Plugin'ler dahili çalışma zamanı yardımcılarını kullanabilir, ancak üçüncü taraf Plugin'ler tek, tutarlı bir ileti API'si görmelidir.
- Ajana özgü davranış: oturumlar, transcript'ler, blok akışı, araç ilerlemesi, onaylar, medya yönergeleri, sessiz yanıtlar ve grup mention geçmişi.

`thread.post()` tarzı promise'ler OpenClaw için yeterli değildir. Bir gönderimin
kurtarılabilir olup olmadığına karar veren işlem sınırını gizlerler.

## Çekirdek model

Yeni domain `src/channels/message/*` gibi dahili bir çekirdek namespace altında yaşamalıdır.

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
dedupe'nun sahibidir.

## İleti terimleri

### İleti

Normalize edilmiş ileti platformdan bağımsızdır:

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

Hedef, iletinin nerede yaşadığını açıklar:

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

Bu, aynı gönderim yolunun normal yanıtları, cron bildirimlerini, onay
prompt'larını, görev tamamlamalarını, message-tool gönderimlerini, CLI veya
Control UI gönderimlerini, alt ajan sonuçlarını ve otomasyon gönderimlerini
işlemesini sağlar.

### Origin

Origin, bir iletiyi kimin ürettiğini ve OpenClaw'ın bu iletinin yankılarını nasıl
ele alması gerektiğini açıklar. İlişkiden ayrıdır: bir ileti bir kullanıcıya
yanıt olabilir ve yine de OpenClaw kaynaklı operasyonel çıktı olabilir.

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

OpenClaw kaynaklı çıktının anlamına çekirdek sahiptir. Kanallar bu origin'in
kendi aktarımlarına nasıl kodlandığına sahiptir.

İlk gerekli kullanım Gateway hata çıktısıdır. İnsanlar "Agent failed before reply"
veya "Missing API key" gibi iletileri hâlâ görmelidir, ancak OpenClaw operasyonel
çıktısı olarak etiketlenmiş çıktı, `allowBots` etkin olduğunda paylaşılan
odalarda bot tarafından yazılmış girdi olarak kabul edilmemelidir.

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
sonlandırma, kopya bastırma ve kurtarmaya köprü kurar.

Bir alındı tek bir platform iletisini veya çok parçalı teslimatı açıklayabilir.
Parçalanmış metin, medya artı metin, ses artı metin ve kart fallback'leri tüm
platform id'lerini korumalı, aynı zamanda thread oluşturma ve sonraki düzenlemeler
için birincil bir id sunmalıdır.

## Alma bağlamı

Alma, yalın bir yardımcı çağrısı olmamalıdır. Çekirdeğin dedupe, yönlendirme,
oturum kaydı ve platform ack politikasını bilen bir bağlama ihtiyacı vardır.

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

Ack tek bir şey değildir. Alma sözleşmesi şu sinyalleri ayrı tutmalıdır:

- **Aktarım ack'i:** platform webhook'una veya socket'ine OpenClaw'ın olay zarfını kabul ettiğini söyler. Bazı platformlar bunu dispatch'ten önce gerektirir.
- **Polling offset ack'i:** aynı olayın tekrar getirilmemesi için bir imleci ilerletir. Bu, kurtarılamayacak işin ötesine ilerlememelidir.
- **Gelen kayıt ack'i:** OpenClaw'ın bir yeniden teslimatı dedupe etmek ve yönlendirmek için yeterli gelen metadatasını kalıcılaştırdığını doğrular.
- **Kullanıcıya görünür alındı:** isteğe bağlı okundu/durum/yazıyor davranışı; asla dayanıklılık sınırı değildir.

`ReceiveAckPolicy` yalnızca aktarım veya polling onayını kontrol eder. Okundu
alındıları veya durum tepkileri için yeniden kullanılmamalıdır.

Bot yetkilendirmesinden önce, kanal ileti origin metadatasını çözebildiğinde alma
paylaşılan OpenClaw echo politikasını uygulamalıdır:

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

Bu drop metin tabanlı değil, etiket tabanlıdır. Aynı görünür Gateway hata metnine
sahip, ancak OpenClaw origin metadatası olmayan bot tarafından yazılmış bir oda
iletisi yine normal `allowBots` yetkilendirmesinden geçer.

Ack politikası açıktır:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling artık kalıcı yeniden başlatma watermark'ı için receive-context
ack politikasını kullanır. Tracker grammY güncellemelerini middleware zincirine
girerken hâlâ gözlemler, ancak OpenClaw yalnızca başarılı dispatch'ten sonra
güvenli tamamlanmış güncelleme id'sini kalıcılaştırır; başarısız veya daha düşük
bekleyen güncellemeleri yeniden başlatma sonrasında yeniden oynatılabilir bırakır.
Telegram'ın upstream `getUpdates` getirme offset'i hâlâ polling kitaplığı
tarafından kontrol edilir, bu nedenle platform düzeyinde yeniden teslimata
OpenClaw'ın yeniden başlatma watermark'ının ötesinde ihtiyacımız olursa geriye
kalan daha derin değişiklik tamamen dayanıklı bir polling kaynağıdır. Webhook
platformları anında HTTP ack'i gerektirebilir, ancak webhook'lar yeniden teslim
edebildiği için yine de gelen dedupe'ya ve dayanıklı giden gönderim niyetlerine
ihtiyaç duyarlar.

## Gönderim bağlamı

Gönderme de bağlam tabanlıdır:

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

Amaç, aktarım G/Ç işleminden önce var olmalıdır. Başlatmadan sonra ama commit işleminden önce gerçekleşen bir yeniden başlatma kurtarılabilir.

Tehlikeli sınır, platform başarısından sonra ve alındı commit işleminden öncedir. Bir süreç burada ölürse OpenClaw, adaptör yerel idempotency veya alındı uzlaştırma yolu sağlamadığı sürece platform mesajının var olup olmadığını bilemez. Bu denemeler körlemesine yeniden oynatılmamalı, `unknown_after_send` durumunda sürdürülmelidir. Uzlaştırma olmayan kanallar, yinelenen görünür mesajlar o kanal ve ilişki için kabul edilebilir, belgelenmiş bir ödünse yalnızca en az bir kez yeniden oynatmayı seçebilir. Mevcut SDK uzlaştırma köprüsü, adaptörün `reconcileUnknownSend` bildirmesini gerektirir, ardından `durableFinal.reconcileUnknownSend` üzerinden bilinmeyen bir kaydı `sent`, `not_sent` veya `unresolved` olarak sınıflandırmasını ister; yalnızca `not_sent` yeniden oynatmaya izin verir ve çözümlenmemiş kayıtlar terminal durumda kalır ya da yalnızca uzlaştırma denetimini yeniden dener.

Kalıcılık ilkesi açık olmalıdır:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required`, kalıcı amacı yazamadığında çekirdeğin kapalı şekilde başarısız olması gerektiği anlamına gelir. `best_effort`, kalıcılık kullanılamadığında devam edebilir. `disabled`, eski doğrudan gönderme davranışını korur. Geçiş sırasında eski sarmalayıcılar ve genel uyumluluk yardımcıları varsayılan olarak `disabled` kullanır; bir kanalın genel bir outbound adaptörü olmasından `required` sonucunu çıkarmamalıdırlar.

Gönderim bağlamları kanal yerelindeki gönderim sonrası etkilerin de sahibidir. Kalıcı teslimat, daha önce kanalın doğrudan gönderim yoluna bağlı olan yerel davranışı atlıyorsa geçiş güvenli değildir. Örnekler arasında self-echo bastırma önbellekleri, iş parçacığı katılım işaretçileri, yerel düzenleme çapaları, model imzası oluşturma ve platforma özgü yinelenen ileti korumaları bulunur. Bu etkiler, ilgili kanal kalıcı genel nihai teslimatı etkinleştirmeden önce gönderim adaptörüne, render adaptörüne veya adlandırılmış bir gönderim bağlamı hook’una taşınmalıdır.

Gönderim yardımcıları alındıları çağırana kadar geri döndürmelidir. Kalıcı sarmalayıcılar mesaj kimliklerini yutamaz veya bir kanal teslimat sonucunu `undefined` ile değiştiremez; tamponlanan dağıtıcılar bu kimlikleri iş parçacığı çapaları, sonraki düzenlemeler, önizleme sonlandırma ve yinelenen ileti bastırma için kullanır.

Geri dönüş gönderimleri tek payload’lar üzerinde değil, batch’ler üzerinde çalışır. Sessiz yanıt yeniden yazımları, medya geri dönüşü, kart geri dönüşü ve parça projeksiyonu birden fazla teslim edilebilir mesaj üretebilir; bu nedenle bir gönderim bağlamı ya projelendirilmiş batch’in tamamını teslim etmeli ya da neden yalnızca bir payload’un geçerli olduğunu açıkça belgelemelidir.

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

Böyle bir geri dönüş kalıcı olduğunda, projelendirilmiş batch’in tamamı tek bir kalıcı gönderim amacıyla veya başka bir atomik batch planıyla temsil edilmelidir. Her payload’u tek tek kaydetmek yeterli değildir: payload’lar arasındaki bir çökme, kalan payload’lar için kalıcı kayıt olmadan kısmi görünür bir geri dönüş bırakabilir. Kurtarma, hangi birimlerin zaten alındıya sahip olduğunu bilmeli ve yalnızca eksik birimleri yeniden oynatmalı ya da adaptör bunu uzlaştırana kadar batch’i `unknown_after_send` olarak işaretlemelidir.

## Canlı bağlam

Önizleme, düzenleme, ilerleme ve stream davranışı tek bir isteğe bağlı yaşam döngüsü olmalıdır.

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

Canlı durum, yinelenenleri kurtarmak veya bastırmak için yeterince kalıcıdır:

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

Bu, mevcut davranışı kapsamalıdır:

- Telegram gönderimi ve düzenleme önizlemesi, bayat önizleme yaşından sonra taze nihai iletiyle.
- Discord gönderimi ve düzenleme önizlemesi, medya/hata/açık yanıt durumunda iptal.
- İş parçacığı şekline bağlı olarak Slack yerel stream’i veya taslak önizlemesi.
- Mattermost taslak gönderi sonlandırması.
- Matrix taslak olay sonlandırması veya uyumsuzlukta redaksiyon.
- Teams yerel ilerleme stream’i.
- QQ Bot stream’i veya biriktirilmiş geri dönüş.

## Adaptör yüzeyi

Genel SDK hedefi tek bir alt yol olmalıdır:

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

Alma adaptörü:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Ön kontrol yetkilendirmesinden önce, `origin.decode` OpenClaw kökenli metadata döndürdüğünde çekirdek paylaşılan OpenClaw echo yüklemini çalıştırmalıdır. Alma adaptörü bot yazarı ve oda şekli gibi platform olgularını sağlar; bırakma kararı ve sıralama çekirdeğe aittir, böylece kanallar metin filtrelerini yeniden uygulamaz.

Köken adaptörü:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Çekirdek `MessageOrigin` ayarlar. Kanallar bunu yalnızca yerel aktarım metadata’sına çevirir ve oradan geri çevirir. Slack bunu `chat.postMessage({ metadata })` ve gelen `message.metadata` ile eşler; Matrix bunu ek olay içeriğine eşleyebilir; yerel metadata olmayan kanallar, mevcut en iyi yaklaşım bu olduğunda bir alındı/outbound kayıt defteri kullanabilir.

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

## Genel SDK sadeleştirmesi

Yeni genel yüzey şu kavramsal alanları içine almalı veya kullanım dışı bırakmalıdır:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` genel kullanımlarının çoğu
- geçici taslak stream yaşam döngüsü yardımcıları

Uyumluluk alt yolları sarmalayıcı olarak kalabilir, ancak yeni üçüncü taraf Plugin’ler bunlara ihtiyaç duymamalıdır.

Bundled Plugin’ler geçiş sırasında ayrılmış runtime alt yolları üzerinden dahili yardımcı import’larını koruyabilir. Genel dokümanlar, var olduktan sonra Plugin yazarlarını `plugin-sdk/channel-message` yoluna yönlendirmelidir.

## Kanal turu ile ilişki

`runtime.channel.turn.*` geçiş sırasında kalmalıdır.

Bir uyumluluk adaptörüne dönüşmelidir:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` başlangıçta da kalmalıdır:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Tüm bundled Plugin’ler ve bilinen üçüncü taraf uyumluluk yolları köprülendikten sonra `channel.turn` kullanım dışı bırakılabilir. Yayınlanmış bir SDK geçiş yolu ve eski Plugin’lerin hâlâ çalıştığını veya açık bir sürüm hatasıyla başarısız olduğunu kanıtlayan sözleşme testleri olmadan kaldırılmamalıdır.

## Uyumluluk koruma sınırları

Geçiş sırasında genel kalıcı teslimat, mevcut teslimat callback’i “bu payload’u gönder” dışında yan etkilere sahip olan her kanal için isteğe bağlıdır.

Eski giriş noktaları varsayılan olarak kalıcı değildir:

- `channel.turn.run` ve `dispatchAssembledChannelTurn`, ilgili kanal açıkça denetlenmiş bir kalıcılık ilkesi/seçenekler nesnesi sağlamadığı sürece kanalın teslimat callback’ini kullanır.
- `channel.turn.runPrepared`, hazırlanmış dağıtıcı gönderim bağlamını açıkça çağırana kadar kanal sahipliğinde kalır.
- `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` ve doğrudan DM yardımcıları gibi genel uyumluluk yardımcıları, çağıranın sağladığı `deliver` veya `reply` callback’inden önce asla genel kalıcı teslimat enjekte etmez.

Geçiş köprüsü türleri için `durable: undefined`, “kalıcı değil” anlamına gelir. Kalıcı yol yalnızca açık bir ilke/seçenek değeriyle etkinleştirilir. `durable:
false` bir uyumluluk yazımı olarak kalabilir, ancak uygulama geçirilmemiş her kanalın bunu eklemesini gerektirmemelidir.

Mevcut köprü kodu kalıcılık kararını açık tutmalıdır:

- Dayanıklı nihai teslimat, ayrıştırılmış bir durum döndürür. `handled_visible` ve
  `handled_no_send` sonlandırıcıdır; `unsupported` ve `not_applicable`, kanalın
  sahip olduğu teslimata geri düşebilir; `failed` gönderme hatasını iletir.
- Genel dayanıklı nihai teslimat; sessiz teslimat, yanıt hedefini koruma, yerel
  alıntıyı koruma ve mesaj gönderme kancaları gibi adaptör yetenekleriyle
  sınırlandırılır. Eksik denklik, kullanıcıya görünen davranışı değiştiren genel
  bir gönderimi değil, kanalın sahip olduğu teslimatı seçmelidir.
- Kuyruk destekli dayanıklı gönderimler bir teslimat niyeti referansı sunar.
  Mevcut `pendingFinalDelivery*` oturum alanları geçiş sırasında niyet kimliğini
  taşıyabilir; son durum, donmuş yanıt metni artı geçici bağlam alanları yerine
  bir `MessageSendIntent` deposudur.

Bunların tümü doğru olana kadar bir kanal için genel dayanıklı yolu
etkinleştirmeyin:

- Genel gönderim adaptörü, eski doğrudan yolla aynı işleme ve taşıma davranışını
  yürütür.
- Yerel gönderim sonrası yan etkiler gönderim bağlamı üzerinden korunur.
- Adaptör, tüm platform mesaj kimlikleriyle birlikte alındıları veya teslimat
  sonuçlarını döndürür.
- Hazırlanmış dispatcher yolları ya yeni gönderim bağlamını çağırır ya da
  dayanıklı garantinin dışında olarak belgelenmiş kalır.
- Geri dönüş teslimatı, yalnızca ilkini değil, öngörülen her yükü işler.
- Dayanıklı geri dönüş teslimatı, öngörülen yük dizisinin tamamını tek bir
  yeniden oynatılabilir niyet veya toplu plan olarak kaydeder.

Korunması gereken somut geçiş tehlikeleri:

- iMessage izleyici teslimatı, başarılı bir gönderimden sonra gönderilen
  mesajları bir yankı önbelleğine kaydeder. Dayanıklı nihai gönderimler yine de
  bu önbelleği doldurmalıdır; aksi takdirde OpenClaw kendi nihai yanıtlarını
  gelen kullanıcı mesajları olarak yeniden alabilir.
- Tlon isteğe bağlı bir model imzası ekler ve grup yanıtlarından sonra katılım
  sağlanan iş parçacıklarını kaydeder. Genel dayanıklı teslimat bu etkileri
  atlamamalıdır; bunları ya Tlon işleme/gönderme/sonlandırma adaptörlerine
  taşıyın ya da Tlon’u kanalın sahip olduğu yolda tutun.
- Discord ve diğer hazırlanmış dispatcher’lar zaten doğrudan teslimata ve
  önizleme davranışına sahiptir. Hazırlanmış dispatcher’ları nihai yanıtları
  gönderim bağlamı üzerinden açıkça yönlendirmedikçe, birleştirilmiş dönüş
  dayanıklı garantisi kapsamında değildirler.
- Telegram sessiz geri dönüş teslimatı, öngörülen yük dizisinin tamamını teslim
  etmelidir. Tek yük kısayolu, projeksiyondan sonra ek geri dönüş yüklerini
  düşürebilir.
- LINE, Zalo, Nostr ve diğer mevcut birleştirilmiş/yardımcı yollar; yanıt
  belirteci işleme, medya proxy’leme, gönderilen mesaj önbellekleri,
  yükleniyor/durum temizliği veya yalnızca geri çağrı hedeflerine sahip olabilir.
  Bu semantik gönderim adaptörü tarafından temsil edilip testlerle doğrulanana
  kadar kanalın sahip olduğu teslimatta kalırlar.
- Doğrudan-DM yardımcıları, tek doğru taşıma hedefi olan bir yanıt geri
  çağrısına sahip olabilir. Genel giden ileti, `OriginatingTo` veya `To`
  üzerinden tahminde bulunup bu geri çağrıyı atlamamalıdır.
- OpenClaw gateway hata çıktısı insanlar için görünür kalmalıdır, ancak
  etiketlenmiş bot tarafından yazılmış oda yankıları `allowBots`
  yetkilendirmesinden önce düşürülmelidir. Kanallar bunu, kısa süreli acil
  durdurma dışında görünür metin öneki filtreleriyle uygulamamalıdır; dayanıklı
  sözleşme yapılandırılmış kaynak meta verisidir.

## Dahili depolama

Dayanıklı kuyruk, yanıt yüklerini değil, mesaj gönderme niyetlerini
depolamalıdır.

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

Kuyruk, yeniden başlatmadan sonra aynı hesap, iş parçacığı, hedef, biçimlendirme
politikası ve medya kuralları üzerinden yeniden oynatmak için yeterli kimliği
saklamalıdır.

## Hata sınıfları

Kanal adaptörleri taşıma hatalarını kapalı kategorilere ayırır:

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
- `not_found` için, kanal bunun güvenli olduğunu beyan ettiğinde canlı
  sonlandırmanın düzenlemeden yeni gönderime geri düşmesine izin verin.
- `conflict` için, mesajın zaten var olup olmadığına karar vermek üzere alındı/
  idempotency kurallarını kullanın.
- Adaptör platform G/Ç’sini tamamlamış olabileceği halde alındı kaydından önce
  oluşan herhangi bir hata, adaptör platform işleminin gerçekleşmediğini
  kanıtlayamazsa `unknown_after_send` olur.

## Kanal eşlemesi

| Kanal           | Hedef geçiş                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Alım onay ilkesi ve dayanıklı nihai gönderimler. Canlı adaptör gönderim ile düzenleme önizlemesini, bayat önizlemenin nihai gönderimini, konuları, alıntı-yanıt önizleme atlamasını, medya yedek yolunu ve retry-after işlemeyi üstlenir.                                                                                                                       |
| Discord         | Gönderim adaptörü mevcut dayanıklı yük teslimini sarmalar. Canlı adaptör taslak düzenlemeyi, ilerleme taslağını, medya/hata önizleme iptalini, yanıt hedefinin korunmasını ve mesaj kimliği alındılarını üstlenir. Paylaşılan odalarda bot tarafından yazılan Gateway hatası yankılarını denetleyin; Discord normal mesajlarda köken üst verisini taşıyamıyorsa bir çıkış kayıt defteri veya başka bir yerel eşdeğer kullanın. |
| Slack           | Gönderim adaptörü normal sohbet gönderilerini işler. Canlı adaptör, iş parçacığı yapısı desteklediğinde yerel akışı, aksi halde taslak önizlemeyi seçer. Alındılar iş parçacığı zaman damgalarını korur. Köken adaptörü OpenClaw Gateway hatalarını Slack `chat.postMessage.metadata` ile eşler ve `allowBots` yetkilendirmesinden önce etiketlenmiş bot odası yankılarını düşürür. |
| WhatsApp        | Gönderim adaptörü dayanıklı nihai niyetlerle metin/medya gönderimini üstlenir. Alma adaptörü grup bahsini ve gönderen kimliğini işler. WhatsApp düzenlenebilir bir taşıma sunana kadar canlı adaptör olmayabilir.                                                                                                                                                |
| Matrix          | Canlı adaptör taslak olay düzenlemelerini, nihai hale getirmeyi, redaksiyonu, şifreli medya kısıtlarını ve yanıt hedefi uyuşmazlığı yedek yolunu üstlenir. Alma adaptörü şifreli olay hidrasyonunu ve tekilleştirmeyi üstlenir. Köken adaptörü OpenClaw Gateway hatası kökenini Matrix olay içeriğine kodlamalı ve yapılandırılmış bot oda yankılarını `allowBots` işlemeden önce düşürmelidir. |
| Mattermost      | Canlı adaptör tek bir taslak gönderiyi, ilerleme/araç katlamayı, yerinde nihai hale getirmeyi ve yeni gönderim yedek yolunu üstlenir.                                                                                                                                                                                                                           |
| Microsoft Teams | Canlı adaptör yerel ilerleme ve blok akışı davranışını üstlenir. Gönderim adaptörü etkinlikleri ve ek/kart alındılarını üstlenir.                                                                                                                                                                                                                                |
| Feishu          | İşleme adaptörü metin/kart/ham işlemeyi üstlenir. Canlı adaptör akış kartlarını ve yinelenen nihai bastırmayı üstlenir. Gönderim adaptörü yorumları, konu oturumlarını, medyayı ve ses bastırmayı üstlenir.                                                                                                                                                      |
| QQ Bot          | Canlı adaptör C2C akışını, biriktirici zaman aşımını ve yedek nihai gönderimi üstlenir. İşleme adaptörü medya etiketlerini ve metnin ses olarak kullanılmasını üstlenir.                                                                                                                                                                                         |
| Signal          | Basit alma ve gönderim adaptörü. signal-cli güvenilir düzenleme desteği eklemediği sürece canlı adaptör yok.                                                                                                                                                                                                                                                    |
| iMessage        | Basit alma ve gönderim adaptörü. iMessage gönderimi, dayanıklı nihai gönderimler izleyici teslimini atlayabilmeden önce izleyici yankı önbelleği doldurmasını korumalıdır.                                                                                                                                                                                      |
| Google Chat     | Alanlara ve iş parçacığı kimliklerine eşlenen iş parçacığı ilişkisiyle basit alma ve gönderim adaptörü. Etiketlenmiş OpenClaw Gateway hatası yankıları için `allowBots=true` oda davranışını denetleyin.                                                                                                                                                         |
| LINE            | Hedef/ilişki yeteneği olarak modellenmiş yanıt belirteci kısıtlarıyla basit alma ve gönderim adaptörü.                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK alma köprüsü ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                                          |
| IRC             | Basit alma ve gönderim adaptörü, dayanıklı düzenleme alındıları yok.                                                                                                                                                                                                                                                                                            |
| Nostr           | Şifreli DM'ler için alma ve gönderim adaptörü; alındılar olay kimlikleridir.                                                                                                                                                                                                                                                                                    |
| QA Kanalı       | Alma, gönderim, canlı, yeniden deneme ve kurtarma davranışı için sözleşme testi adaptörü.                                                                                                                                                                                                                                                                        |
| Synology Chat   | Basit alma ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                                                |
| Tlon            | Gönderim adaptörü, genel dayanıklı nihai teslim etkinleştirilmeden önce model imzası işlemeyi ve katılınmış iş parçacığı takibini korumalıdır.                                                                                                                                                                                                                   |
| Twitch          | Hız sınırı sınıflandırmasıyla basit alma ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                  |
| Zalo            | Basit alma ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                                                |
| Zalo Personal   | Basit alma ve gönderim adaptörü.                                                                                                                                                                                                                                                                                                                                |

## Geçiş planı

### Aşama 1: Dahili Mesaj Etki Alanı

- Mesajlar, hedefler, ilişkiler,
  kökenler, alındılar, yetenekler, dayanıklı niyetler, alma bağlamı, gönderim
  bağlamı, canlı bağlam ve hata sınıfları için `src/channels/message/*` türleri ekleyin.
- Mevcut yanıt teslimi tarafından kullanılan geçiş köprüsü yük türüne
  `origin?: MessageOrigin` ekleyin, ardından yeniden düzenleme yanıt yüklerinin
  yerini aldıkça bu alanı `ChannelMessage` ve işlenmiş mesaj türlerine taşıyın.
- Adaptörler ve testler şekli kanıtlayana kadar bunu dahili tutun.
- Durum geçişleri ve serileştirme için saf birim testleri ekleyin.

### Aşama 2: Dayanıklı Gönderim Çekirdeği

- Mevcut çıkış kuyruğunu yanıt-yükü dayanıklılığından dayanıklı
  mesaj gönderim niyetlerine taşıyın.
- Dayanıklı gönderim niyetinin yalnızca tek bir yanıt yükü değil,
  öngörülen bir yük dizisi veya toplu iş planı taşımasına izin verin.
- Uyumluluk dönüştürmesi yoluyla mevcut kuyruk kurtarma davranışını koruyun.
- `deliverOutboundPayloads` işlevinin `messages.send` çağırmasını sağlayın.
- Adaptör yeniden oynatma güvenliğini bildirdikten sonra, yeni mesaj yaşam döngüsünde
  dayanıklı niyet yazılamadığında nihai gönderim dayanıklılığını varsayılan yapın ve kapalı şekilde hata verin.
  Mevcut kanal turu ve SDK uyumluluk yolları bu aşamada varsayılan olarak doğrudan gönderim olarak kalır.
- Alındıları tutarlı şekilde kaydedin.
- Dayanıklı gönderimi terminal bir yan etki olarak ele almak yerine,
  alındıları ve teslim sonuçlarını özgün dağıtıcı çağırana döndürün.
- Kurtarma, yeniden oynatma ve parçalı gönderimler OpenClaw operasyonel kökenini
  korusun diye mesaj kökenini dayanıklı gönderim niyetleri üzerinden kalıcı hale getirin.

### Aşama 3: Kanal Turu Köprüsü

- `channel.turn.run` ve `dispatchAssembledChannelTurn` işlevlerini
  `messages.receive` ve `messages.send` üzerine yeniden uygulayın.
- Mevcut olgu türlerini kararlı tutun.
- Eski davranışı varsayılan olarak koruyun. Birleştirilmiş tur kanalı yalnızca
  adaptörü yeniden oynatma açısından güvenli bir dayanıklılık ilkesiyle açıkça katıldığında dayanıklı hale gelir.
- Yerel düzenlemeleri nihai hale getiren ve henüz güvenli şekilde yeniden oynatamayan yollar için
  uyumluluk kaçış noktası olarak `durable: false` değerini koruyun, ancak taşınmamış kanalları
  korumak için `false` işaretlerine güvenmeyin.
- Birleştirilmiş tur dayanıklılığını yalnızca yeni mesaj yaşam döngüsünde,
  kanal eşlemesi genel gönderim yolunun eski kanal teslim semantiklerini koruduğunu kanıtladıktan sonra varsayılan yapın.

### Aşama 4: Hazırlanmış Dağıtıcı Köprüsü

- `deliverDurableInboundReplyPayload` yerine bir gönderim bağlamı köprüsü koyun.
- Eski yardımcıyı bir sarmalayıcı olarak tutun.
- Önce Telegram, WhatsApp, Slack, Signal, iMessage ve Discord'u taşıyın; çünkü
  bunlarda zaten dayanıklı final çalışması veya daha basit gönderim yolları var.
- Açıkça gönderim bağlamına katılana kadar her hazırlanmış dağıtıcıyı kapsam dışı
  kabul edin. Dokümantasyon ve changelog girdileri, tüm otomatik final
  yanıtlarını iddia etmek yerine "assembled channel turns" demeli veya taşınan
  kanal yollarını adlandırmalıdır.
- `recordInboundSessionAndDispatchReply`, doğrudan DM yardımcıları ve benzer
  genel uyumluluk yardımcılarının davranışını koruyun. Daha sonra açık bir
  gönderim bağlamı katılımı sunabilirler, ancak çağıranın sahip olduğu teslim
  geri çağrısından önce otomatik olarak genel dayanıklı teslimat denememelidirler.

### Aşama 5: Birleşik Canlı Yaşam Döngüsü

- `messages.live` öğesini iki kanıt bağdaştırıcısıyla oluşturun:
  - Gönderim, düzenleme ve eski final gönderimi için Telegram.
  - Taslak finalizasyonu ve düzeltme yedeği için Matrix.
- Ardından Discord, Slack, Mattermost, Teams, QQ Bot ve Feishu'yu taşıyın.
- Yinelenen önizleme finalizasyon kodunu yalnızca her kanalın eşdeğerlik
  testleri olduktan sonra silin.

### Aşama 6: Genel SDK

- `openclaw/plugin-sdk/channel-message` ekleyin.
- Bunu tercih edilen kanal Plugin API'si olarak belgeleyin.
- Paket dışa aktarımlarını, giriş noktası envanterini, üretilen API
  temellerini ve Plugin SDK dokümantasyonunu güncelleyin.
- Kanal-ileti SDK yüzeyine `MessageOrigin`, origin kodlama/kod çözme hook'ları
  ve paylaşılan `shouldDropOpenClawEcho` predicate'ini dahil edin.
- Eski alt yollar için uyumluluk sarmalayıcılarını tutun.
- Paketli Plugin'ler taşındıktan sonra yanıta göre adlandırılmış SDK
  yardımcılarını dokümantasyonda kullanımdan kaldırılmış olarak işaretleyin.

### Aşama 7: Tüm Göndericiler

Tüm yanıt dışı giden üreticileri `messages.send` üzerine taşıyın:

- Cron ve Heartbeat bildirimleri
- görev tamamlamaları
- hook sonuçları
- onay istemleri ve onay sonuçları
- ileti aracı gönderimleri
- alt ajan tamamlanma duyuruları
- açık CLI veya Control UI gönderimleri
- otomasyon/yayın yolları

Modelin "ajan yanıtları" olmaktan çıkıp "OpenClaw ileti gönderir" haline
geldiği yer burasıdır.

### Aşama 8: Turn'ü Kullanımdan Kaldırma

- `channel.turn` öğesini en az bir uyumluluk penceresi boyunca sarmalayıcı olarak tutun.
- Geçiş notlarını yayımlayın.
- Eski içe aktarımlara karşı Plugin SDK uyumluluk testlerini çalıştırın.
- Eski dahili yardımcıları yalnızca hiçbir paketli Plugin bunlara ihtiyaç
  duymadığında ve üçüncü taraf sözleşmelerin kararlı bir ikamesi olduğunda
  kaldırın veya gizleyin.

## Test planı

Birim testleri:

- Dayanıklı gönderim amacı serileştirme ve kurtarma.
- Idempotency anahtarı yeniden kullanımı ve yineleme baskılama.
- Alındı kaydı commit'i ve yeniden oynatma atlama.
- Bir bağdaştırıcı uzlaştırmayı desteklediğinde yeniden oynatmadan önce
  uzlaştıran `unknown_after_send` kurtarması.
- Hata sınıflandırma politikası.
- Alma onayı politikası sıralaması.
- Yanıt, takip, sistem ve yayın gönderimleri için ilişki eşlemesi.
- Gateway hatası origin fabrikası ve `shouldDropOpenClawEcho` predicate'i.
- Yük normalizasyonu, parçalama, dayanıklı kuyruk serileştirmesi ve kurtarma
  boyunca origin koruması.

Entegrasyon testleri:

- `channel.turn.run` basit bağdaştırıcısı hâlâ kaydeder ve gönderir.
- Eski assembled-turn teslimatı, kanal açıkça katılmadıkça dayanıklı hale gelmez.
- `channel.turn.runPrepared` köprüsü hâlâ kaydeder ve finalize eder.
- Genel uyumluluk yardımcıları varsayılan olarak çağıranın sahip olduğu teslim
  geri çağrılarını çağırır ve bu geri çağrılardan önce genel gönderim yapmaz.
- Dayanıklı yedek teslimat, yeniden başlatmadan sonra tüm projeksiyonu yapılan
  yük dizisini yeniden oynatır ve erken bir çökmeden sonra sonraki yüklerin
  kaydedilmeden kalmasına izin veremez.
- Dayanıklı assembled-turn teslimatı, platform ileti kimliklerini tamponlanmış
  dağıtıcıya döndürür.
- Özel teslim hook'ları, dayanıklı teslimat devre dışı veya kullanılamazken de
  platform ileti kimliklerini döndürür.
- Final yanıtı, asistan tamamlaması ile platform gönderimi arasındaki yeniden
  başlatmadan sağ çıkar.
- Önizleme taslağı izin verildiğinde yerinde finalize edilir.
- Medya/hata/yanıt-hedefi uyuşmazlığı normal teslimat gerektirdiğinde önizleme
  taslağı iptal edilir veya düzeltilir.
- Blok akışı ve önizleme akışı aynı metni ikisi birden teslim etmez.
- Erken akışla gönderilen medya final teslimatta yinelenmez.

Kanal testleri:

- Telegram konu yanıtında polling onayı, alma bağlamının güvenli tamamlanmış
  watermark'ına kadar geciktirilir.
- Kabul edilmiş ancak teslim edilmemiş güncellemeler için Telegram polling
  kurtarması, kalıcı güvenli-tamamlanmış offset modeliyle kapsanır.
- Telegram eski önizlemesi yeni final gönderir ve önizlemeyi temizler.
- Telegram sessiz yedeği, projeksiyonu yapılan her yedek yükü gönderir.
- Telegram sessiz yedek dayanıklılığı, tam projeksiyonu yapılan yedek dizisini
  her döngü yinelemesi için tek bir tek-yük dayanıklı amacı olarak değil,
  atomik olarak kaydeder.
- Medya/hata/açık yanıt durumunda Discord önizleme iptali.
- Discord hazırlanmış dağıtıcı finalleri, dokümanlar veya changelog Discord
  final-yanıt dayanıklılığı iddia etmeden önce gönderim bağlamından geçer.
- iMessage dayanıklı final gönderimleri, izleyici gönderilen-ileti yankı
  önbelleğini doldurur.
- LINE, Zalo ve Nostr eski teslimat yolları, bağdaştırıcı eşdeğerlik testleri
  var olana kadar genel dayanıklı gönderim tarafından atlanmaz.
- Direct-DM/Nostr geri çağrılı teslimat, açıkça eksiksiz bir ileti hedefine ve
  yeniden oynatma güvenli gönderim bağdaştırıcısına taşınmadıkça yetkili kalır.
- Slack etiketli OpenClaw Gateway hatası iletileri giden tarafta görünür kalır,
  etiketli bot-odası yankıları `allowBots` öncesinde düşer ve aynı görünür
  metne sahip etiketsiz bot iletileri normal bot yetkilendirmesini izlemeye
  devam eder.
- Üst düzey DM'lerde Slack yerel akış yedeği taslak önizlemeye düşer.
- Matrix önizleme finalizasyonu ve düzeltme yedeği.
- Yapılandırılmış bot hesaplarından gelen Matrix etiketli OpenClaw Gateway
  hatası oda yankıları, `allowBots` işlenmeden önce düşer.
- Discord ve Google Chat paylaşımlı oda Gateway hatası cascade denetimleri,
  orada genel koruma iddia etmeden önce `allowBots` modlarını kapsar.
- Mattermost taslak finalizasyonu ve yeni-gönderim yedeği.
- Teams yerel ilerleme finalizasyonu.
- Feishu yinelenen final baskılaması.
- QQ Bot biriktirici zaman aşımı yedeği.
- Tlon dayanıklı final gönderimleri model-imzası görüntülemesini ve katılım
  sağlanan konu izlemeyi korur.
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal basit dayanıklı final
  gönderimleri.

Doğrulama:

- Geliştirme sırasında hedeflenmiş Vitest dosyaları.
- Tam değişen yüzey için Testbox içinde `pnpm check:changed`.
- Tam refactor indirilmeden veya genel SDK/dışa aktarım değişikliklerinden önce
  Testbox içinde daha geniş `pnpm check`.
- Uyumluluk sarmalayıcıları kaldırmadan önce en az bir düzenleme yetenekli
  kanal ve bir basit yalnızca-gönderim kanalı için canlı veya qa-channel smoke.

## Açık sorular

- Telegram'ın sonunda grammY runner kaynağını, yalnızca OpenClaw'ın kalıcı
  yeniden başlatma watermark'ını değil, platform düzeyinde yeniden teslimatı
  kontrol edebilen tamamen dayanıklı bir polling kaynağıyla değiştirip
  değiştirmemesi gerektiği.
- Dayanıklı canlı önizleme durumunun final gönderim amacıyla aynı kuyruk
  kaydında mı yoksa kardeş bir canlı-durum deposunda mı saklanması gerektiği.
- `plugin-sdk/channel-message` yayımlandıktan sonra uyumluluk sarmalayıcılarının
  ne kadar süre belgeli kalacağı.
- Üçüncü taraf Plugin'lerin alma bağdaştırıcılarını doğrudan mı uygulaması
  gerektiği, yoksa `defineChannelMessageAdapter` üzerinden yalnızca
  normalize/send/live hook'ları mı sağlaması gerektiği.
- Hangi alındı alanlarının genel SDK'da, hangilerinin dahili çalışma zamanı
  durumunda açığa çıkarılmasının güvenli olduğu.
- Öz-yankı önbellekleri ve katılım sağlanan konu işaretçileri gibi yan etkilerin
  gönderim bağlamı hook'ları, bağdaştırıcıya ait finalize adımları veya alındı
  aboneleri olarak modellenip modellenmemesi gerektiği.
- Hangi kanalların yerel origin meta verisine sahip olduğu, hangilerinin kalıcı
  giden kayıt defterlerine ihtiyaç duyduğu ve hangilerinin güvenilir botlar arası
  yankı baskılama sunamayacağı.

## Kabul kriterleri

- Her paketli ileti kanalı, final görünür çıktıyı `messages.send` üzerinden gönderir.
- Her gelen ileti kanalı `messages.receive` veya belgeli bir uyumluluk
  sarmalayıcısı üzerinden girer.
- Her önizleme/düzenleme/akış kanalı, taslak durumu ve finalizasyon için
  `messages.live` kullanır.
- `channel.turn` yalnızca bir sarmalayıcıdır.
- Yanıta göre adlandırılmış SDK yardımcıları, önerilen yol değil, uyumluluk
  dışa aktarımlarıdır.
- Dayanıklı kurtarma, yeniden başlatmadan sonra bekleyen final gönderimleri
  final yanıtı kaybetmeden veya zaten commit edilmiş gönderimleri yinelemeden
  yeniden oynatabilir; platform sonucu bilinmeyen gönderimler yeniden oynatmadan
  önce uzlaştırılır veya o bağdaştırıcı için at-least-once olarak belgelenir.
- Dayanıklı final gönderimleri, dayanıklı amaç yazılamadığında kapalı hata verir;
  yalnızca çağıran açıkça belgeli bir dayanıklı olmayan mod seçtiyse bu geçerli
  değildir.
- Eski channel-turn ve SDK uyumluluk yardımcıları varsayılan olarak doğrudan
  kanalın sahip olduğu teslimatı kullanır; genel dayanıklı gönderim yalnızca
  açık katılımdır.
- Alındılar, çok parçalı teslimatlar için tüm platform ileti kimliklerini ve
  konu/düzenleme kolaylığı için birincil kimliği korur.
- Dayanıklı sarmalayıcılar, doğrudan teslim geri çağrılarını değiştirmeden önce
  kanal-yerel yan etkileri korur.
- Hazırlanmış dağıtıcılar, final teslimat yolları açıkça gönderim bağlamını
  kullanana kadar dayanıklı sayılmaz.
- Yedek teslimat, projeksiyonu yapılan her yükü işler.
- Dayanıklı yedek teslimat, projeksiyonu yapılan her yükü tek bir yeniden
  oynatılabilir amaç veya toplu plan içinde kaydeder.
- OpenClaw kaynaklı Gateway hatası çıktısı insanlar tarafından görünürdür, ancak
  etiketli bot yazarlı oda yankıları, origin sözleşmesi desteğini bildiren
  kanallarda bot yetkilendirmesinden önce düşürülür.
- Dokümanlar gönderim, alma, canlı, durum, alındılar, ilişkiler, hata politikası,
  geçiş ve test kapsamını açıklar.

## İlgili

- [İletiler](/tr/concepts/messages)
- [Akış ve parçalama](/tr/concepts/streaming)
- [İlerleme taslakları](/tr/concepts/progress-drafts)
- [Yeniden deneme politikası](/tr/concepts/retry)
- [Kanal turn çekirdeği](/tr/plugins/sdk-channel-turn)
