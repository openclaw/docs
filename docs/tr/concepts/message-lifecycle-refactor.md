---
read_when:
    - Kanal gönderme veya alma davranışını yeniden düzenleme
    - Kanal gelen iletisini, yanıt gönderimini, giden kuyruğunu, önizleme akışını veya Plugin SDK mesaj API'lerini değiştirme
    - Kalıcı gönderimler, alındılar, önizlemeler, düzenlemeler veya yeniden denemeler gerektiren yeni bir kanal Plugin’i tasarlama
summary: Birleşik kalıcı mesaj alma, gönderme, önizleme, düzenleme ve akış yaşam döngüsü için tasarım planı
title: Mesaj yaşam döngüsü refaktörü
x-i18n:
    generated_at: "2026-06-28T00:28:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Bu sayfa, dağınık kanal gelen iletisi, yanıt gönderimi, önizleme akışı ve giden teslimat yardımcılarını tek bir dayanıklı ileti yaşam döngüsüyle değiştirmek için hedef tasarımdır.

Kısa sürüm:

- Temel ilkeller **reply** değil, **receive** ve **send** olmalıdır.
- Yanıt, yalnızca giden ileti üzerindeki bir ilişkidir.
- Turn, gelen ileti işleme kolaylığıdır; teslimatın sahibi değildir.
- Gönderme bağlam tabanlı olmalıdır: `begin`, render, önizleme veya akış, son gönderim, commit, fail.
- Alma da bağlam tabanlı olmalıdır: normalleştir, tekilleştir, yönlendir, kaydet, gönder, platform onayı, fail.
- Herkese açık Plugin SDK, tek ve küçük bir kanal-giden yüzeyine indirgenmelidir.

## Sorunlar

Mevcut kanal yığını, birkaç geçerli yerel ihtiyaçtan büyüdü:

- Basit gelen bağdaştırıcıları `runtime.channel.inbound.run` kullanır.
- Zengin bağdaştırıcılar `runtime.channel.inbound.runPreparedReply` kullanır.
- Eski yardımcılar `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, yanıt yükü yardımcıları, yanıt parçalama, yanıt referansları ve giden runtime yardımcıları kullanır.
- Önizleme akışı kanala özgü göndericilerde yaşar.
- Son teslimat dayanıklılığı, mevcut yanıt yükü yollarının etrafına ekleniyor.

Bu yapı yerel hataları düzeltir, ancak OpenClaw içinde çok fazla herkese açık kavram ve teslimat semantiklerinin sapabileceği çok fazla yer bırakır.

Bunu ortaya çıkaran güvenilirlik sorunu şudur:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Hedef değişmez Telegram'dan daha geniştir: core görünür bir giden iletinin var olması gerektiğine karar verdiğinde, platform gönderimi denenmeden önce niyet dayanıklı olmalı ve başarıdan sonra platform alındısı commit edilmelidir. Bu, OpenClaw için en az bir kez kurtarma sağlar. Tam olarak bir kez davranışı yalnızca yerel idempotency kanıtlayabilen veya gönderimden sonra bilinmeyen bir denemeyi yeniden oynatmadan önce platform durumuyla uzlaştırabilen bağdaştırıcılarda vardır.

Bu, bu refactor için nihai durumdur; her mevcut yolun açıklaması değildir. Geçiş sırasında, mevcut giden yardımcılar en iyi çaba kuyruk yazımları başarısız olduğunda hâlâ doğrudan gönderime düşebilir. Refactor, ancak dayanıklı son gönderimler kapalı başarısız olduğunda veya belgelenmiş dayanıklı olmayan bir politikayla açıkça devre dışı bırakıldığında tamamlanmış olur.

## Hedefler

- Tüm kanal iletisi alma ve gönderme yolları için tek bir core yaşam döngüsü.
- Bir bağdaştırıcı yeniden oynatma açısından güvenli davranış bildirdikten sonra yeni ileti yaşam döngüsünde varsayılan olarak dayanıklı son gönderimler.
- Paylaşılan önizleme, düzenleme, akış, sonlandırma, yeniden deneme, kurtarma ve alındı semantikleri.
- Üçüncü taraf Plugin'lerin öğrenip sürdürebileceği küçük bir Plugin SDK yüzeyi.
- Geçiş sırasında mevcut gelen yanıt uyumluluğu çağırıcıları için uyumluluk.
- Yeni kanal yetenekleri için net genişletme noktaları.
- Core içinde platforma özgü dallar yok.
- Token-delta kanal iletileri yok. Kanal akışı ileti önizlemesi, düzenleme, ekleme veya tamamlanmış blok teslimatı olarak kalır.
- Operasyonel/sistem çıktısı için yapılandırılmış OpenClaw-kökenli metadata; böylece görünür Gateway hataları paylaşılan bot etkin odalara yeni prompt'lar olarak yeniden girmez.

## Hedef olmayanlar

- İlk aşamada her mevcut kanalı dayanıklı ileti teslimatına zorlamayın.
- Her kanalı aynı yerel taşıma davranışına zorlamayın.
- Core'a Telegram konuları, Slack yerel akışları, Matrix redaction'ları, Feishu kartları, QQ ses veya Teams etkinliklerini öğretmeyin.
- Tüm iç geçiş yardımcılarını kararlı SDK API olarak yayımlamayın.
- Yeniden denemelerin tamamlanmış idempotent olmayan platform işlemlerini yeniden oynatmasını sağlamayın.

## Referans model

Vercel Chat iyi bir herkese açık zihinsel modele sahiptir:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` ve geçmiş getirmeleri gibi bağdaştırıcı yöntemleri
- tekilleştirme, kilitler, kuyruklar ve kalıcılık için bir durum bağdaştırıcısı

OpenClaw yüzeyi kopyalamamalı, söz varlığını ödünç almalıdır.

OpenClaw'un bu modelin ötesinde ihtiyaç duyduğu şeyler:

