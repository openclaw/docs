---
read_when:
    - بازآرایی رفتار ارسال یا دریافت کانال
    - تغییر نوبت کانال، ارسال پاسخ، صف خروجی، پخش جریانی پیش‌نمایش، یا APIهای پیام SDK Plugin
    - طراحی یک Plugin کانال جدید که به ارسال‌های پایدار، رسیدها، پیش‌نمایش‌ها، ویرایش‌ها یا تلاش‌های مجدد نیاز دارد
summary: برنامهٔ طراحی برای چرخهٔ عمر یکپارچه و پایدارِ دریافت، ارسال، پیش‌نمایش، ویرایش و پخش جریانی پیام
title: بازآرایی چرخهٔ حیات پیام
x-i18n:
    generated_at: "2026-05-06T09:11:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

این صفحه طراحی هدف برای جایگزینی helperهای پراکنده مربوط به نوبت کانال، dispatch پاسخ،
streaming پیش‌نمایش، و تحویل خروجی با یک چرخه عمر پیام پایدار است.

نسخه کوتاه:

- primitiveهای core باید **receive** و **send** باشند، نه **reply**.
- پاسخ فقط یک رابطه روی یک پیام خروجی است.
- نوبت یک ابزار کمکی برای پردازش ورودی است، نه مالک تحویل.
- ارسال باید مبتنی بر context باشد: `begin`، render، preview یا stream، ارسال نهایی،
  commit، fail.
- دریافت نیز باید مبتنی بر context باشد: normalize، dedupe، route، record،
  dispatch، ack پلتفرم، fail.
- SDK عمومی Plugin باید به یک سطح کوچک برای پیام کانال خلاصه شود.

## مشکلات

پشته فعلی کانال از چند نیاز محلی معتبر رشد کرده است:

- adapterهای ورودی ساده از `runtime.channel.turn.run` استفاده می‌کنند.
- adapterهای غنی از `runtime.channel.turn.runPrepared` استفاده می‌کنند.
- helperهای قدیمی از `dispatchInboundReplyWithBase`،
  `recordInboundSessionAndDispatchReply`، helperهای payload پاسخ، chunking پاسخ،
  referenceهای پاسخ، و helperهای runtime خروجی استفاده می‌کنند.
- streaming پیش‌نمایش در dispatcherهای مخصوص کانال زندگی می‌کند.
- پایداری تحویل نهایی پیرامون مسیرهای موجود payload پاسخ اضافه می‌شود.

این شکل باگ‌های محلی را رفع می‌کند، اما OpenClaw را با مفهوم‌های عمومی بیش از حد
و جاهای بیش از حدی رها می‌کند که semantics تحویل می‌توانند در آن‌ها منحرف شوند.

مسئله قابلیت اطمینانی که این را آشکار کرد این است:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

invariant هدف از Telegram گسترده‌تر است: وقتی core تصمیم می‌گیرد یک پیام خروجی
قابل مشاهده باید وجود داشته باشد، intent باید پیش از تلاش برای ارسال پلتفرم
پایدار شود، و receipt پلتفرم باید پس از موفقیت commit شود.
این به OpenClaw بازیابی at-least-once می‌دهد. رفتار exactly-once فقط
برای adapterهایی وجود دارد که می‌توانند idempotency بومی را اثبات کنند یا یک
تلاش unknown-after-send را پیش از replay با وضعیت پلتفرم reconcile کنند.

این وضعیت نهایی این refactor است، نه توصیف همه مسیرهای فعلی.
در طول migration، helperهای خروجی موجود همچنان می‌توانند وقتی نوشتن‌های صف
best-effort شکست می‌خورند به ارسال مستقیم fall through کنند. refactor فقط
وقتی کامل است که ارسال‌های نهایی پایدار fail closed شوند یا با یک policy
غیرپایدار مستند، صراحتا opt out کنند.

## اهداف

- یک چرخه عمر core برای همه مسیرهای دریافت و ارسال پیام کانال.
- ارسال‌های نهایی پایدار به صورت پیش‌فرض در چرخه عمر جدید پیام، پس از اینکه adapter
  رفتار replay-safe را اعلام کند.
- semantics مشترک برای پیش‌نمایش، edit، stream، finalization، retry، recovery، و receipt.
- یک سطح کوچک SDK Plugin که Pluginهای شخص ثالث بتوانند آن را یاد بگیرند و نگه‌داری کنند.
- سازگاری برای فراخوان‌های موجود `channel.turn` در طول migration.
- extension pointهای روشن برای قابلیت‌های جدید کانال.
- بدون branchهای مخصوص پلتفرم در core.
- بدون پیام‌های کانالی token-delta. streaming کانال همچنان تحویل preview،
  edit، append، یا completed block پیام است.
- metadata ساختاریافته با origin از OpenClaw برای خروجی عملیاتی/سیستمی تا failureهای
  قابل مشاهده Gateway به عنوان prompt تازه دوباره وارد اتاق‌های مشترک bot-enabled نشوند.

## غیرهدف‌ها

- در فاز اول `runtime.channel.turn.*` را حذف نکنید.
- هر کانال را مجبور به همان رفتار transport بومی نکنید.
- core را با topicهای Telegram، streamهای بومی Slack، redactionهای Matrix،
  کارت‌های Feishu، صدای QQ، یا activityهای Teams آشنا نکنید.
- همه helperهای داخلی migration را به عنوان API پایدار SDK منتشر نکنید.
- retryها را وادار نکنید operationهای پلتفرمی غیر-idempotent کامل‌شده را replay کنند.

## مدل مرجع

Vercel Chat یک مدل ذهنی عمومی خوب دارد:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- methodهای adapter مانند `postMessage`، `editMessage`، `deleteMessage`،
  `stream`، `startTyping`، و fetchهای history
- یک adapter وضعیت برای dedupe، lockها، queueها، و persistence

OpenClaw باید واژگان را وام بگیرد، نه سطح را کپی کند.

آنچه OpenClaw فراتر از آن مدل نیاز دارد:

- intentهای ارسال خروجی پایدار پیش از فراخوانی‌های مستقیم transport.
- contextهای ارسال صریح با begin، commit، و fail.
- contextهای دریافت که policy مربوط به ack پلتفرم را می‌دانند.
- receiptهایی که از restart جان سالم به در می‌برند و می‌توانند edit، delete، recovery، و
  suppression تکراری را پیش ببرند.
- یک SDK عمومی کوچک‌تر. Pluginهای bundled می‌توانند از helperهای داخلی runtime استفاده کنند، اما
  Pluginهای شخص ثالث باید یک API پیام منسجم ببینند.