- Doğrudan taşıma çağrılarından önce dayanıklı giden gönderim niyetleri.
- Begin, commit ve fail içeren açık gönderim bağlamları.
- Platform onay politikasını bilen alma bağlamları.
- Yeniden başlatmadan sağ çıkan ve düzenleme, silme, kurtarma ve yinelenen bastırmayı yönlendirebilen alındılar.
- Daha küçük bir herkese açık SDK. Birlikte gelen Plugin'ler iç runtime yardımcılarını kullanabilir, ancak üçüncü taraf Plugin'ler tek ve tutarlı bir ileti API'si görmelidir.
- Ajana özgü davranış: oturumlar, transkriptler, blok akışı, araç ilerlemesi, onaylar, medya direktifleri, sessiz yanıtlar ve grup mention geçmişi.

`thread.post()` tarzı promise'ler OpenClaw için yeterli değildir. Bir gönderimin kurtarılabilir olup olmadığına karar veren işlem sınırını gizlerler.

## Core model

Yeni domain, `src/channels/message/*` gibi bir iç core namespace altında yaşamalıdır.

Dört kavramı vardır:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` gelen yaşam döngüsünün sahibidir.

`send` giden yaşam döngüsünün sahibidir.

`live` önizleme, düzenleme, ilerleme ve akış durumunun sahibidir.

`state` dayanıklı niyet depolama, alındılar, idempotency, kurtarma, kilitler ve tekilleştirmenin sahibidir.

## İleti terimleri

### İleti

Normalleştirilmiş ileti platformdan bağımsızdır:

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

Bu, aynı gönderim yolunun normal yanıtları, cron bildirimlerini, onay prompt'larını, görev tamamlamalarını, message-tool gönderimlerini, CLI veya Control UI gönderimlerini, alt ajan sonuçlarını ve otomasyon gönderimlerini işlemesini sağlar.

### Köken

Köken, bir iletiyi kimin ürettiğini ve OpenClaw'un o iletinin yankılarını nasıl ele alması gerektiğini açıklar. İlişkiden ayrıdır: Bir ileti bir kullanıcıya yanıt olabilir ve yine de OpenClaw-kökenli operasyonel çıktı olabilir.

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

Core, OpenClaw-kökenli çıktının anlamının sahibidir. Kanallar, bu kökenin kendi taşımalarına nasıl kodlanacağının sahibidir.

İlk gerekli kullanım Gateway hata çıktısıdır. İnsanlar "Agent failed before reply" veya "Missing API key" gibi iletileri yine görmelidir, ancak etiketlenmiş OpenClaw operasyonel çıktısı, `allowBots` etkin olduğunda paylaşılan odalarda bot tarafından yazılmış girdi olarak kabul edilmemelidir.

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

Alındılar, dayanıklı niyetten gelecekteki düzenleme, silme, önizleme sonlandırması, yinelenen bastırma ve kurtarmaya giden köprüdür.

Bir alındı tek bir platform iletisini veya çok parçalı teslimatı açıklayabilir. Parçalanmış metin, metinle birlikte medya, metinle birlikte ses ve kart yedekleri, thread oluşturma ve sonraki düzenlemeler için birincil id'yi hâlâ açığa çıkarırken tüm platform id'lerini korumalıdır.

## Alma bağlamı

Alma çıplak bir yardımcı çağrısı olmamalıdır. Core'un tekilleştirme, yönlendirme, oturum kaydı ve platform onay politikasını bilen bir bağlama ihtiyacı vardır.

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

Onay tek bir şey değildir. Alma sözleşmesi şu sinyalleri ayrı tutmalıdır:

- **Taşıma onayı:** Platform webhook'una veya soketine OpenClaw'un olay zarfını kabul ettiğini söyler. Bazı platformlar bunu gönderimden önce gerektirir.
- **Polling offset onayı:** Aynı olayın yeniden getirilmemesi için bir imleci ilerletir. Bu, kurtarılamayacak işin ötesine geçmemelidir.
- **Gelen kayıt onayı:** OpenClaw'un bir yeniden teslimatı tekilleştirmek ve yönlendirmek için yeterli gelen metadata'yı kalıcılaştırdığını doğrular.
- **Kullanıcıya görünür alındı:** İsteğe bağlı okundu/durum/yazıyor davranışı; asla dayanıklılık sınırı değildir.

`ReceiveAckPolicy` yalnızca taşıma veya polling onayını kontrol eder. Okundu alındıları veya durum tepkileri için yeniden kullanılmamalıdır.

Bot yetkilendirmesinden önce, kanal ileti kökeni metadata'sını çözebildiğinde alma, paylaşılan OpenClaw yankı politikasını uygulamalıdır:

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

Bu düşürme metin tabanlı değil, etiket tabanlıdır. Aynı görünür Gateway-hata metnine sahip ancak OpenClaw köken metadata'sı olmayan bot tarafından yazılmış bir oda iletisi, normal `allowBots` yetkilendirmesinden geçmeye devam eder.

Onay politikası açıktır:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling artık kalıcı yeniden başlatma watermark'ı için alma bağlamı onay politikasını kullanır. İzleyici grammY güncellemelerini middleware zincirine girerken hâlâ gözlemler, ancak OpenClaw başarılı gönderimden sonra yalnızca güvenli tamamlanmış güncelleme id'sini kalıcılaştırır; başarısız veya daha düşük bekleyen güncellemeleri yeniden başlatmadan sonra yeniden oynatılabilir bırakır. Telegram'ın upstream `getUpdates` getirme offset'i hâlâ polling kütüphanesi tarafından kontrol edilir, bu yüzden kalan daha derin kesim, OpenClaw'un yeniden başlatma watermark'ının ötesinde platform düzeyinde yeniden teslimata ihtiyacımız olursa tam dayanıklı bir polling kaynağıdır. Webhook platformları anında HTTP onayı gerektirebilir, ancak webhook'lar yeniden teslim edebildiği için yine de gelen tekilleştirmeye ve dayanıklı giden gönderim niyetlerine ihtiyaç duyarlar.

## Gönderme bağlamı

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

Amaç, aktarım G/Ç'sinden önce var olmalıdır. Başlangıçtan sonra ama
commit'ten önce gerçekleşen bir yeniden başlatma kurtarılabilir.

Tehlikeli sınır, platform başarısından sonra ve alındı kaydı commit edilmeden öncedir. Bir
süreç orada sonlanırsa, bağdaştırıcı yerel idempotency veya bir alındı kaydı uzlaştırma yolu
sağlamadığı sürece OpenClaw platform mesajının var olup olmadığını bilemez.
Bu denemeler körü körüne yeniden oynatılmamalı, `unknown_after_send` içinde sürdürülmelidir. Uzlaştırması
olmayan kanallar, yalnızca yinelenen görünür mesajlar o kanal ve ilişki için kabul edilebilir,
belgelenmiş bir ödünleşimse en az bir kez yeniden oynatmayı seçebilir.
Geçerli SDK uzlaştırma köprüsü, bağdaştırıcının
`reconcileUnknownSend` bildirmesini gerektirir, ardından `durableFinal.reconcileUnknownSend` ile
bilinmeyen bir girdiyi `sent`, `not_sent` veya `unresolved` olarak
sınıflandırmasını ister; yalnızca `not_sent` yeniden oynatmaya izin verir
ve çözülemeyen girdiler terminal durumda kalır ya da yalnızca
uzlaştırma denetimini yeniden dener.

Dayanıklılık ilkesi açık olmalıdır:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required`, dayanıklı amacı yazamadığında çekirdeğin kapalı hatayla sonlanması gerektiği anlamına gelir.
`best_effort`, kalıcılık kullanılamadığında devam edebilir. `disabled`, eski doğrudan gönderme
davranışını korur. Geçiş sırasında, eski sarmalayıcılar ve genel
uyumluluk yardımcıları varsayılan olarak `disabled` kullanır; bir kanalın genel bir giden bağdaştırıcısı
olduğu gerçeğinden `required` çıkarımı yapmamalıdırlar.