- رفتار مخصوص agent: sessionها، transcriptها، block streaming، progress ابزار،
  approvalها، media directiveها، پاسخ‌های silent، و history mention گروهی.

promiseهای سبک `thread.post()` برای OpenClaw کافی نیستند. آن‌ها مرز transaction
را پنهان می‌کنند که تصمیم می‌گیرد آیا یک ارسال قابل بازیابی است یا نه.

## مدل core

domain جدید باید زیر یک namespace داخلی core مانند
`src/channels/message/*` زندگی کند.

چهار مفهوم دارد:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` مالک چرخه عمر ورودی است.

`send` مالک چرخه عمر خروجی است.

`live` مالک preview، edit، progress، و وضعیت stream است.

`state` مالک storage پایدار intent، receiptها، idempotency، recovery، lockها، و
dedupe است.

## اصطلاحات پیام

### پیام

یک پیام normalize‌شده platform-neutral است:

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

### هدف

target توصیف می‌کند پیام کجا زندگی می‌کند:

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

### رابطه

پاسخ یک relation است، نه یک root API:

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

این اجازه می‌دهد همان مسیر ارسال، پاسخ‌های عادی، اعلان‌های Cron، promptهای approval،
تکمیل task، ارسال‌های message-tool، ارسال‌های CLI یا Control UI، نتیجه‌های subagent،
و ارسال‌های automation را مدیریت کند.

### Origin

Origin توصیف می‌کند چه کسی یک پیام را تولید کرده و OpenClaw باید echoهای آن پیام را چگونه
رفتار کند. از relation جداست: یک پیام می‌تواند پاسخ به کاربر باشد
و همچنان خروجی عملیاتی با origin از OpenClaw باشد.

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

core مالک معنای خروجی با origin از OpenClaw است. کانال‌ها مالک این هستند که آن
origin چگونه در transport آن‌ها encode شود.

اولین کاربرد لازم، خروجی failure در Gateway است. انسان‌ها همچنان باید پیام‌هایی مانند
"Agent failed before reply" یا "Missing API key" را ببینند، اما خروجی عملیاتی
tagشده OpenClaw نباید وقتی `allowBots` فعال است، در اتاق‌های مشترک به عنوان ورودی
bot-authored پذیرفته شود.

### Receipt

Receiptها first-class هستند:

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

Receiptها پل بین intent پایدار و edit، delete، finalization پیش‌نمایش،
suppression تکراری، و recovery آینده هستند.

یک receipt می‌تواند یک پیام پلتفرم یا یک تحویل چندبخشی را توصیف کند. متن chunkشده،
media به‌همراه متن، voice به‌همراه متن، و fallbackهای card باید همه idهای پلتفرم را حفظ کنند
و هم‌زمان یک id اصلی برای threading و editهای بعدی ارائه دهند.

## context دریافت

دریافت نباید یک فراخوانی helper خام باشد. core به contextی نیاز دارد که
dedupe، routing، ضبط session، و policy مربوط به ack پلتفرم را بداند.

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

جریان دریافت:

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

Ack یک چیز واحد نیست. contract دریافت باید این signalها را جدا نگه دارد:

- **Transport ack:** به webhook یا socket پلتفرم می‌گوید که OpenClaw envelope رویداد را پذیرفته است.
  برخی پلتفرم‌ها این را پیش از dispatch لازم دارند.
- **Polling offset ack:** یک cursor را جلو می‌برد تا همان رویداد دوباره fetch نشود.
  این نباید از کاری که قابل بازیابی نیست جلوتر برود.
- **Inbound record ack:** تایید می‌کند OpenClaw metadata ورودی کافی را برای
  dedupe و route کردن redelivery پایدار کرده است.
- **User-visible receipt:** رفتار اختیاری read/status/typing؛ هرگز یک مرز
  durability نیست.

`ReceiveAckPolicy` فقط acknowledgement مربوط به transport یا polling را کنترل می‌کند. نباید
برای read receiptها یا reactionهای status دوباره استفاده شود.

پیش از authorization ربات، receive باید policy مشترک echo در OpenClaw را
وقتی کانال می‌تواند metadata مربوط به origin پیام را decode کند اعمال کند:

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

این drop مبتنی بر tag است، نه مبتنی بر متن. یک پیام room با نویسنده bot که همان
متن قابل مشاهده gateway-failure را دارد اما metadata origin از OpenClaw ندارد، همچنان
از authorization عادی `allowBots` عبور می‌کند.

Policy مربوط به ack صریح است:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

اکنون polling در Telegram از policy ack در receive-context برای watermark پایدار
restart خود استفاده می‌کند. tracker همچنان updateهای grammY را هنگام ورود به
زنجیره middleware مشاهده می‌کند، اما OpenClaw فقط id مربوط به update کامل‌شده ایمن را پس از
dispatch موفق پایدار می‌کند و updateهای failed یا pending پایین‌تر را پس از restart قابل replay
باقی می‌گذارد. offset مربوط به fetch در `getUpdates` بالادستی Telegram همچنان توسط
کتابخانه polling کنترل می‌شود، بنابراین remaining deeper cut یک منبع polling کاملا پایدار است
اگر به redelivery در سطح پلتفرم فراتر از watermark restart در OpenClaw نیاز داشته باشیم.
پلتفرم‌های Webhook ممکن است به ack فوری HTTP نیاز داشته باشند، اما همچنان به
dedupe ورودی و intentهای ارسال خروجی پایدار نیاز دارند زیرا webhookها می‌توانند redeliver کنند.

## context ارسال

ارسال نیز مبتنی بر context است:

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

هماهنگ‌سازی ترجیحی:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

این کمک‌کننده به این گسترش می‌یابد:

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

قصد باید پیش از I/O ترابری وجود داشته باشد. راه‌اندازی دوباره پس از آغاز اما پیش از
ثبت، قابل بازیابی است.

مرز خطرناک پس از موفقیت پلتفرم و پیش از ثبت رسید است. اگر یک
فرایند در آنجا از کار بیفتد، OpenClaw نمی‌تواند بداند پیام پلتفرم وجود دارد یا نه،
مگر اینکه آداپتور idempotency بومی یا مسیر سازگارسازی رسید فراهم کند.
آن تلاش‌ها باید در `unknown_after_send` از سر گرفته شوند، نه اینکه کورکورانه دوباره پخش شوند. کانال‌هایی
که سازگارسازی ندارند فقط زمانی می‌توانند بازپخش at-least-once را انتخاب کنند که پیام‌های
تکراری قابل مشاهده برای آن کانال و رابطه، یک بده‌بستان قابل قبول و مستند باشد.
پل سازگارسازی SDK فعلی از آداپتور می‌خواهد
`reconcileUnknownSend` را اعلام کند، سپس از `durableFinal.reconcileUnknownSend` می‌خواهد
یک ورودی ناشناخته را به‌صورت `sent`، `not_sent` یا `unresolved` طبقه‌بندی کند؛ فقط `not_sent`
اجازه بازپخش می‌دهد، و ورودی‌های حل‌نشده در وضعیت پایانی می‌مانند یا فقط
بررسی سازگارسازی را دوباره تلاش می‌کنند.

سیاست پایداری باید صریح باشد:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` یعنی هسته وقتی نمی‌تواند قصد پایدار را بنویسد باید به‌صورت fail closed شکست بخورد.
`best_effort` وقتی ماندگاری در دسترس نیست می‌تواند عبور کند. `disabled`
رفتار ارسال مستقیم قدیمی را نگه می‌دارد. در طول مهاجرت، پوشش‌دهنده‌های قدیمی و کمک‌کننده‌های
سازگاری عمومی به‌طور پیش‌فرض `disabled` هستند؛ آن‌ها نباید از این واقعیت که یک کانال
آداپتور خروجی عمومی دارد، `required` را استنتاج کنند.