Gönderme bağlamları ayrıca kanal yerelindeki gönderim sonrası etkilerin sahibidir. Dayanıklı teslimat,
önceden kanalın doğrudan gönderme yoluna bağlı olan yerel davranışı atlıyorsa geçiş güvenli değildir.
Örnekler arasında öz-yankı bastırma önbellekleri, ileti dizisine katılım işaretçileri, yerel düzenleme
çapaları, model imzası işleme ve platforma özgü yinelenen korumaları bulunur. Bu etkiler, o kanal
dayanıklı genel nihai teslimatı etkinleştirmeden önce gönderme bağdaştırıcısına, işleme bağdaştırıcısına
veya adlandırılmış bir gönderme bağlamı hook'una taşınmalıdır.

Gönderme yardımcıları alındı kayıtlarını çağıranlarına kadar geri döndürmelidir. Dayanıklı
sarmalayıcılar mesaj kimliklerini yutamaz veya bir kanal teslimat sonucunu
`undefined` ile değiştiremez; arabelleğe alınmış dağıtıcılar bu kimlikleri ileti dizisi çapaları,
sonraki düzenlemeler, önizleme sonlandırması ve yinelenen bastırma için kullanır.

Fallback göndermeleri tek tek payload'lar üzerinde değil, batch'ler üzerinde çalışır. Sessiz yanıt yeniden yazımları,
medya fallback'i, kart fallback'i ve parça projeksiyonu birden fazla teslim edilebilir mesaj üretebilir;
bu nedenle bir gönderme bağlamı ya tüm projekte edilen batch'i teslim etmeli ya da neden yalnızca bir
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

Böyle bir fallback dayanıklı olduğunda, tüm projekte edilen batch tek bir dayanıklı gönderme amacı
veya başka bir atomik batch planı ile temsil edilmelidir. Her payload'ı tek tek kaydetmek yeterli değildir:
payload'lar arasında gerçekleşen bir çökme, kalan payload'lar için dayanıklı kayıt olmadan kısmi görünür
bir fallback bırakabilir. Kurtarma, hangi birimlerin zaten alındı kaydı olduğunu bilmeli ve yalnızca
eksik birimleri yeniden oynatmalı ya da bağdaştırıcı onu uzlaştırana kadar batch'i
`unknown_after_send` olarak işaretlemelidir.

## Canlı bağlam

Önizleme, düzenleme, ilerleme ve akış davranışı tek bir isteğe bağlı yaşam döngüsü olmalıdır.

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

Canlı durum, yinelenenleri kurtarmak veya bastırmak için yeterince dayanıklıdır:

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

- Telegram gönderimi ve önizlemeyi düzenleme; bayat önizleme yaşından sonra yeni nihai mesaj.
- Discord gönderimi ve önizlemeyi düzenleme; medya/hata/açık yanıt durumunda iptal.
- İleti dizisi şekline bağlı olarak Slack yerel akışı veya taslak önizlemesi.
- Mattermost taslak gönderi sonlandırması.
- Matrix taslak olay sonlandırması veya uyuşmazlıkta redaksiyon.
- Teams yerel ilerleme akışı.
- QQ Bot akışı veya birikimli fallback.

## Bağdaştırıcı yüzeyi

Genel SDK hedefi tek bir alt yol olmalıdır:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

Hedef şekil:

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

Gönderme bağdaştırıcısı:

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

Alma bağdaştırıcısı:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Ön denetim yetkilendirmesinden önce, `origin.decode` OpenClaw kökenli metadata döndürdüğünde
çekirdek paylaşılan OpenClaw yankı yüklemini çalıştırmalıdır. Alma bağdaştırıcısı bot yazarı ve oda şekli
gibi platform olgularını sağlar; bırakma kararı ve sıralama çekirdeğe aittir, böylece kanallar metin
filtrelerini yeniden uygulamaz.

Köken bağdaştırıcısı:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Çekirdek `MessageOrigin` ayarlar. Kanallar onu yalnızca yerel aktarım metadata'sına ve metadata'sından
çevirir. Slack bunu `chat.postMessage({ metadata })` ve gelen `message.metadata` ile eşler;
Matrix bunu ek olay içeriğine eşleyebilir; yerel metadata'sı olmayan kanallar, en iyi mevcut yaklaşım
bu olduğunda bir alındı kaydı/giden kayıt defteri kullanabilir.

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

## Genel SDK azaltımı

Yeni genel yüzey şu kavramsal alanları içine almalı veya kullanımdan kaldırmalıdır:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- `outbound-runtime` genel kullanımlarının çoğu
- ad hoc taslak akış yaşam döngüsü yardımcıları