زمینه‌های ارسال همچنین مالک اثرهای پس از ارسال محلیِ کانال هستند. مهاجرت زمانی ایمن نیست
که تحویل پایدار، رفتار محلی‌ای را که قبلا به مسیر ارسال مستقیم کانال وصل بود دور بزند.
نمونه‌ها شامل کش‌های سرکوب پژواک خود، نشانگرهای مشارکت در رشته،
لنگرهای ویرایش بومی، رندر امضای مدل، و محافظ‌های تکرار خاص پلتفرم هستند.
این اثرها باید یا به آداپتور ارسال، آداپتور رندر، یا یک hook نام‌دار زمینه ارسال منتقل شوند
پیش از آنکه آن کانال بتواند تحویل نهایی عمومی پایدار را فعال کند.

کمک‌کننده‌های ارسال باید رسیدها را تا انتها به فراخواننده خود برگردانند. پوشش‌دهنده‌های پایدار
نمی‌توانند شناسه‌های پیام را ببلعند یا نتیجه تحویل کانال را با
`undefined` جایگزین کنند؛ dispatcherهای بافرشده از آن شناسه‌ها برای لنگرهای رشته، ویرایش‌های بعدی،
نهایی‌سازی پیش‌نمایش، و سرکوب تکرار استفاده می‌کنند.

ارسال‌های fallback روی دسته‌ها عمل می‌کنند، نه payloadهای تکی. بازنویسی‌های silent-reply،
fallback رسانه، fallback کارت، و فرافکنی قطعه‌ها همگی می‌توانند بیش از
یک پیام قابل تحویل تولید کنند، بنابراین یک زمینه ارسال باید یا کل
دسته فرافکنی‌شده را تحویل دهد یا صریحا مستند کند چرا فقط یک payload معتبر است.

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

وقتی چنین fallbackای پایدار است، کل دسته فرافکنی‌شده باید با
یک قصد ارسال پایدار یا برنامه دسته اتمیک دیگری نمایش داده شود. ثبت هر payload
به‌صورت یکی‌یکی کافی نیست: خرابی بین payloadها می‌تواند یک fallback قابل مشاهده جزئی
را بدون رکورد پایدار برای payloadهای باقی‌مانده رها کند. بازیابی باید بداند
کدام واحدها از قبل رسید دارند و یا فقط واحدهای گمشده را بازپخش کند یا
دسته را تا زمانی که آداپتور آن را سازگار کند، `unknown_after_send` علامت‌گذاری کند.

## زمینه زنده

رفتار پیش‌نمایش، ویرایش، پیشرفت، و stream باید یک چرخه عمر opt-in واحد باشد.

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

وضعیت زنده به‌اندازه‌ای پایدار است که تکراری‌ها را بازیابی یا سرکوب کند:

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

این باید رفتار فعلی را پوشش دهد:

- ارسال Telegram به‌همراه پیش‌نمایش ویرایش، با نسخه نهایی تازه پس از سن پیش‌نمایش stale.
- ارسال Discord به‌همراه پیش‌نمایش ویرایش، لغو در رسانه/خطا/پاسخ صریح.
- stream بومی Slack یا پیش‌نمایش draft بسته به شکل رشته.
- نهایی‌سازی پست draft در Mattermost.
- نهایی‌سازی رویداد draft در Matrix یا redaction هنگام عدم تطابق.
- stream پیشرفت بومی Teams.
- stream در QQ Bot یا fallback انباشته‌شده.

## سطح آداپتور

هدف SDK عمومی باید یک زیرمسیر باشد:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

شکل هدف:

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

آداپتور ارسال:

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

آداپتور دریافت:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

پیش از مجوزدهی preflight، هسته باید هر زمان که `origin.decode` فراداده مبدأ OpenClaw را برمی‌گرداند،
گزاره مشترک پژواک OpenClaw را اجرا کند. آداپتور دریافت
واقعیت‌های پلتفرم مانند نویسنده ربات و شکل اتاق را فراهم می‌کند؛ هسته مالک تصمیم حذف
و ترتیب است تا کانال‌ها فیلترهای متنی را دوباره پیاده‌سازی نکنند.

آداپتور مبدأ:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

هسته `MessageOrigin` را تنظیم می‌کند. کانال‌ها فقط آن را به فراداده ترابری بومی
و از آن ترجمه می‌کنند. Slack این را به `chat.postMessage({ metadata })` و
`message.metadata` ورودی نگاشت می‌کند؛ Matrix می‌تواند آن را به محتوای اضافی رویداد نگاشت کند؛ کانال‌هایی
که فراداده بومی ندارند می‌توانند از یک رجیستری رسید/خروجی استفاده کنند، وقتی این
بهترین تقریب در دسترس باشد.

قابلیت‌ها:

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

## کاهش SDK عمومی

سطح عمومی جدید باید این حوزه‌های مفهومی را جذب یا deprecated کند:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- بیشتر استفاده‌های عمومی از `outbound-runtime`
- کمک‌کننده‌های چرخه عمر stream پیش‌نویس ad hoc

زیرمسیرهای سازگاری می‌توانند به‌عنوان پوشش‌دهنده باقی بمانند، اما Pluginهای شخص ثالث جدید
نباید به آن‌ها نیاز داشته باشند.

Pluginهای bundled ممکن است در طول مهاجرت importهای کمک‌کننده داخلی را از طریق زیرمسیرهای runtime
رزروشده نگه دارند. مستندات عمومی باید نویسندگان Plugin را پس از موجود شدن
`plugin-sdk/channel-message` به آن هدایت کند.

## رابطه با نوبت کانال

`runtime.channel.turn.*` باید در طول مهاجرت باقی بماند.

باید به یک آداپتور سازگاری تبدیل شود:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` نیز باید در ابتدا باقی بماند:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

پس از آنکه همه Pluginهای bundled و مسیرهای سازگاری شخص ثالث شناخته‌شده پل زده شدند،
`channel.turn` می‌تواند deprecated شود. نباید حذف شود تا زمانی که یک
مسیر مهاجرت SDK منتشرشده و تست‌های قرارداد وجود داشته باشد که ثابت کند Pluginهای قدیمی همچنان کار می‌کنند
یا با خطای نسخه روشن شکست می‌خورند.

## محافظ‌های سازگاری

در طول مهاجرت، تحویل پایدار عمومی برای هر کانالی که
callback تحویل موجود آن اثرهای جانبی فراتر از «این payload را بفرست» دارد، opt-in است.

نقطه‌های ورود قدیمی به‌طور پیش‌فرض غیرپایدار هستند:

- `channel.turn.run` و `dispatchAssembledChannelTurn` از callback تحویل کانال استفاده می‌کنند
  مگر اینکه آن کانال صریحا یک شیء policy/options پایدار و ممیزی‌شده فراهم کند.
- `channel.turn.runPrepared` تا زمانی که dispatcher آماده‌شده
  صریحا زمینه ارسال را فراخوانی کند، در مالکیت کانال می‌ماند.
- کمک‌کننده‌های سازگاری عمومی مانند `recordInboundSessionAndDispatchReply`،
  `dispatchInboundReplyWithBase`، و کمک‌کننده‌های direct-DM هرگز تحویل پایدار عمومی را
  پیش از callback `deliver` یا `reply` فراهم‌شده توسط فراخواننده تزریق نمی‌کنند.

برای نوع‌های پل مهاجرت، `durable: undefined` یعنی «پایدار نیست». مسیر
پایدار فقط با مقدار صریح policy/options فعال می‌شود. `durable:
false` می‌تواند به‌عنوان املای سازگاری باقی بماند، اما پیاده‌سازی نباید
نیاز داشته باشد هر کانال مهاجرت‌نکرده‌ای آن را اضافه کند.

کد پل فعلی باید تصمیم پایداری را صریح نگه دارد:

- تحویل نهایی پایدار یک وضعیت تفکیک‌شده برمی‌گرداند. `handled_visible` و
  `handled_no_send` پایانی هستند؛ `unsupported` و `not_applicable` ممکن است به
  تحویل متعلق به کانال بازگردند؛ `failed` شکست ارسال را منتقل می‌کند.
- تحویل نهایی پایدار عمومی با قابلیت‌های آداپتر مانند تحویل بی‌صدا، حفظ هدف
  پاسخ، حفظ نقل‌قول بومی و قلاب‌های ارسال پیام محدود می‌شود. نبود برابری باید
  تحویل متعلق به کانال را انتخاب کند، نه ارسال عمومی‌ای که رفتار قابل مشاهده
  برای کاربر را تغییر می‌دهد.
- ارسال‌های پایدار مبتنی بر صف یک ارجاع نیت تحویل ارائه می‌کنند. فیلدهای نشست
  موجود `pendingFinalDelivery*` می‌توانند در دوره گذار شناسه نیت را حمل کنند؛
  حالت نهایی یک ذخیره‌گاه `MessageSendIntent` است، نه متن پاسخ منجمد به‌همراه
  فیلدهای زمینه موردی.

مسیر پایدار عمومی را برای یک کانال فعال نکنید مگر اینکه همه موارد زیر درست
باشند:

- آداپتر ارسال عمومی همان رفتار رندر و انتقال مسیر مستقیم قدیمی را اجرا کند.
- عوارض جانبی محلی پس از ارسال از طریق زمینه ارسال حفظ شوند.
- آداپتر رسیدها یا نتایج تحویل را همراه با همه شناسه‌های پیام پلتفرم برگرداند.
- مسیرهای توزیع‌کننده آماده یا زمینه ارسال جدید را فراخوانی کنند یا همچنان به‌عنوان
  خارج از تضمین پایدار مستندسازی شوند.
- تحویل جایگزین هر بار مفید پیش‌بینی‌شده را مدیریت کند، نه فقط اولین مورد را.
- تحویل جایگزین پایدار کل آرایه بار مفید پیش‌بینی‌شده را به‌عنوان یک نیت قابل
  بازپخش یا طرح دسته‌ای ثبت کند.

خطرات مهاجرت مشخصی که باید حفظ شوند:

- تحویل ناظر iMessage پیام‌های ارسال‌شده را پس از ارسال موفق در یک کش پژواک ثبت
  می‌کند. ارسال‌های نهایی پایدار همچنان باید آن کش را پر کنند، وگرنه OpenClaw
  می‌تواند پاسخ‌های نهایی خودش را دوباره به‌عنوان پیام‌های ورودی کاربر دریافت
  کند.
- Tlon یک امضای اختیاری مدل را اضافه می‌کند و پس از پاسخ‌های گروهی رشته‌های
  مشارکت‌شده را ثبت می‌کند. تحویل پایدار عمومی نباید این اثرات را دور بزند؛
  یا آن‌ها را به آداپترهای رندر/ارسال/نهایی‌سازی Tlon منتقل کنید یا Tlon را روی
  مسیر متعلق به کانال نگه دارید.
- Discord و دیگر توزیع‌کننده‌های آماده از قبل مالک رفتار تحویل مستقیم و پیش‌نمایش
  هستند. تا زمانی که توزیع‌کننده‌های آماده آن‌ها به‌طور صریح نهایی‌ها را از طریق
  زمینه ارسال مسیریابی نکنند، زیر پوشش تضمین پایدار نوبت مونتاژشده نیستند.
- تحویل جایگزین بی‌صدای Telegram باید کل آرایه بار مفید پیش‌بینی‌شده را تحویل
  دهد. میانبر تک‌بارمفید می‌تواند پس از پیش‌بینی، بارهای مفید جایگزین اضافی را
  حذف کند.
- LINE، BlueBubbles، Zalo، Nostr و دیگر مسیرهای مونتاژشده/کمکی موجود ممکن است
  مدیریت توکن پاسخ، پراکسی رسانه، کش‌های پیام ارسال‌شده، پاک‌سازی بارگذاری/وضعیت
  یا هدف‌های فقط-بازفراخوانی داشته باشند. آن‌ها تا زمانی که این معناشناسی‌ها توسط
  آداپتر ارسال نمایش داده و با آزمون‌ها تأیید شوند، روی تحویل متعلق به کانال
  می‌مانند.
- کمک‌کننده‌های Direct-DM می‌توانند یک بازفراخوانی پاسخ داشته باشند که تنها هدف
  انتقال درست است. خروجی عمومی نباید از `OriginatingTo` یا `To` حدس بزند و آن
  بازفراخوانی را رد کند.
- خروجی شکست Gateway در OpenClaw باید برای انسان‌ها قابل مشاهده بماند، اما
  پژواک‌های اتاق برچسب‌خورده و نوشته‌شده توسط بات باید پیش از مجوزدهی `allowBots`
  حذف شوند. کانال‌ها نباید این را با فیلترهای پیشوند متن قابل مشاهده پیاده‌سازی
  کنند، مگر به‌عنوان یک توقف اضطراری کوتاه؛ قرارداد پایدار فراداده ساختاریافته
  مبدا است.

## ذخیره‌سازی داخلی

صف پایدار باید نیت‌های ارسال پیام را ذخیره کند، نه بارهای مفید پاسخ را.

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

حلقه بازیابی:

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

صف باید هویت کافی را نگه دارد تا پس از راه‌اندازی مجدد، از طریق همان حساب،
رشته، هدف، سیاست قالب‌بندی و قواعد رسانه بازپخش شود.

## کلاس‌های شکست

آداپترهای کانال شکست‌های انتقال را در دسته‌های بسته طبقه‌بندی می‌کنند:

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

سیاست هسته:

- `transient` و `rate_limit` را دوباره تلاش کنید.
- `invalid_payload` را دوباره تلاش نکنید مگر اینکه جایگزین رندر وجود داشته باشد.
- `auth` یا `permission` را تا زمانی که پیکربندی تغییر نکند دوباره تلاش نکنید.
- برای `not_found`، اجازه دهید نهایی‌سازی زنده وقتی کانال آن را ایمن اعلام می‌کند
  از ویرایش به ارسال تازه بازگردد.
- برای `conflict`، از قواعد رسید/یکتایی عملیات استفاده کنید تا تصمیم بگیرید آیا
  پیام از قبل وجود دارد یا نه.
- هر خطایی پس از اینکه آداپتر ممکن است I/O پلتفرم را کامل کرده باشد اما پیش از
  ثبت رسید رخ دهد، به `unknown_after_send` تبدیل می‌شود، مگر اینکه آداپتر بتواند
  ثابت کند عملیات پلتفرم رخ نداده است.

## نگاشت کانال

| کانال                  | هدف مهاجرت                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | سیاست تأیید دریافت به‌علاوه ارسال‌های نهایی پایدار را دریافت کند. آداپتور زنده مالک ارسال به‌علاوه ویرایش پیش‌نمایش، ارسال نهایی پیش‌نمایش کهنه، موضوع‌ها، رد کردن پیش‌نمایش پاسخِ نقل‌قولی، جایگزین رسانه، و مدیریت retry-after است.                                                                                                                                                                   |
| Discord                  | آداپتور ارسال، تحویل payload پایدار موجود را پوشش می‌دهد. آداپتور زنده مالک ویرایش پیش‌نویس، پیش‌نویس پیشرفت، لغو پیش‌نمایش رسانه/خطا، حفظ مقصد پاسخ، و رسیدهای شناسه پیام است. پژواک‌های شکست Gateway نوشته‌شده توسط ربات را در اتاق‌های مشترک ممیزی کنید؛ اگر Discord نتواند فراداده مبدأ را روی پیام‌های عادی حمل کند، از یک رجیستری خروجی یا معادل بومی دیگر استفاده کنید. |
| Slack                    | آداپتور ارسال، پست‌های گفت‌وگوی عادی را مدیریت می‌کند. آداپتور زنده وقتی شکل رشته پشتیبانی کند جریان بومی را انتخاب می‌کند، وگرنه پیش‌نمایش پیش‌نویس را. رسیدها زمان‌مهرهای رشته را حفظ می‌کنند. آداپتور مبدأ، شکست‌های Gateway مربوط به OpenClaw را به `chat.postMessage.metadata` در Slack نگاشت می‌کند و پژواک‌های برچسب‌خورده اتاق ربات را پیش از مجوزدهی `allowBots` حذف می‌کند.                                  |
| WhatsApp                 | آداپتور ارسال مالک ارسال متن/رسانه با intentهای نهایی پایدار است. آداپتور دریافت، اشاره گروهی و هویت فرستنده را مدیریت می‌کند. تا وقتی WhatsApp انتقال قابل ویرایش نداشته باشد، زنده می‌تواند غایب بماند.                                                                                                                                                                        |
| Matrix                   | آداپتور زنده مالک ویرایش‌های رویداد پیش‌نویس، نهایی‌سازی، حذف، محدودیت‌های رسانه رمزگذاری‌شده، و جایگزین عدم تطابق مقصد پاسخ است. آداپتور دریافت مالک آبدهی و حذف تکراری رویداد رمزگذاری‌شده است. آداپتور مبدأ باید مبدأ شکست Gateway مربوط به OpenClaw را در محتوای رویداد Matrix کدگذاری کند و پژواک‌های اتاق ربات پیکربندی‌شده را پیش از مدیریت `allowBots` حذف کند.              |
| Mattermost               | آداپتور زنده مالک یک پست پیش‌نویس، تا کردن پیشرفت/ابزار، نهایی‌سازی درجا، و جایگزین ارسال تازه است.                                                                                                                                                                                                                                                       |
| Microsoft Teams          | آداپتور زنده مالک پیشرفت بومی و رفتار جریان بلوکی است. آداپتور ارسال مالک فعالیت‌ها و رسیدهای پیوست/کارت است.                                                                                                                                                                                                                                        |
| Feishu                   | آداپتور رندر مالک رندر متن/کارت/خام است. آداپتور زنده مالک کارت‌های جریانی و سرکوب نهایی تکراری است. آداپتور ارسال مالک نظرها، نشست‌های موضوع، رسانه، و سرکوب صدا است.                                                                                                                                                                      |
| QQ Bot                   | آداپتور زنده مالک جریان C2C، زمان‌پایان accumulator، و ارسال نهایی جایگزین است. آداپتور رندر مالک برچسب‌های رسانه و متن به‌عنوان صدا است.                                                                                                                                                                                                                               |
| Signal                   | دریافت ساده به‌علاوه آداپتور ارسال. مگر اینکه signal-cli پشتیبانی ویرایش قابل اتکا اضافه کند، آداپتور زنده وجود ندارد.                                                                                                                                                                                                                                                                |
| iMessage and BlueBubbles | دریافت ساده به‌علاوه آداپتور ارسال. ارسال iMessage باید پر شدن echo-cache مانیتور را پیش از اینکه نهایی‌های پایدار بتوانند تحویل مانیتور را دور بزنند حفظ کند. تایپ کردن، واکنش‌ها، و پیوست‌های مختص BlueBubbles همچنان قابلیت‌های آداپتور باقی می‌مانند.                                                                                                                            |
| Google Chat              | دریافت ساده به‌علاوه آداپتور ارسال، با رابطه رشته که به فضاها و شناسه‌های رشته نگاشت شده است. رفتار اتاق `allowBots=true` را برای پژواک‌های برچسب‌خورده شکست Gateway مربوط به OpenClaw ممیزی کنید.                                                                                                                                                                                        |
| LINE                     | دریافت ساده به‌علاوه آداپتور ارسال، با محدودیت‌های reply-token که به‌صورت قابلیت مقصد/رابطه مدل شده‌اند.                                                                                                                                                                                                                                                           |
| Nextcloud Talk           | پل دریافت SDK به‌علاوه آداپتور ارسال.                                                                                                                                                                                                                                                                                                                          |
| IRC                      | دریافت ساده به‌علاوه آداپتور ارسال، بدون رسیدهای ویرایش پایدار.                                                                                                                                                                                                                                                                                                    |
| Nostr                    | دریافت به‌علاوه آداپتور ارسال برای پیام‌های مستقیم رمزگذاری‌شده؛ رسیدها شناسه‌های رویداد هستند.                                                                                                                                                                                                                                                                                           |
| QA Channel               | آداپتور آزمون قرارداد برای رفتار دریافت، ارسال، زنده، تلاش دوباره، و بازیابی.                                                                                                                                                                                                                                                                                   |
| Synology Chat            | دریافت ساده به‌علاوه آداپتور ارسال.                                                                                                                                                                                                                                                                                                                              |
| Tlon                     | آداپتور ارسال باید رندر امضای مدل و رهگیری رشته‌های مشارکت‌شده را پیش از فعال شدن تحویل نهایی پایدار عمومی حفظ کند.                                                                                                                                                                                                                        |
| Twitch                   | دریافت ساده به‌علاوه آداپتور ارسال با طبقه‌بندی محدودیت نرخ.                                                                                                                                                                                                                                                                                               |
| Zalo                     | دریافت ساده به‌علاوه آداپتور ارسال.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal            | دریافت ساده به‌علاوه آداپتور ارسال.                                                                                                                                                                                                                                                                                                                              |

## برنامه مهاجرت

### فاز ۱: دامنه پیام داخلی

- نوع‌های `src/channels/message/*` را برای پیام‌ها، مقصدها، رابطه‌ها،
  مبدأها، رسیدها، قابلیت‌ها، intentهای پایدار، بافت دریافت، بافت ارسال،
  بافت زنده، و کلاس‌های شکست اضافه کنید.
- `origin?: MessageOrigin` را به نوع payload پل مهاجرت که توسط
  تحویل پاسخ فعلی استفاده می‌شود اضافه کنید، سپس با جایگزین شدن payloadهای پاسخ
  در جریان بازآرایی، آن فیلد را به `ChannelMessage` و نوع‌های پیام رندرشده
  منتقل کنید.
- تا وقتی آداپتورها و آزمون‌ها شکل را اثبات کنند، این را داخلی نگه دارید.
- آزمون‌های واحد خالص برای گذارهای وضعیت و سریال‌سازی اضافه کنید.

### فاز ۲: هسته ارسال پایدار

- صف خروجی موجود را از پایداری reply-payload به intentهای ارسال پیام پایدار
  منتقل کنید.
- اجازه دهید یک intent ارسال پایدار، آرایه payload تصویرشده یا برنامه دسته‌ای
  حمل کند، نه فقط یک payload پاسخ.
- رفتار بازیابی صف فعلی را از طریق تبدیل سازگاری حفظ کنید.
- کاری کنید `deliverOutboundPayloads`، `messages.send` را فراخوانی کند.
- پس از اینکه آداپتور ایمنی replay را اعلام کرد، پایداری ارسال نهایی را پیش‌فرض کنید
  و وقتی intent پایدار در چرخه عمر پیام جدید قابل نوشتن نیست، بسته و ناموفق شوید.
  مسیرهای سازگاری channel-turn و SDK موجود در این فاز به‌صورت پیش‌فرض
  direct-send باقی می‌مانند.
- رسیدها را به‌صورت سازگار ثبت کنید.
- رسیدها و نتایج تحویل را به فراخواننده dispatcher اصلی برگردانید
  به‌جای اینکه ارسال پایدار را به‌عنوان عارضه جانبی نهایی تلقی کنید.
- مبدأ پیام را از طریق intentهای ارسال پایدار ماندگار کنید تا بازیابی، replay، و
  ارسال‌های تکه‌ای، منشأ عملیاتی OpenClaw را حفظ کنند.

### فاز ۳: پل Channel Turn

- `channel.turn.run` و `dispatchAssembledChannelTurn` را روی
  `messages.receive` و `messages.send` دوباره پیاده‌سازی کنید.
- نوع‌های fact فعلی را پایدار نگه دارید.
- رفتار میراثی را به‌صورت پیش‌فرض حفظ کنید. یک کانال assembled-turn فقط وقتی
  پایدار می‌شود که آداپتور آن به‌طور صریح با سیاست پایداری امن برای replay
  opt in کند.
- `durable: false` را به‌عنوان راه فرار سازگاری برای مسیرهایی که ویرایش‌های بومی
  را نهایی می‌کنند و هنوز نمی‌توانند ایمن replay شوند نگه دارید، اما برای محافظت
  از کانال‌های مهاجرت‌نکرده به نشانگرهای `false` تکیه نکنید.
- پایداری assembled-turn را فقط در چرخه عمر پیام جدید پیش‌فرض کنید، پس از اینکه
  نگاشت کانال ثابت کرد مسیر ارسال عمومی معناشناسی تحویل کانال قدیمی را حفظ می‌کند.

### فاز ۴: پل Dispatcher آماده

- `deliverDurableInboundReplyPayload` را با یک پل زمینهٔ ارسال جایگزین کنید.
- helper قدیمی را به‌عنوان wrapper نگه دارید.
- ابتدا Telegram، WhatsApp، Slack، Signal، iMessage و Discord را منتقل کنید، چون
  آن‌ها از قبل کار durable-final یا مسیرهای ارسال ساده‌تری دارند.
- هر dispatcher آماده‌شده را تا زمانی که صراحتاً به زمینهٔ ارسال opt in نکرده است، بدون پوشش در نظر بگیرید. مستندات و ورودی‌های changelog باید بگویند «turnهای کانال مونتاژشده» یا مسیرهای کانال مهاجرت‌داده‌شده را نام ببرند، نه اینکه ادعا کنند همهٔ پاسخ‌های نهایی خودکار را پوشش می‌دهند.
- رفتار `recordInboundSessionAndDispatchReply`، helperهای direct-DM و helperهای عمومی سازگاری مشابه را حفظ کنید. آن‌ها ممکن است بعداً opt-in صریح زمینهٔ ارسال را expose کنند، اما نباید پیش از callback تحویلِ متعلق به caller به‌طور خودکار تلاش به تحویل durable عمومی کنند.

### فاز ۵: چرخهٔ حیات زندهٔ یکپارچه

- `messages.live` را با دو adapter اثبات بسازید:
  - Telegram برای ارسال، ویرایش، و ارسال نهایی stale.
  - Matrix برای نهایی‌سازی draft و fallback حذف.
- سپس Discord، Slack، Mattermost، Teams، QQ Bot و Feishu را مهاجرت دهید.
- کد تکراری نهایی‌سازی preview را فقط پس از اینکه هر کانال testهای parity داشت حذف کنید.

### فاز ۶: SDK عمومی

- `openclaw/plugin-sdk/channel-message` را اضافه کنید.
- آن را به‌عنوان API ترجیحی Plugin کانال مستند کنید.
- package exports، موجودی entrypoint، baselineهای API تولیدشده، و مستندات SDK Plugin را به‌روزرسانی کنید.
- `MessageOrigin`، hookهای encode/decode مبدأ، و predicate مشترک
  `shouldDropOpenClawEcho` را در سطح SDK channel-message قرار دهید.
- wrapperهای سازگاری را برای subpathهای قدیمی نگه دارید.
- پس از مهاجرت Pluginهای همراه، helperهای SDK با نام reply را در مستندات deprecated علامت‌گذاری کنید.

### فاز ۷: همهٔ فرستنده‌ها

همهٔ producerهای خروجی غیر-reply را به `messages.send` منتقل کنید:

- اعلان‌های Cron و Heartbeat
- تکمیل taskها
- نتیجه‌های hook
- promptهای approval و نتیجه‌های approval
- ارسال‌های ابزار پیام
- اعلان‌های تکمیل subagent
- ارسال‌های صریح CLI یا Control UI
- مسیرهای automation/broadcast

اینجاست که مدل دیگر «پاسخ‌های agent» نیست و به «OpenClaw پیام‌ها را ارسال می‌کند» تبدیل می‌شود.

### فاز ۸: Deprecate کردن Turn

- `channel.turn` را دست‌کم برای یک پنجرهٔ سازگاری به‌عنوان wrapper نگه دارید.
- یادداشت‌های مهاجرت را منتشر کنید.
- testهای سازگاری SDK Plugin را در برابر importهای قدیمی اجرا کنید.
- helperهای داخلی قدیمی را فقط پس از اینکه هیچ Plugin همراهی به آن‌ها نیاز نداشت
  و قراردادهای third-party جایگزین پایداری داشتند حذف یا پنهان کنید.

## طرح test

testهای unit:

- سریال‌سازی و بازیابی intent ارسال durable.
- استفادهٔ مجدد از کلید idempotency و suppress کردن duplicate.
- commit کردن receipt و رد کردن replay.
- بازیابی `unknown_after_send` که وقتی adapter از reconciliation پشتیبانی می‌کند، پیش از replay تطبیق می‌دهد.
- سیاست دسته‌بندی failure.
- توالی سیاست ack دریافت.
- نگاشت relation برای ارسال‌های reply، followup، system و broadcast.
- factory مبدأ Gateway-failure و predicate `shouldDropOpenClawEcho`.
- حفظ مبدأ از مسیر normalization payload، chunking، سریال‌سازی queue durable و recovery.

testهای integration:

- adapter سادهٔ `channel.turn.run` همچنان record و send می‌کند.
- تحویل legacy assembled-turn تا وقتی کانال صراحتاً opt in نکند durable نمی‌شود.
- پل `channel.turn.runPrepared` همچنان record و finalize می‌کند.
- helperهای عمومی سازگاری به‌صورت پیش‌فرض callbackهای تحویل متعلق به caller را فراخوانی می‌کنند
  و پیش از آن callbackها generic-send انجام نمی‌دهند.
- تحویل fallback durable پس از restart کل آرایهٔ payload projected را replay می‌کند
  و نمی‌تواند بعد از crash زودهنگام، payloadهای بعدی را بدون record باقی بگذارد.
- تحویل durable assembled-turn شناسه‌های پیام platform را به dispatcher buffered برمی‌گرداند.
- hookهای تحویل custom وقتی تحویل durable غیرفعال یا در دسترس نیست همچنان شناسه‌های پیام platform را برمی‌گردانند.
- reply نهایی بین تکمیل assistant و ارسال platform از restart جان سالم به در می‌برد.
- draft preview وقتی مجاز باشد درجا finalize می‌شود.
- draft preview وقتی mismatch رسانه/خطا/target reply نیازمند تحویل عادی باشد cancel یا redact می‌شود.
- block streaming و preview streaming هر دو متن یکسان را تحویل نمی‌دهند.
- رسانه‌ای که زود stream شده است در تحویل نهایی duplicate نمی‌شود.

testهای کانال:

- reply موضوع Telegram با ack polling که تا watermark تکمیل امن زمینهٔ دریافت delayed می‌شود.
- بازیابی polling Telegram برای updateهای پذیرفته‌شده اما تحویل‌نشده که با مدل offset safe-completed پایدارشده پوشش داده می‌شوند.
- preview stale در Telegram نهایی تازه می‌فرستد و preview را پاک‌سازی می‌کند.
- fallback خاموش Telegram همهٔ payloadهای fallback projected را می‌فرستد.
- دوام fallback خاموش Telegram آرایهٔ کامل fallback projected را به‌صورت atomic record می‌کند،
  نه یک intent durable تک-payload در هر iteration حلقه.
- cancel شدن preview در Discord هنگام رسانه/خطا/reply صریح.
- finalهای dispatcher آمادهٔ Discord پیش از اینکه مستندات یا changelog ادعای دوام final-reply در Discord کنند، از مسیر زمینهٔ ارسال عبور می‌کنند.
- ارسال‌های نهایی durable در iMessage cache اکو پیام ارسالی monitor را populate می‌کنند.
- مسیرهای تحویل legacy در LINE، BlueBubbles، Zalo و Nostr تا زمانی که testهای parity adapter آن‌ها وجود نداشته باشد، توسط generic durable send دور زده نمی‌شوند.
- تحویل callback در Direct-DM/Nostr مگر اینکه صراحتاً به یک target پیام کامل و adapter ارسال replay-safe مهاجرت داده شود، همچنان authoritative می‌ماند.
- پیام‌های failure متعلق به Slack tagged OpenClaw Gateway در خروجی visible می‌مانند، اکوهای bot-room برچسب‌خورده پیش از `allowBots` drop می‌شوند، و پیام‌های bot بدون برچسب با همان متن visible همچنان مسیر مجوزدهی عادی bot را دنبال می‌کنند.
- fallback stream native در Slack به draft preview در DMهای top-level.
- نهایی‌سازی preview و fallback redaction در Matrix.
- اکوهای room مربوط به tagged OpenClaw gateway-failure در Matrix از حساب‌های bot پیکربندی‌شده پیش از handling `allowBots` drop می‌شوند.
- auditهای cascade مربوط به gateway-failure در shared-roomهای Discord و Google Chat حالت‌های
  `allowBots` را پیش از ادعای حفاظت generic در آنجا پوشش می‌دهند.
- نهایی‌سازی draft و fallback fresh-send در Mattermost.
- نهایی‌سازی progress native در Teams.
- suppress کردن final duplicate در Feishu.
- fallback timeout accumulator در QQ Bot.
- ارسال‌های نهایی durable در Tlon rendering مربوط به model-signature و tracking thread مشارکت‌شده را حفظ می‌کنند.
- ارسال‌های نهایی durable ساده در WhatsApp، Signal، iMessage، Google Chat، LINE، IRC، Nostr، Nextcloud Talk،
  Synology Chat، Tlon، Twitch، Zalo و Zalo Personal.

اعتبارسنجی:

- فایل‌های Vitest هدفمند در طول توسعه.
- `pnpm check:changed` در Testbox برای کل سطح تغییرکرده.
- `pnpm check` گسترده‌تر در Testbox پیش از landing کل refactor یا پس از تغییرات public SDK/export.
- smoke زنده یا qa-channel برای دست‌کم یک کانال دارای قابلیت edit و یک کانال سادهٔ send-only پیش از حذف wrapperهای سازگاری.

## پرسش‌های باز

- اینکه آیا Telegram در نهایت باید منبع runner مربوط به grammY را با یک منبع polling کاملاً durable جایگزین کند که بتواند redelivery در سطح platform را کنترل کند، نه فقط watermark restart پایدارشدهٔ OpenClaw را.
- اینکه state مربوط به durable live preview باید در همان record queue به‌عنوان intent ارسال نهایی ذخیره شود یا در یک store live-state خواهر.
- wrapperهای سازگاری پس از ship شدن `plugin-sdk/channel-message` چه مدت مستند بمانند.
- اینکه Pluginهای third-party باید adapterهای receive را مستقیماً پیاده‌سازی کنند یا فقط hookهای normalize/send/live را از طریق `defineChannelMessageAdapter` فراهم کنند.
- کدام فیلدهای receipt برای expose شدن در SDK عمومی در برابر state داخلی runtime امن هستند.
- اینکه side effectهایی مانند cacheهای self-echo و markerهای participated-thread باید به‌عنوان hookهای send-context، مرحله‌های finalize متعلق به adapter، یا subscriberهای receipt مدل‌سازی شوند.
- کدام کانال‌ها metadata مبدأ native دارند، کدام‌یک registryهای outbound پایدارشده نیاز دارند، و کدام‌یک نمی‌توانند suppress قابل‌اعتماد echo میان‌bot ارائه دهند.

## معیارهای پذیرش

- هر کانال پیام همراه خروجی visible نهایی را از مسیر `messages.send` ارسال می‌کند.
- هر کانال پیام inbound از مسیر `messages.receive` یا یک wrapper سازگاری مستند وارد می‌شود.
- هر کانال preview/edit/stream از `messages.live` برای state draft و نهایی‌سازی استفاده می‌کند.
- `channel.turn` فقط یک wrapper است.
- helperهای SDK با نام reply exportهای سازگاری هستند، نه مسیر توصیه‌شده.
- recovery durable می‌تواند پس از restart ارسال‌های نهایی pending را بدون از دست دادن پاسخ نهایی یا duplicate کردن ارسال‌های از قبل commit‌شده replay کند؛ ارسال‌هایی که نتیجهٔ platform آن‌ها unknown است پیش از replay تطبیق داده می‌شوند یا برای آن adapter به‌عنوان at-least-once مستند می‌شوند.
- ارسال‌های نهایی durable وقتی intent durable نتواند نوشته شود fail closed می‌شوند،
  مگر اینکه caller صراحتاً یک حالت non-durable مستند را انتخاب کرده باشد.
- helperهای سازگاری legacy channel-turn و SDK به‌صورت پیش‌فرض به تحویل مستقیم متعلق به کانال متکی هستند؛ generic durable send فقط opt-in صریح است.
- receiptها همهٔ شناسه‌های پیام platform را برای تحویل‌های چندبخشی و یک شناسهٔ primary را برای راحتی threading/edit حفظ می‌کنند.
- wrapperهای durable پیش از جایگزین کردن callbackهای تحویل مستقیم، side effectهای channel-local را حفظ می‌کنند.
- dispatcherهای آماده تا زمانی که مسیر تحویل نهایی آن‌ها صراحتاً از زمینهٔ ارسال استفاده نکند durable محسوب نمی‌شوند.
- تحویل fallback هر payload projected را handle می‌کند.
- تحویل fallback durable هر payload projected را در یک intent یا batch plan قابل replay record می‌کند.
- خروجی gateway failure با مبدأ OpenClaw برای انسان‌ها visible است، اما echoهای room برچسب‌خوردهٔ bot-authored پیش از مجوزدهی bot در کانال‌هایی که پشتیبانی از قرارداد مبدأ را اعلام می‌کنند drop می‌شوند.
- مستندات send، receive، live، state، receiptها، relationها، سیاست failure، مهاجرت و پوشش test را توضیح می‌دهند.

## مرتبط

- [پیام‌ها](/fa/concepts/messages)
- [Streaming و chunking](/fa/concepts/streaming)
- [draftهای progress](/fa/concepts/progress-drafts)
- [سیاست retry](/fa/concepts/retry)
- [kernel مربوط به turn کانال](/fa/plugins/sdk-channel-turn)