Uyumluluk alt yolları sarmalayıcı olarak kalabilir, ancak yeni üçüncü taraf plugin'lerin
bunlara ihtiyacı olmamalıdır.

Paketlenmiş plugin'ler geçiş sırasında ayrılmış çalışma zamanı alt yolları üzerinden dahili yardımcı
import'larını koruyabilir. Genel dokümanlar, mevcut olduğunda plugin yazarlarını
`plugin-sdk/channel-outbound` konumuna yönlendirmelidir.

## Kanal gelen ile ilişki

`runtime.channel.inbound.*`, geçiş sırasında çalışma zamanı köprüsüdür.

Bir uyumluluk bağdaştırıcısına dönüşmelidir:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` da başlangıçta kalmalıdır:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Eski `channel.turn` çalışma zamanı yüzeyi kaldırıldı. Çalışma zamanı çağıranları
`channel.inbound.*` kullanır; kanal dokümanları ve SDK alt yolları gelen/mesaj adlarını kullanır.

## Uyumluluk koruma sınırları

Geçiş sırasında, mevcut teslimat callback'i "bu payload'ı gönder"in ötesinde yan etkilere sahip olan her kanal için
genel dayanıklı teslimat isteğe bağlıdır.

Eski giriş noktaları varsayılan olarak dayanıklı değildir:

- `channel.inbound.run` ve `dispatchChannelInboundReply`, o kanal açıkça denetlenmiş bir dayanıklı
  ilke/seçenek nesnesi sağlamadıkça kanalın teslimat callback'ini kullanır.
- `channel.inbound.runPreparedReply`, hazırlanmış dağıtıcı
  gönderme bağlamını açıkça çağırana kadar kanalın sahipliğinde kalır.
- `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` ve doğrudan DM yardımcıları gibi
  genel uyumluluk yardımcıları, çağıranın sağladığı `deliver` veya `reply` callback'inden önce asla genel
  dayanıklı teslimat enjekte etmez.

Geçiş köprüsü türleri için `durable: undefined`, "dayanıklı değil" anlamına gelir. Dayanıklı yol
yalnızca açık bir ilke/seçenek değeriyle etkinleştirilir. `durable:
false` uyumluluk yazımı olarak kalabilir, ancak uygulama her geçiş yapmamış kanalın bunu eklemesini
gerektirmemelidir.

Geçerli köprü kodu dayanıklılık kararını açık tutmalıdır:

- Dayanıklı nihai teslim, ayrıştırılmış bir durum döndürür. `handled_visible` ve
  `handled_no_send` terminaldir; `unsupported` ve `not_applicable`
  kanalın sahip olduğu teslime geri dönebilir; `failed` gönderim hatasını iletir.
- Genel dayanıklı nihai teslim, sessiz teslim, yanıt hedefini koruma,
  yerel alıntıyı koruma ve ileti gönderme kancaları gibi bağdaştırıcı
  yetenekleriyle sınırlandırılır. Eşdeğerlik eksikse, kullanıcıya görünür
  davranışı değiştiren genel bir gönderim değil, kanalın sahip olduğu teslim
  seçilmelidir.
- Kuyruk destekli dayanıklı gönderimler bir teslim amacı başvurusu sunar. Mevcut
  `pendingFinalDelivery*` oturum alanları geçiş sırasında amaç kimliğini
  taşıyabilir; son durum, dondurulmuş yanıt metni ve geçici bağlam alanları
  yerine bir `MessageSendIntent` deposudur.

Bunların tümü doğru olana kadar bir kanal için genel dayanıklı yolu
etkinleştirmeyin:

- Genel gönderim bağdaştırıcısı, eski doğrudan yolla aynı işleme ve taşıma
  davranışını yürütür.
- Yerel gönderim sonrası yan etkiler gönderim bağlamı üzerinden korunur.
- Bağdaştırıcı, tüm platform ileti kimlikleriyle birlikte alındı bilgileri veya
  teslim sonuçları döndürür.
- Hazırlanmış dağıtıcı yolları ya yeni gönderim bağlamını çağırır ya da
  dayanıklılık garantisinin dışında olarak belgelenmiş kalır.
- Geri dönüş teslimi, yalnızca ilkini değil yansıtılan her yükü işler.
- Dayanıklı geri dönüş teslimi, yansıtılan yük dizisinin tamamını tek bir
  yeniden oynatılabilir amaç veya toplu plan olarak kaydeder.

Korunması gereken somut geçiş tehlikeleri:

- iMessage izleyici teslimi, başarılı bir gönderimden sonra gönderilen iletileri
  bir yankı önbelleğine kaydeder. Dayanıklı nihai gönderimler bu önbelleği yine
  de doldurmalıdır; aksi halde OpenClaw kendi nihai yanıtlarını gelen kullanıcı
  iletileri olarak yeniden içe alabilir.
- Tlon, isteğe bağlı bir model imzası ekler ve grup yanıtlarından sonra katılım
  sağlanan ileti dizilerini kaydeder. Genel dayanıklı teslim bu etkileri
  atlamamalıdır; bunları Tlon işleme/gönderim/sonlandırma bağdaştırıcılarına
  taşıyın ya da Tlon'u kanalın sahip olduğu yolda tutun.
- Discord ve diğer hazırlanmış dağıtıcılar zaten doğrudan teslim ve önizleme
  davranışına sahiptir. Hazırlanmış dağıtıcıları nihai iletileri açıkça gönderim
  bağlamı üzerinden yönlendirmedikçe, birleştirilmiş tur dayanıklılık garantisi
  kapsamında değildirler.
- Telegram sessiz geri dönüş teslimi, yansıtılan yük dizisinin tamamını teslim
  etmelidir. Tek yük kısayolu, yansıtmadan sonra ek geri dönüş yüklerini
  düşürebilir.
- LINE, Zalo, Nostr ve diğer mevcut birleştirilmiş/yardımcı yolların
  yanıt belirteci işleme, medya vekilleme, gönderilen ileti önbellekleri,
  yükleme/durum temizliği veya yalnızca geri çağrı hedefleri olabilir. Bu
  anlamlar gönderim bağdaştırıcısı tarafından temsil edilip testlerle
  doğrulanana kadar kanalın sahip olduğu teslimde kalırlar.
- Doğrudan DM yardımcılarında, tek doğru taşıma hedefi olan bir yanıt geri
  çağrısı bulunabilir. Genel giden yol, `OriginatingTo` veya `To` üzerinden
  tahminde bulunup bu geri çağrıyı atlamamalıdır.
- OpenClaw Gateway hata çıktısı insanlar tarafından görünür kalmalıdır, ancak
  etiketlenmiş bot tarafından yazılmış oda yankıları `allowBots`
  yetkilendirmesinden önce düşürülmelidir. Kanallar bunu kısa bir acil durdurma
  önlemi dışında görünür metin önek filtreleriyle uygulamamalıdır; dayanıklılık
  sözleşmesi yapılandırılmış kaynak meta verisidir.

## Dahili depolama

Dayanıklı kuyruk, yanıt yüklerini değil ileti gönderim amaçlarını depolamalıdır.

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

Kuyruk, yeniden başlatmadan sonra aynı hesap, ileti dizisi, hedef,
biçimlendirme politikası ve medya kuralları üzerinden yeniden oynatmak için
yeterli kimliği saklamalıdır.

## Hata sınıfları

Kanal bağdaştırıcıları taşıma hatalarını kapalı kategoriler halinde sınıflandırır:

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
- `not_found` için kanal bunun güvenli olduğunu beyan ettiğinde canlı
  sonlandırmanın düzenlemeden yeni gönderime geri dönmesine izin verin.
- `conflict` için iletinin zaten var olup olmadığına karar vermek üzere alındı
  bilgisi/idempotency kurallarını kullanın.
- Bağdaştırıcının platform G/Ç'sini tamamlamış olabileceği ancak alındı bilgisi
  kaydından önce oluşan herhangi bir hata, bağdaştırıcı platform işleminin
  gerçekleşmediğini kanıtlayamadığı sürece `unknown_after_send` olur.

## Kanal eşlemesi

| Kanal           | Hedef geçiş                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Alındı ilkesi ve dayanıklı nihai gönderimler. Canlı bağdaştırıcı gönderimi ve önizleme düzenlemeyi, eski önizlemenin nihai gönderimini, konuları, alıntılı yanıt önizlemesini atlamayı, medya yedeğini ve retry-after işlemeyi üstlenir.                                                                                                                       |
| Discord         | Gönderim bağdaştırıcısı mevcut dayanıklı yük teslimini sarmalar. Canlı bağdaştırıcı taslak düzenlemeyi, ilerleme taslağını, medya/hata önizleme iptalini, yanıt hedefini korumayı ve mesaj kimliği makbuzlarını üstlenir. Paylaşılan odalarda bot tarafından yazılan Gateway hatası yankılarını denetleyin; Discord normal mesajlarda kaynak meta verisi taşıyamıyorsa giden kayıt defteri veya başka bir yerel eşdeğer kullanın. |
| Slack           | Gönderim bağdaştırıcısı normal sohbet gönderilerini işler. Canlı bağdaştırıcı, iş parçacığı şekli desteklediğinde yerel akışı, aksi halde taslak önizlemeyi seçer. Makbuzlar iş parçacığı zaman damgalarını korur. Kaynak bağdaştırıcısı OpenClaw Gateway hatalarını Slack `chat.postMessage.metadata` alanına eşler ve etiketli bot odası yankılarını `allowBots` yetkilendirmesinden önce bırakır. |
| WhatsApp        | Gönderim bağdaştırıcısı dayanıklı nihai niyetlerle metin/medya gönderimini üstlenir. Alım bağdaştırıcısı grup bahsini ve gönderen kimliğini işler. WhatsApp düzenlenebilir bir taşıma elde edene kadar canlı bağdaştırıcı olmayabilir.                                                                                                                          |
| Matrix          | Canlı bağdaştırıcı taslak olay düzenlemelerini, sonlandırmayı, redaksiyonu, şifreli medya kısıtlarını ve yanıt hedefi uyuşmazlığı yedeğini üstlenir. Alım bağdaştırıcısı şifreli olay hidrasyonunu ve tekilleştirmeyi üstlenir. Kaynak bağdaştırıcısı OpenClaw Gateway hatası kaynağını Matrix olay içeriğine kodlamalı ve yapılandırılmış bot odası yankılarını `allowBots` işlemeden önce bırakmalıdır. |
| Mattermost      | Canlı bağdaştırıcı tek bir taslak gönderiyi, ilerleme/araç katlamayı, yerinde sonlandırmayı ve yeni gönderim yedeğini üstlenir.                                                                                                                                                                                                                                |
| Microsoft Teams | Canlı bağdaştırıcı yerel ilerleme ve blok akışı davranışını üstlenir. Gönderim bağdaştırıcısı etkinlikleri ve ek/kart makbuzlarını üstlenir.                                                                                                                                                                                                                    |
| Feishu          | İşleme bağdaştırıcısı metin/kart/ham işlemeyi üstlenir. Canlı bağdaştırıcı akış kartlarını ve yinelenen nihai bastırmayı üstlenir. Gönderim bağdaştırıcısı yorumları, konu oturumlarını, medyayı ve ses bastırmayı üstlenir.                                                                                                                                     |
| QQ Bot          | Canlı bağdaştırıcı C2C akışını, biriktirici zaman aşımını ve yedek nihai gönderimi üstlenir. İşleme bağdaştırıcısı medya etiketlerini ve metin-olarak-ses davranışını üstlenir.                                                                                                                                                                                |
| Signal          | Basit alım ve gönderim bağdaştırıcısı. signal-cli güvenilir düzenleme desteği eklemedikçe canlı bağdaştırıcı yoktur.                                                                                                                                                                                                                                          |
| iMessage        | Basit alım ve gönderim bağdaştırıcısı. Dayanıklı nihai gönderimler monitör teslimini atlayabilmeden önce iMessage gönderimi monitör yankı önbelleği doldurmasını korumalıdır.                                                                                                                                                                                  |
| Google Chat     | İş parçacığı ilişkisi alanlara ve iş parçacığı kimliklerine eşlenmiş basit alım ve gönderim bağdaştırıcısı. Etiketli OpenClaw Gateway hatası yankıları için `allowBots=true` oda davranışını denetleyin.                                                                                                                                                       |
| LINE            | Yanıt belirteci kısıtları hedef/ilişki kabiliyeti olarak modellenmiş basit alım ve gönderim bağdaştırıcısı.                                                                                                                                                                                                                                                     |
| Nextcloud Talk  | SDK alım köprüsü ve gönderim bağdaştırıcısı.                                                                                                                                                                                                                                                                                                                   |
| IRC             | Basit alım ve gönderim bağdaştırıcısı, dayanıklı düzenleme makbuzu yok.                                                                                                                                                                                                                                                                                         |
| Nostr           | Şifreli DM'ler için alım ve gönderim bağdaştırıcısı; makbuzlar olay kimlikleridir.                                                                                                                                                                                                                                                                              |
| QA Kanalı       | Alım, gönderim, canlı, yeniden deneme ve kurtarma davranışı için sözleşme testi bağdaştırıcısı.                                                                                                                                                                                                                                                                  |
| Synology Chat   | Basit alım ve gönderim bağdaştırıcısı.                                                                                                                                                                                                                                                                                                                         |
| Tlon            | Genel dayanıklı nihai teslim etkinleştirilmeden önce gönderim bağdaştırıcısı model imzası işlemeyi ve katılınan iş parçacığı takibini korumalıdır.                                                                                                                                                                                                              |
| Twitch          | Hız sınırı sınıflandırmalı basit alım ve gönderim bağdaştırıcısı.                                                                                                                                                                                                                                                                                               |
| Zalo            | Basit alım ve gönderim bağdaştırıcısı.                                                                                                                                                                                                                                                                                                                         |
| Zalo Personal   | Basit alım ve gönderim bağdaştırıcısı.                                                                                                                                                                                                                                                                                                                         |

## Geçiş planı

### Aşama 1: Dahili Mesaj Alanı

- Mesajlar, hedefler, ilişkiler,
  kaynaklar, makbuzlar, kabiliyetler, dayanıklı niyetler, alım bağlamı, gönderim
  bağlamı, canlı bağlam ve hata sınıfları için `src/channels/message/*` türleri ekleyin.
- Geçerli yanıt teslimi tarafından kullanılan geçiş köprüsü yük türüne
  `origin?: MessageOrigin` ekleyin, ardından refaktör yanıt yüklerini değiştirdikçe
  bu alanı `ChannelMessage` ve işlenmiş mesaj türlerine taşıyın.
- Bağdaştırıcılar ve testler şekli kanıtlayana kadar bunu dahili tutun.
- Durum geçişleri ve serileştirme için saf birim testleri ekleyin.

### Aşama 2: Dayanıklı Gönderim Çekirdeği

- Mevcut giden kuyruğunu yanıt yükü dayanıklılığından dayanıklı
  mesaj gönderme niyetlerine taşıyın.
- Dayanıklı gönderim niyetinin yalnızca tek bir yanıt yükü değil,
  projeksiyonu yapılmış bir yük dizisi veya toplu plan taşımasına izin verin.
- Uyumluluk dönüştürmesiyle geçerli kuyruk kurtarma davranışını koruyun.
- `deliverOutboundPayloads` işlevinin `messages.send` çağırmasını sağlayın.
- Bağdaştırıcı yeniden oynatma güvenliğini bildirdikten sonra, yeni mesaj yaşam döngüsünde
  dayanıklı niyet yazılamadığında nihai gönderim dayanıklılığını varsayılan yapın ve kapalı şekilde hata verin.
  Mevcut gelen çalıştırıcı ve SDK uyumluluk yolları bu aşamada varsayılan olarak doğrudan gönderimde kalır.
- Makbuzları tutarlı şekilde kaydedin.
- Dayanıklı gönderimi terminal bir yan etki gibi ele almak yerine makbuzları ve teslim sonuçlarını
  özgün dağıtıcı çağıranına döndürün.
- Kurtarma, yeniden oynatma ve parçalı gönderimler OpenClaw operasyonel kökenini korusun diye
  mesaj kaynağını dayanıklı gönderim niyetleri üzerinden kalıcı hale getirin.

### Aşama 3: Kanal Gelen Köprüsü

- `channel.inbound.run` ve `dispatchChannelInboundReply` işlevlerini
  `messages.receive` ve `messages.send` üzerine yeniden uygulayın.
- Geçerli olgu türlerini kararlı tutun.
- Varsayılan olarak eski davranışı koruyun. Birleştirilmiş dönüş kanalı yalnızca
  bağdaştırıcısı yeniden oynatma açısından güvenli bir dayanıklılık ilkesiyle açıkça katıldığında dayanıklı hale gelir.
- Yerel düzenlemeleri sonlandıran ve henüz güvenli şekilde yeniden oynatamayan yollar için
  uyumluluk kaçış yolu olarak `durable: false` değerini koruyun, ancak geçirilmemiş kanalları korumak için
  `false` işaretlerine güvenmeyin.
- Birleştirilmiş dönüş dayanıklılığını yalnızca yeni mesaj yaşam döngüsünde,
  kanal eşlemesi genel gönderim yolunun eski kanal teslim semantiğini koruduğunu kanıtladıktan sonra varsayılan yapın.

### Aşama 4: Hazırlanmış Dağıtıcı Köprüsü

- `deliverDurableInboundReplyPayload` yerine bir gönderme bağlamı köprüsü kullanın.
- Eski yardımcıyı bir sarmalayıcı olarak tutun.
- Önce Telegram, WhatsApp, Slack, Signal, iMessage ve Discord'u taşıyın çünkü
  bunlarda zaten durable-final çalışması veya daha basit gönderme yolları var.
- Her hazırlanmış dispatcher'ı, gönderme bağlamına açıkça dahil olana kadar
  kapsam dışı kabul edin. Dokümantasyon ve changelog girdileri, tüm
  otomatik final yanıtlarını iddia etmek yerine "birleştirilmiş kanal turları"
  demeli veya taşınan kanal yollarını adlandırmalıdır.
- `recordInboundSessionAndDispatchReply`, doğrudan DM yardımcıları ve benzer
  herkese açık uyumluluk yardımcılarını davranışı koruyacak şekilde tutun.
  Bunlar daha sonra açık bir gönderme bağlamı katılımı sunabilir, ancak
  çağıranın sahip olduğu teslim callback'inden önce otomatik olarak genel
  durable teslimat denememelidir.

### Aşama 5: Birleşik Canlı Yaşam Döngüsü

- `messages.live` öğesini iki kanıt adapter'ı ile oluşturun:
  - Gönderme, düzenleme ve eski final gönderimi için Telegram.
  - Taslak finalizasyonu ve redaction fallback için Matrix.
- Sonra Discord, Slack, Mattermost, Teams, QQ Bot ve Feishu'yu taşıyın.
- Yinelenen önizleme finalizasyon kodunu yalnızca her kanalın eşdeğerlik
  testleri olduktan sonra silin.

### Aşama 6: Herkese Açık SDK

- `openclaw/plugin-sdk/channel-outbound` ekleyin.
- Bunu tercih edilen kanal Plugin API'si olarak belgeleyin.
- Paket export'larını, entrypoint envanterini, üretilen API baseline'larını ve
  Plugin SDK dokümanlarını güncelleyin.
- Kanal-outbound SDK yüzeyine `MessageOrigin`, origin encode/decode hook'ları
  ve paylaşılan `shouldDropOpenClawEcho` predicate'ini dahil edin.
- Eski alt yollar için uyumluluk sarmalayıcılarını tutun.
- Paketlenmiş Plugin'ler taşındıktan sonra yanıta göre adlandırılmış SDK
  yardımcılarını dokümanlarda kullanımdan kaldırılmış olarak işaretleyin.

### Aşama 7: Tüm Göndericiler

Yanıt olmayan tüm outbound üreticileri `messages.send` üzerine taşıyın:

- Cron ve Heartbeat bildirimleri
- görev tamamlamaları
- hook sonuçları
- onay istemleri ve onay sonuçları
- mesaj aracı gönderimleri
- alt ajan tamamlama duyuruları
- açık CLI veya Control UI gönderimleri
- otomasyon/broadcast yolları

Modelin "ajan yanıtları" olmaktan çıkıp "OpenClaw mesaj gönderir" haline
geldiği yer burasıdır.

### Aşama 8: Tur Adlı Uyumluluğu Kaldırma

- Uyumluluk penceresi olarak inbound/message adlı sarmalayıcıları tutun.
- Migration notlarını yayımlayın.
- Eski import'lara karşı Plugin SDK uyumluluk testlerini çalıştırın.
- Eski dahili yardımcıları yalnızca hiçbir paketlenmiş Plugin onlara ihtiyaç
  duymadığında ve üçüncü taraf sözleşmelerinin kararlı bir alternatifi
  olduğunda kaldırın veya gizleyin.

## Test planı

Birim testleri:

- Durable gönderme intent serileştirmesi ve kurtarma.
- Idempotency key yeniden kullanımı ve yinelenenlerin bastırılması.
- Receipt commit ve replay atlama.
- Bir adapter uzlaştırmayı desteklediğinde replay öncesi uzlaştıran
  `unknown_after_send` kurtarması.
- Hata sınıflandırma politikası.
- Alma ack politikası sıralaması.
- Yanıt, followup, sistem ve broadcast gönderimleri için ilişki eşlemesi.
- Gateway hatası origin factory'si ve `shouldDropOpenClawEcho` predicate'i.
- Payload normalizasyonu, chunking, durable kuyruk serileştirmesi ve kurtarma
  boyunca origin korunması.

Entegrasyon testleri:

- `channel.inbound.run` basit adapter'ı hâlâ kaydeder ve gönderir.
- Eski birleştirilmiş olay teslimatı, kanal açıkça dahil olmadıkça durable
  hale gelmez.
- `channel.inbound.runPreparedReply` köprüsü hâlâ kaydeder ve finalleştirir.
- Herkese açık uyumluluk yardımcıları varsayılan olarak çağırana ait teslim
  callback'lerini çağırır ve bu callback'lerden önce genel gönderim yapmaz.
- Durable fallback teslimatı, yeniden başlatmadan sonra tüm projekte edilmiş
  payload dizisini replay eder ve erken bir crash sonrasında sonraki
  payload'ları kaydedilmemiş bırakamaz.
- Durable birleştirilmiş olay teslimatı, platform mesaj kimliklerini buffered
  dispatcher'a döndürür.
- Özel teslim hook'ları, durable teslimat devre dışı veya kullanılamaz
  olduğunda hâlâ platform mesaj kimliklerini döndürür.
- Final yanıt, assistant tamamlaması ile platform gönderimi arasındaki yeniden
  başlatmadan sağ çıkar.
- Önizleme taslağı, izin verildiğinde yerinde finalleştirilir.
- Medya/hata/yanıt hedefi uyumsuzluğu normal teslimat gerektirdiğinde önizleme
  taslağı iptal edilir veya redaction uygulanır.
- Blok streaming ve önizleme streaming aynı metni ikisi birden teslim etmez.
- Erken stream edilen medya final teslimatta yinelenmez.

Kanal testleri:

- Telegram konu yanıtında polling ack, alma bağlamının güvenli tamamlanmış
  watermark'ına kadar geciktirilir.
- Kabul edilmiş ancak teslim edilmemiş güncellemeler için Telegram polling
  kurtarması, kalıcı güvenli-tamamlanmış offset modeliyle kapsanır.
- Telegram eski önizleme taze final gönderir ve önizlemeyi temizler.
- Telegram sessiz fallback her projekte edilmiş fallback payload'unu gönderir.
- Telegram sessiz fallback dayanıklılığı, döngü iterasyonu başına tek
  payload'lu durable intent değil, tüm projekte edilmiş fallback dizisini
  atomik olarak kaydeder.
- Medya/hata/açık yanıt durumunda Discord önizleme iptali.
- Discord final-yanıt dayanıklılığı dokümanlarda veya changelog'da iddia
  edilmeden önce Discord hazırlanmış dispatcher final'ları gönderme bağlamı
  üzerinden yönlendirilir.
- iMessage durable final gönderimleri monitor sent-message echo cache'ini
  doldurur.
- LINE, Zalo ve Nostr eski teslimat yolları, adapter eşdeğerlik testleri
  var olana kadar genel durable gönderim tarafından bypass edilmez.
- Doğrudan DM/Nostr callback teslimatı, eksiksiz bir mesaj hedefine ve
  replay güvenli gönderme adapter'ına açıkça taşınmadıkça yetkili kalır.
- Slack etiketli OpenClaw gateway hata mesajları outbound olarak görünür
  kalır, etiketli bot-room echo'ları `allowBots` öncesinde düşer ve aynı
  görünür metne sahip etiketsiz bot mesajları yine normal bot yetkilendirmesini
  izler.
- Üst düzey DM'lerde Slack native stream fallback'i taslak önizlemeye geçer.
- Matrix önizleme finalizasyonu ve redaction fallback.
- Yapılandırılmış bot hesaplarından gelen Matrix etiketli OpenClaw
  gateway-failure oda echo'ları `allowBots` işlemeden önce düşer.
- Discord ve Google Chat paylaşımlı oda gateway-failure cascade denetimleri,
  orada genel koruma iddia edilmeden önce `allowBots` modlarını kapsar.
- Mattermost taslak finalizasyonu ve taze gönderim fallback'i.
- Teams native ilerleme finalizasyonu.
- Feishu yinelenen final bastırma.
- QQ Bot accumulator timeout fallback.
- Tlon durable final gönderimleri model-signature rendering'i ve katılım
  sağlanan thread takibini korur.
- WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo ve Zalo Personal basit durable final
  gönderimleri.

Doğrulama:

- Geliştirme sırasında hedefli Vitest dosyaları.
- Tüm değişen yüzey için Testbox içinde `pnpm check:changed`.
- Tam refactor'ı land etmeden önce veya herkese açık SDK/export
  değişikliklerinden sonra Testbox içinde daha geniş `pnpm check`.
- Uyumluluk sarmalayıcılarını kaldırmadan önce en az bir düzenleme yetenekli
  kanal ve bir basit yalnızca gönderim kanalı için canlı veya qa-channel smoke.

## Açık sorular

- Telegram'ın sonunda grammY runner kaynağını, yalnızca OpenClaw'ın kalıcı
  yeniden başlatma watermark'ını değil, platform düzeyi yeniden teslimatı
  kontrol edebilen tamamen durable bir polling kaynağıyla değiştirip
  değiştirmemesi.
- Durable canlı önizleme durumunun final gönderme intent'iyle aynı kuyruk
  kaydında mı yoksa kardeş bir live-state store'da mı saklanması gerektiği.
- `plugin-sdk/channel-outbound` yayımlandıktan sonra uyumluluk sarmalayıcılarının
  dokümanlarda ne kadar süre kalacağı.
- Üçüncü taraf Plugin'lerin receive adapter'larını doğrudan mı uygulaması
  gerektiği yoksa yalnızca `defineChannelMessageAdapter` üzerinden
  normalize/send/live hook'ları mı sağlaması gerektiği.
- Hangi receipt alanlarının herkese açık SDK'da gösterilmesinin güvenli olduğu
  ve hangilerinin dahili runtime durumu olarak kalacağı.
- Self-echo cache'leri ve participated-thread marker'ları gibi yan etkilerin
  gönderme bağlamı hook'ları, adapter'a ait finalize adımları veya receipt
  subscriber'ları olarak mı modellenmesi gerektiği.
- Hangi kanalların native origin metadata'sına sahip olduğu, hangilerinin
  kalıcı outbound registry'lerine ihtiyaç duyduğu ve hangilerinin güvenilir
  cross-bot echo bastırma sunamayacağı.

## Kabul kriterleri

- Her paketlenmiş mesaj kanalı final görünür çıktıyı `messages.send` üzerinden
  gönderir.
- Her inbound mesaj kanalı `messages.receive` veya belgelenmiş bir uyumluluk
  sarmalayıcısı üzerinden girer.
- Her önizleme/düzenleme/stream kanalı taslak durumu ve finalizasyon için
  `messages.live` kullanır.
- `channel.inbound` yalnızca bir sarmalayıcıdır.
- Yanıta göre adlandırılmış SDK yardımcıları önerilen yol değil, uyumluluk
  export'larıdır.
- Durable kurtarma, yeniden başlatmadan sonra bekleyen final gönderimleri final
  yanıtı kaybetmeden veya zaten commit edilmiş gönderimleri çoğaltmadan replay
  edebilir; platform sonucu bilinmeyen gönderimler replay öncesi uzlaştırılır
  veya ilgili adapter için en az bir kez olarak belgelenir.
- Durable final gönderimleri, çağıran açıkça belgelenmiş non-durable modu
  seçmediği sürece durable intent yazılamadığında kapalı hata verir.
- Eski SDK uyumluluk yardımcıları varsayılan olarak doğrudan kanalın sahip
  olduğu teslimatı kullanır; genel durable gönderim yalnızca açık katılımdır.
- Receipt'ler, çok parçalı teslimatlar için tüm platform mesaj kimliklerini ve
  threading/düzenleme kolaylığı için birincil kimliği korur.
- Durable sarmalayıcılar, doğrudan teslim callback'lerini değiştirmeden önce
  kanal yerel yan etkilerini korur.
- Hazırlanmış dispatcher'lar, final teslimat yolları açıkça gönderme bağlamını
  kullanana kadar durable sayılmaz.
- Fallback teslimatı her projekte edilmiş payload'u işler.
- Durable fallback teslimatı her projekte edilmiş payload'u tek bir replay
  edilebilir intent veya batch plan içinde kaydeder.
- OpenClaw kaynaklı gateway hata çıktısı insanlar tarafından görünürdür, ancak
  etiketli bot-authored oda echo'ları origin sözleşmesi desteği beyan eden
  kanallarda bot yetkilendirmesinden önce düşürülür.
- Dokümanlar send, receive, live, state, receipt'ler, ilişkiler, hata politikası,
  migration ve test kapsamını açıklar.

## İlgili

- [Mesajlar](/tr/concepts/messages)
- [Streaming ve chunking](/tr/concepts/streaming)
- [İlerleme taslakları](/tr/concepts/progress-drafts)
- [Retry politikası](/tr/concepts/retry)
- [Kanal inbound API'si](/tr/plugins/sdk-channel-inbound)
