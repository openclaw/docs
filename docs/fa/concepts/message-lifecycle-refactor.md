---
read_when:
    - بازآرایی رفتار ارسال یا دریافت در کانال
    - تغییر کانال ورودی، ارسال پاسخ، صف خروجی، پخش پیش‌نمایش، یا APIهای پیام Plugin SDK
    - طراحی Plugin کانال جدیدی که به ارسال‌های پایدار، رسیدها، پیش‌نمایش‌ها، ویرایش‌ها یا تلاش‌های دوباره نیاز دارد
summary: طرح طراحی برای چرخهٔ عمر یکپارچه و پایدار دریافت، ارسال، پیش‌نمایش، ویرایش و استریم پیام
title: بازآرایی چرخهٔ حیات پیام
x-i18n:
    generated_at: "2026-06-27T17:33:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

این صفحه طراحی هدف برای جایگزینی helperهای پراکنده‌ی ورودی کانال، ارسال پاسخ،
streaming پیش‌نمایش، و تحویل خروجی با یک چرخه‌ی عمر پیام پایدار است.

نسخه‌ی کوتاه:

- primitiveهای هسته باید **receive** و **send** باشند، نه **reply**.
- پاسخ فقط یک رابطه روی یک پیام خروجی است.
- turn یک ابزار کمکی برای پردازش ورودی است، نه مالک تحویل.
- ارسال باید مبتنی بر context باشد: `begin`، render، پیش‌نمایش یا stream، ارسال نهایی،
  commit، fail.
- دریافت هم باید مبتنی بر context باشد: normalize، dedupe، route، record،
  dispatch، platform ack، fail.
- SDK عمومی Plugin باید به یک سطح کوچک channel-outbound خلاصه شود.

## مشکلات

پشته‌ی کانال فعلی از چند نیاز محلی معتبر رشد کرده است:

- adapterهای ورودی ساده از `runtime.channel.inbound.run` استفاده می‌کنند.
- adapterهای غنی از `runtime.channel.inbound.runPreparedReply` استفاده می‌کنند.
- helperهای قدیمی از `dispatchInboundReplyWithBase`،
  `recordInboundSessionAndDispatchReply`، helperهای payload پاسخ، chunking پاسخ،
  referenceهای پاسخ، و helperهای runtime خروجی استفاده می‌کنند.
- streaming پیش‌نمایش در dispatcherهای اختصاصی کانال زندگی می‌کند.
- پایداری تحویل نهایی در اطراف مسیرهای موجود payload پاسخ اضافه می‌شود.

این شکل باگ‌های محلی را رفع می‌کند، اما OpenClaw را با مفاهیم عمومی بیش از حد
زیاد و جاهای بیش از حد زیادی باقی می‌گذارد که در آن‌ها semantics تحویل می‌تواند
منحرف شود.

مسئله‌ی reliability که این را آشکار کرد این است:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

invariant هدف از Telegram گسترده‌تر است: وقتی هسته تصمیم می‌گیرد یک پیام خروجی
قابل مشاهده باید وجود داشته باشد، intent باید پیش از تلاش برای ارسال platform
پایدار شود، و receipt پلتفرم باید پس از موفقیت commit شود. این به OpenClaw
بازیابی at-least-once می‌دهد. رفتار exactly-once فقط برای adapterهایی وجود دارد
که بتوانند idempotency بومی را اثبات کنند یا تلاش unknown-after-send را پیش از
replay با state پلتفرم reconcile کنند.

این وضعیت نهایی این refactor است، نه توصیفی از همه‌ی مسیرهای فعلی. در طول
migration، helperهای خروجی موجود هنوز می‌توانند وقتی نوشتن‌های صف best-effort
ناموفق می‌شوند به ارسال مستقیم fall through کنند. refactor فقط وقتی کامل است که
ارسال‌های نهایی پایدار fail closed شوند یا با یک policy غیرپایدار مستندشده
صراحتا opt out کنند.

## اهداف

- یک چرخه‌ی عمر هسته برای همه‌ی مسیرهای دریافت و ارسال پیام کانال.
- ارسال‌های نهایی پایدار به صورت پیش‌فرض در چرخه‌ی عمر پیام جدید پس از اینکه یک adapter
  رفتار replay-safe را اعلام کند.
- semantics مشترک برای پیش‌نمایش، ویرایش، stream، نهایی‌سازی، retry، recovery، و receipt.
- سطح SDK کوچک Plugin که pluginهای شخص ثالث بتوانند یاد بگیرند و نگه‌داری کنند.
- سازگاری برای callerهای موجود سازگاری پاسخ ورودی در طول migration.
- نقاط extension روشن برای قابلیت‌های جدید کانال.
- بدون branchهای اختصاصی پلتفرم در هسته.
- بدون پیام‌های کانال token-delta. streaming کانال همچنان تحویل پیش‌نمایش پیام،
  ویرایش، append، یا block کامل‌شده باقی می‌ماند.
- metadata ساختاریافته‌ی با منشا OpenClaw برای خروجی operational/system تا خطاهای قابل مشاهده‌ی
  gateway دوباره به عنوان prompt تازه وارد اتاق‌های مشترک bot-enabled نشوند.

## غیرهدف‌ها

- همه‌ی کانال‌های موجود را در فاز اول مجبور به تحویل پیام پایدار نکنید.
- همه‌ی کانال‌ها را مجبور به رفتار native transport یکسان نکنید.
- به هسته topicهای Telegram، streamهای بومی Slack، redactionهای Matrix،
  cardهای Feishu، صدای QQ، یا activityهای Teams را آموزش ندهید.
- همه‌ی helperهای internal migration را به عنوان API پایدار SDK منتشر نکنید.
- کاری نکنید retryها عملیات تکمیل‌شده‌ی غیر-idempotent پلتفرم را replay کنند.

## مدل مرجع

Vercel Chat یک مدل ذهنی عمومی خوب دارد:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- متدهای adapter مانند `postMessage`، `editMessage`، `deleteMessage`،
  `stream`، `startTyping`، و fetchهای تاریخچه
- یک state adapter برای dedupe، lockها، queueها، و persistence

OpenClaw باید واژگان را قرض بگیرد، نه سطح را کپی کند.

آنچه OpenClaw فراتر از آن مدل نیاز دارد:

- intentهای ارسال خروجی پایدار پیش از callهای مستقیم transport.
- contextهای ارسال صریح با begin، commit، و fail.
- contextهای دریافت که policy مربوط به platform ack را می‌دانند.
- receiptهایی که از restart جان سالم به در می‌برند و می‌توانند ویرایش‌ها، حذف‌ها، recovery، و
  suppression تکراری را هدایت کنند.
- SDK عمومی کوچک‌تر. pluginهای bundled می‌توانند از helperهای internal runtime استفاده کنند، اما
  pluginهای شخص ثالث باید یک API پیام منسجم ببینند.
- رفتار اختصاصی agent: sessionها، transcriptها، block streaming، پیشرفت tool،
  approvalها، media directiveها، پاسخ‌های silent، و تاریخچه‌ی mention گروهی.

promiseهای سبک `thread.post()` برای OpenClaw کافی نیستند. آن‌ها مرز transaction را
که تصمیم می‌گیرد آیا یک send قابل بازیابی است پنهان می‌کنند.

## مدل هسته

دامنه‌ی جدید باید زیر یک namespace داخلی هسته مانند
`src/channels/message/*` زندگی کند.

چهار مفهوم دارد:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` مالک چرخه‌ی عمر ورودی است.

`send` مالک چرخه‌ی عمر خروجی است.

`live` مالک پیش‌نمایش، ویرایش، پیشرفت، و state مربوط به stream است.

`state` مالک ذخیره‌سازی پایدار intent، receiptها، idempotency، recovery، lockها، و
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

reply یک relation است، نه ریشه‌ی API:

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

این اجازه می‌دهد همان مسیر send پاسخ‌های عادی، اعلان‌های cron، promptهای approval،
تکمیل taskها، ارسال‌های message-tool، ارسال‌های CLI یا Control UI، نتایج subagent،
و ارسال‌های automation را مدیریت کند.

### منشا

Origin توصیف می‌کند چه کسی یک پیام را تولید کرده و OpenClaw باید echoهای آن پیام را چگونه
رفتار کند. این از relation جداست: یک پیام می‌تواند پاسخ به کاربر باشد
و همچنان خروجی operational با منشا OpenClaw باشد.

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

هسته مالک معنای خروجی با منشا OpenClaw است. کانال‌ها مالک این هستند که آن
origin چگونه در transport آن‌ها encode شود.

اولین کاربرد ضروری، خروجی gateway failure است. انسان‌ها همچنان باید
پیام‌هایی مانند "Agent failed before reply" یا "Missing API key" را ببینند، اما خروجی
operational برچسب‌خورده‌ی OpenClaw نباید وقتی `allowBots` فعال است به عنوان ورودی bot-authored در اتاق‌های مشترک پذیرفته شود.

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

Receiptها پل میان intent پایدار و ویرایش آینده، حذف، نهایی‌سازی پیش‌نمایش،
suppression تکراری، و recovery هستند.

یک receipt می‌تواند یک پیام پلتفرم یا تحویل چندبخشی را توصیف کند. متن chunked،
media همراه متن، voice همراه متن، و fallbackهای card باید همه‌ی idهای پلتفرم را حفظ کنند
و همچنان یک id اصلی برای threading و ویرایش‌های بعدی ارائه دهند.

## Context دریافت

Receiving نباید یک call ساده‌ی helper باشد. هسته به contextی نیاز دارد که
dedupe، routing، ثبت session، و policy مربوط به platform ack را بداند.

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

جریان receive:

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

Ack یک چیز واحد نیست. قرارداد receive باید این signalها را جدا نگه دارد:

- **Transport ack:** به platform webhook یا socket می‌گوید OpenClaw event envelope را پذیرفته است.
  برخی پلتفرم‌ها پیش از dispatch به این نیاز دارند.
- **Polling offset ack:** یک cursor را جلو می‌برد تا همان event دوباره fetch نشود.
  این نباید از کاری که قابل بازیابی نیست عبور کند.
- **Inbound record ack:** تایید می‌کند OpenClaw metadata کافی ورودی را persist کرده تا
  redelivery را dedupe و route کند.
- **User-visible receipt:** رفتار اختیاری read/status/typing؛ هرگز مرز
  durability نیست.

`ReceiveAckPolicy` فقط acknowledgement مربوط به transport یا polling را کنترل می‌کند. نباید
برای read receiptها یا status reactionها دوباره استفاده شود.

پیش از authorization بات، receive باید وقتی کانال می‌تواند metadata مربوط به origin پیام را decode کند،
policy مشترک echo مربوط به OpenClaw را اعمال کند:

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

این drop مبتنی بر tag است، نه مبتنی بر متن. یک پیام اتاق bot-authored با همان
متن قابل مشاهده‌ی gateway-failure اما بدون metadata مربوط به OpenClaw origin همچنان
از authorization عادی `allowBots` عبور می‌کند.

Ack policy صریح است:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram polling اکنون از policy مربوط به ack در receive-context برای watermark پایدار
restart خود استفاده می‌کند. tracker همچنان updateهای grammY را هنگام ورود به
middleware chain مشاهده می‌کند، اما OpenClaw فقط id به‌روزرسانی تکمیل‌شده‌ی امن را پس از
dispatch موفق persist می‌کند و updateهای ناموفق یا pending پایین‌تر را پس از
restart قابل replay باقی می‌گذارد. offset مربوط به fetch بالادستی `getUpdates` در Telegram
همچنان توسط کتابخانه‌ی polling کنترل می‌شود، بنابراین اگر به redelivery در سطح پلتفرم
فراتر از watermark مربوط به restart در OpenClaw نیاز داشته باشیم، برش عمیق‌تر باقی‌مانده
یک منبع polling کاملا پایدار است. پلتفرم‌های Webhook ممکن است به HTTP ack فوری نیاز داشته باشند،
اما همچنان به inbound dedupe و intentهای ارسال خروجی پایدار نیاز دارند، زیرا webhookها می‌توانند redeliver کنند.

## Context ارسال

ارسال نیز مبتنی بر زمینه است:

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

این helper به این تبدیل می‌شود:

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

نیت باید پیش از ورودی/خروجی transport وجود داشته باشد. راه‌اندازی دوباره پس از begin اما پیش از
commit قابل بازیابی است.

مرز خطرناک پس از موفقیت پلتفرم و پیش از commit شدن رسید است. اگر یک
فرایند در آنجا از کار بیفتد، OpenClaw نمی‌تواند بداند پیام پلتفرم وجود دارد یا نه،
مگر اینکه adapter امکان idempotency بومی یا مسیر سازگارسازی رسید را فراهم کند.
این تلاش‌ها باید در `unknown_after_send` از سر گرفته شوند، نه اینکه کورکورانه دوباره اجرا شوند. Channelهایی
که سازگارسازی ندارند فقط زمانی می‌توانند بازپخش حداقل-یک‌بار را انتخاب کنند که پیام‌های
قابل مشاهدهٔ تکراری برای آن channel و رابطه، یک بده‌بستان پذیرفتنی و مستند باشد.
پل سازگارسازی SDK فعلی از adapter می‌خواهد
`reconcileUnknownSend` را اعلام کند، سپس از `durableFinal.reconcileUnknownSend` می‌خواهد
یک ورودی نامعلوم را به‌صورت `sent`، `not_sent` یا `unresolved` طبقه‌بندی کند؛ فقط `not_sent`
اجازهٔ بازپخش می‌دهد، و ورودی‌های unresolved نهایی می‌مانند یا فقط بررسی
سازگارسازی را دوباره امتحان می‌کنند.

سیاست دوام باید صریح باشد:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` یعنی هسته وقتی نمی‌تواند نیت پایدار را بنویسد باید fail closed شود.
`best_effort` می‌تواند وقتی persistence در دسترس نیست ادامه دهد. `disabled`
رفتار ارسال مستقیم قدیمی را حفظ می‌کند. در زمان مهاجرت، wrapperهای legacy و helperهای عمومی
سازگاری به‌طور پیش‌فرض `disabled` هستند؛ آن‌ها نباید از این واقعیت که یک channel
یک adapter خروجی عمومی دارد، `required` را استنتاج کنند.

زمینه‌های ارسال همچنین مالک اثرهای پس از ارسال محلی channel هستند. یک مهاجرت امن نیست
اگر تحویل پایدار رفتاری محلی را که پیش‌تر به مسیر ارسال مستقیم
channel متصل بود دور بزند. نمونه‌ها شامل cacheهای سرکوب self-echo،
نشانگرهای مشارکت در thread، anchorهای edit بومی، رندر کردن امضای مدل،
و guardهای تکراری مخصوص پلتفرم هستند. این اثرها باید پیش از اینکه آن
channel بتواند تحویل نهایی عمومی پایدار را فعال کند، یا به send adapter،
render adapter، یا یک hook نام‌دار send-context منتقل شوند.

helperهای ارسال باید رسیدها را تا انتها به فراخوانندهٔ خود برگردانند. wrapperهای پایدار
نمی‌توانند شناسه‌های پیام را حذف کنند یا نتیجهٔ تحویل channel را با
`undefined` جایگزین کنند؛ dispatcherهای بافرشده از آن شناسه‌ها برای anchorهای thread، editهای بعدی،
نهایی‌سازی preview، و سرکوب تکرار استفاده می‌کنند.

ارسال‌های fallback روی batchها عمل می‌کنند، نه payloadهای منفرد. بازنویسی‌های silent-reply،
fallback رسانه، fallback کارت، و projection قطعه‌ها همگی می‌توانند بیش از
یک پیام قابل تحویل تولید کنند، بنابراین یک زمینهٔ ارسال باید یا کل
batch پیش‌بینی‌شده را تحویل دهد یا صریحاً مستند کند چرا فقط یک payload معتبر است.

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

وقتی چنین fallbackای پایدار است، کل batch پیش‌بینی‌شده باید با
یک نیت ارسال پایدار یا یک طرح batch اتمیک دیگر نمایش داده شود. ثبت هر payload
به‌صورت تک‌به‌تک کافی نیست: خرابی میان payloadها می‌تواند یک fallback قابل مشاهدهٔ ناقص
بدون رکورد پایدار برای payloadهای باقی‌مانده به‌جا بگذارد. بازیابی باید بداند
کدام unitها از قبل رسید دارند و یا فقط unitهای گمشده را بازپخش کند یا
batch را تا زمانی که adapter آن را سازگار کند، `unknown_after_send` علامت‌گذاری کند.

## زمینهٔ زنده

رفتار preview، edit، progress و stream باید یک چرخهٔ عمر opt-in واحد باشد.

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

وضعیت زنده به‌اندازهٔ کافی پایدار است تا تکراری‌ها بازیابی یا سرکوب شوند:

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

- ارسال Telegram به‌همراه preview قابل edit، با نهایی تازه پس از سن stale شدن preview.
- ارسال Discord به‌همراه preview قابل edit، لغو در صورت رسانه/خطا/پاسخ صریح.
- stream بومی Slack یا preview پیش‌نویس بسته به شکل thread.
- نهایی‌سازی پست پیش‌نویس Mattermost.
- نهایی‌سازی رویداد پیش‌نویس Matrix یا redaction در صورت عدم تطابق.
- stream بومی progress در Teams.
- stream در QQ Bot یا fallback تجمیع‌شده.

## سطح adapter

هدف SDK عمومی باید یک subpath باشد:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
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

Send adapter:

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

Receive adapter:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

پیش از مجوزدهی preflight، هسته باید هر زمان که `origin.decode` متادیتای مبدأ OpenClaw را برمی‌گرداند،
predicate مشترک echo در OpenClaw را اجرا کند. receive adapter
واقعیت‌های پلتفرم مانند نویسندهٔ bot و شکل room را فراهم می‌کند؛ هسته مالک تصمیم drop
و ترتیب است تا channelها فیلترهای متنی را دوباره پیاده‌سازی نکنند.

Origin adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

هسته `MessageOrigin` را تنظیم می‌کند. Channelها فقط آن را به متادیتای
transport بومی و از آن ترجمه می‌کنند. Slack این را به `chat.postMessage({ metadata })` و
`message.metadata` ورودی map می‌کند؛ Matrix می‌تواند آن را به محتوای اضافی event map کند؛ channelهایی
که متادیتای بومی ندارند می‌توانند وقتی بهترین تقریب در دسترس است از registry رسید/خروجی استفاده کنند.

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

سطح عمومی جدید باید این حوزه‌های مفهومی را جذب یا منسوخ کند:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- بیشتر استفاده‌های عمومی از `outbound-runtime`
- helperهای موردی چرخهٔ عمر draft stream

subpathهای سازگاری می‌توانند به‌عنوان wrapper باقی بمانند، اما Pluginهای شخص ثالث جدید
نباید به آن‌ها نیاز داشته باشند.

Pluginهای bundled می‌توانند هنگام مهاجرت importهای helper داخلی را از طریق
subpathهای runtime رزروشده نگه دارند. مستندات عمومی باید نویسندگان Plugin را پس از ایجاد
`plugin-sdk/channel-outbound` به آن هدایت کند.

## رابطه با ورودی channel

`runtime.channel.inbound.*` در زمان مهاجرت پل runtime است.

این باید به یک adapter سازگاری تبدیل شود:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` نیز باید در ابتدا باقی بماند:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

سطح runtime قدیمی `channel.turn` حذف شد. فراخواننده‌های runtime از
`channel.inbound.*` استفاده می‌کنند؛ مستندات channel و subpathهای SDK از اسم‌های inbound/message استفاده می‌کنند.

## guardrailهای سازگاری

در زمان مهاجرت، تحویل پایدار عمومی برای هر channelای که
callback تحویل موجود آن اثرهای جانبی فراتر از «این payload را ارسال کن» دارد opt-in است.

نقطه‌های ورود legacy به‌طور پیش‌فرض non-durable هستند:

- `channel.inbound.run` و `dispatchChannelInboundReply` از callback تحویل channel استفاده می‌کنند
  مگر اینکه آن channel صریحاً یک object سیاست/گزینه‌های پایدار auditشده فراهم کند.
- `channel.inbound.runPreparedReply` تا زمانی که dispatcher آماده
  صریحاً send context را فراخوانی کند، در مالکیت channel می‌ماند.
- helperهای عمومی سازگاری مانند `recordInboundSessionAndDispatchReply`،
  `dispatchInboundReplyWithBase`، و helperهای direct-DM هرگز پیش از callback
  `deliver` یا `reply` ارائه‌شده توسط فراخواننده، تحویل پایدار عمومی تزریق نمی‌کنند.

برای typeهای پل مهاجرت، `durable: undefined` یعنی «پایدار نیست». مسیر
پایدار فقط با یک مقدار سیاست/گزینه‌های صریح فعال می‌شود. `durable:
false` می‌تواند به‌عنوان املای سازگاری باقی بماند، اما پیاده‌سازی نباید
هر channel مهاجرت‌نکرده را ملزم کند آن را اضافه کند.

کد پل فعلی باید تصمیم دوام را صریح نگه دارد:

- تحویل نهایی پایدار یک وضعیت تفکیک‌شده برمی‌گرداند. `handled_visible` و
  `handled_no_send` پایانی هستند؛ `unsupported` و `not_applicable` ممکن است به
  تحویل تحت مالکیت کانال برگردند؛ `failed` شکست ارسال را منتشر می‌کند.
- تحویل نهایی پایدار عمومی با قابلیت‌های آداپتور مانند تحویل بی‌صدا، حفظ مقصد
  پاسخ، حفظ نقل‌قول بومی، و قلاب‌های ارسال پیام کنترل می‌شود. نبود هم‌ارزی باید
  تحویل تحت مالکیت کانال را انتخاب کند، نه ارسالی عمومی که رفتار قابل مشاهده برای
  کاربر را تغییر می‌دهد.
- ارسال‌های پایدار متکی بر صف، یک ارجاع نیت تحویل را آشکار می‌کنند. فیلدهای نشست
  موجود `pendingFinalDelivery*` می‌توانند در دوره‌ی گذار شناسه‌ی نیت را حمل کنند؛
  وضعیت نهایی یک ذخیره‌گاه `MessageSendIntent` است، نه متن پاسخ منجمد به‌همراه
  فیلدهای زمینه‌ی موردی.

مسیر پایدار عمومی را برای یک کانال فعال نکنید مگر اینکه همه‌ی موارد زیر
درست باشند:

- آداپتور ارسال عمومی همان رفتار رندر و انتقال مسیر مستقیم قدیمی را اجرا می‌کند.
- اثرات جانبی محلی پس از ارسال از طریق زمینه‌ی ارسال حفظ می‌شوند.
- آداپتور رسیدها یا نتایج تحویل را با همه‌ی شناسه‌های پیام پلتفرم برمی‌گرداند.
- مسیرهای توزیع‌کننده‌ی آماده یا زمینه‌ی ارسال جدید را فراخوانی می‌کنند یا به‌صورت
  مستند خارج از تضمین پایدار باقی می‌مانند.
- تحویل جایگزین هر payload فرافکنی‌شده را مدیریت می‌کند، نه فقط اولین مورد را.
- تحویل جایگزین پایدار کل آرایه‌ی payload فرافکنی‌شده را به‌عنوان یک نیت قابل
  بازپخش یا برنامه‌ی دسته‌ای ثبت می‌کند.

خطرات مهاجرت مشخص که باید حفظ شوند:

- تحویل پایشگر iMessage پیام‌های ارسال‌شده را پس از ارسال موفق در یک حافظه‌ی نهان
  echo ثبت می‌کند. ارسال‌های نهایی پایدار همچنان باید آن حافظه‌ی نهان را پر کنند؛
  در غیر این صورت OpenClaw می‌تواند پاسخ‌های نهایی خودش را دوباره به‌عنوان
  پیام‌های ورودی کاربر دریافت کند.
- Tlon یک امضای اختیاری مدل را اضافه می‌کند و پس از پاسخ‌های گروهی، threadهای
  مشارکت‌شده را ثبت می‌کند. تحویل پایدار عمومی نباید این اثرات را دور بزند؛ یا
  آن‌ها را به آداپتورهای render/send/finalize در Tlon منتقل کنید یا Tlon را روی
  مسیر تحت مالکیت کانال نگه دارید.
- Discord و سایر توزیع‌کننده‌های آماده از قبل مالک تحویل مستقیم و رفتار پیش‌نمایش
  هستند. تا زمانی که توزیع‌کننده‌های آماده‌ی آن‌ها صراحتاً نهایی‌ها را از طریق
  زمینه‌ی ارسال مسیریابی نکنند، تحت پوشش تضمین پایدار نوبت مونتاژشده نیستند.
- تحویل جایگزین بی‌صدای Telegram باید کل آرایه‌ی payload فرافکنی‌شده را تحویل
  دهد. میان‌بر تک‌payload می‌تواند payloadهای جایگزین اضافی را پس از فرافکنی حذف
  کند.
- LINE، Zalo، Nostr، و سایر مسیرهای مونتاژشده/کمکی موجود ممکن است مدیریت توکن
  پاسخ، پروکسی رسانه، حافظه‌های نهان پیام ارسال‌شده، پاک‌سازی loading/status، یا
  مقصدهای فقط-callback داشته باشند. آن‌ها تا زمانی که این معناشناسی‌ها توسط
  آداپتور ارسال نمایش داده شوند و با تست‌ها تأیید شوند، روی تحویل تحت مالکیت
  کانال باقی می‌مانند.
- کمک‌کننده‌های Direct-DM می‌توانند یک callback پاسخ داشته باشند که تنها مقصد
  انتقال درست است. خروجی عمومی نباید از `OriginatingTo` یا `To` حدس بزند و آن
  callback را رد کند.
- خروجی شکست Gateway در OpenClaw باید برای انسان‌ها قابل مشاهده بماند، اما echoهای
  اتاق که با برچسب نویسنده‌ی ربات مشخص شده‌اند باید پیش از مجوزدهی `allowBots`
  حذف شوند. کانال‌ها نباید این را با فیلترهای پیشوند متن قابل مشاهده پیاده‌سازی
  کنند مگر به‌عنوان یک راه‌حل اضطراری کوتاه؛ قرارداد پایدار، فراداده‌ی مبدأ
  ساختاریافته است.

## ذخیره‌سازی داخلی

صف پایدار باید نیت‌های ارسال پیام را ذخیره کند، نه payloadهای پاسخ.

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

حلقه‌ی بازیابی:

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

صف باید هویت کافی را نگه دارد تا پس از راه‌اندازی مجدد بتواند از طریق همان حساب،
thread، مقصد، سیاست قالب‌بندی، و قواعد رسانه بازپخش کند.

## دسته‌های شکست

آداپتورهای کانال شکست‌های انتقال را در دسته‌های بسته طبقه‌بندی می‌کنند:

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
- `invalid_payload` را دوباره تلاش نکنید مگر اینکه یک جایگزین رندر وجود داشته باشد.
- `auth` یا `permission` را تا زمان تغییر پیکربندی دوباره تلاش نکنید.
- برای `not_found`، اجازه دهید نهایی‌سازی زنده از ویرایش به ارسال تازه برگردد،
  وقتی کانال اعلام کند که این کار امن است.
- برای `conflict`، از قواعد رسید/idempotency استفاده کنید تا تصمیم بگیرید آیا
  پیام از قبل وجود دارد یا نه.
- هر خطایی پس از اینکه آداپتور ممکن است I/O پلتفرم را کامل کرده باشد اما پیش از
  ثبت رسید رخ دهد، به `unknown_after_send` تبدیل می‌شود، مگر اینکه آداپتور بتواند
  ثابت کند عملیات پلتفرم رخ نداده است.

## نگاشت کانال

| کانال         | مهاجرت هدف                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | سیاست تأیید را به‌همراه ارسال‌های نهایی پایدار دریافت می‌کند. آداپتر زنده مالک ارسال به‌همراه پیش‌نمایش ویرایش، ارسال نهایی پیش‌نمایش کهنه، موضوعات، رد کردن پیش‌نمایش نقل‌قول-پاسخ، جایگزین رسانه، و مدیریت retry-after است.                                                                                                                                                                   |
| Discord         | آداپتر ارسال، تحویل بار مفید پایدار موجود را پوشش می‌دهد. آداپتر زنده مالک ویرایش پیش‌نویس، پیش‌نویس پیشرفت، لغو پیش‌نمایش رسانه/خطا، حفظ هدف پاسخ، و رسیدهای شناسه پیام است. پژواک‌های خرابی Gateway نوشته‌شده توسط بات را در اتاق‌های مشترک ممیزی کنید؛ اگر Discord نتواند فراداده مبدأ را روی پیام‌های عادی حمل کند، از یک رجیستری خروجی یا معادل بومی دیگر استفاده کنید. |
| Slack           | آداپتر ارسال، پست‌های عادی گفت‌وگو را مدیریت می‌کند. آداپتر زنده وقتی شکل رشته پشتیبانی کند، جریان بومی را انتخاب می‌کند، وگرنه پیش‌نمایش پیش‌نویس را. رسیدها برچسب‌های زمانی رشته را حفظ می‌کنند. آداپتر مبدأ، خرابی‌های Gateway مربوط به OpenClaw را به `chat.postMessage.metadata` در Slack نگاشت می‌کند و پژواک‌های اتاق بات برچسب‌خورده را پیش از مجوزدهی `allowBots` حذف می‌کند.                                  |
| WhatsApp        | آداپتر ارسال مالک ارسال متن/رسانه با نیت‌های نهایی پایدار است. آداپتر دریافت، اشاره گروهی و هویت فرستنده را مدیریت می‌کند. تا وقتی WhatsApp ترابری قابل ویرایش نداشته باشد، زنده می‌تواند غایب بماند.                                                                                                                                                                        |
| Matrix          | آداپتر زنده مالک ویرایش‌های رویداد پیش‌نویس، نهایی‌سازی، حذف، محدودیت‌های رسانه رمزگذاری‌شده، و جایگزین ناسازگاری هدف پاسخ است. آداپتر دریافت مالک آب‌رسانی و حذف تکرار رویداد رمزگذاری‌شده است. آداپتر مبدأ باید مبدأ خرابی Gateway مربوط به OpenClaw را در محتوای رویداد Matrix کدگذاری کند و پژواک‌های اتاق بات پیکربندی‌شده را پیش از مدیریت `allowBots` حذف کند.              |
| Mattermost      | آداپتر زنده مالک یک پست پیش‌نویس، تا کردن پیشرفت/ابزار، نهایی‌سازی درجا، و جایگزین ارسال تازه است.                                                                                                                                                                                                                                                       |
| Microsoft Teams | آداپتر زنده مالک پیشرفت بومی و رفتار جریان بلوک است. آداپتر ارسال مالک فعالیت‌ها و رسیدهای پیوست/کارت است.                                                                                                                                                                                                                                        |
| Feishu          | آداپتر رندر مالک رندر متن/کارت/خام است. آداپتر زنده مالک کارت‌های جریانی و سرکوب نهایی تکراری است. آداپتر ارسال مالک دیدگاه‌ها، نشست‌های موضوع، رسانه، و سرکوب صدا است.                                                                                                                                                                      |
| QQ Bot          | آداپتر زنده مالک جریان C2C، مهلت انباشت‌گر، و ارسال نهایی جایگزین است. آداپتر رندر مالک برچسب‌های رسانه و متن به‌عنوان صدا است.                                                                                                                                                                                                                               |
| Signal          | آداپتر ساده دریافت به‌همراه ارسال. هیچ آداپتر زنده‌ای نیست مگر اینکه signal-cli پشتیبانی ویرایش قابل اعتماد اضافه کند.                                                                                                                                                                                                                                                                |
| iMessage        | آداپتر ساده دریافت به‌همراه ارسال. ارسال iMessage باید پیش از آنکه نهایی‌های پایدار بتوانند تحویل مانیتور را دور بزنند، جمعیت‌گذاری کش پژواک مانیتور را حفظ کند.                                                                                                                                                                                                                 |
| Google Chat     | آداپتر ساده دریافت به‌همراه ارسال با رابطه رشته نگاشت‌شده به فضاها و شناسه‌های رشته. رفتار اتاق `allowBots=true` را برای پژواک‌های خرابی Gateway برچسب‌خورده OpenClaw ممیزی کنید.                                                                                                                                                                                        |
| LINE            | آداپتر ساده دریافت به‌همراه ارسال با محدودیت‌های توکن پاسخ که به‌عنوان قابلیت هدف/رابطه مدل‌سازی شده‌اند.                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | پل دریافت SDK به‌همراه آداپتر ارسال.                                                                                                                                                                                                                                                                                                                          |
| IRC             | آداپتر ساده دریافت به‌همراه ارسال، بدون رسیدهای ویرایش پایدار.                                                                                                                                                                                                                                                                                                    |
| Nostr           | آداپتر دریافت به‌همراه ارسال برای پیام‌های مستقیم رمزگذاری‌شده؛ رسیدها شناسه‌های رویداد هستند.                                                                                                                                                                                                                                                                                           |
| کانال QA      | آداپتر آزمون قرارداد برای رفتار دریافت، ارسال، زنده، تلاش دوباره، و بازیابی.                                                                                                                                                                                                                                                                                   |
| Synology Chat   | آداپتر ساده دریافت به‌همراه ارسال.                                                                                                                                                                                                                                                                                                                              |
| Tlon            | آداپتر ارسال باید پیش از فعال شدن تحویل نهایی پایدار عمومی، رندر امضای مدل و رهگیری رشته‌های مشارکت‌شده را حفظ کند.                                                                                                                                                                                                                        |
| Twitch          | آداپتر ساده دریافت به‌همراه ارسال با دسته‌بندی محدودیت نرخ.                                                                                                                                                                                                                                                                                               |
| Zalo            | آداپتر ساده دریافت به‌همراه ارسال.                                                                                                                                                                                                                                                                                                                              |
| Zalo Personal   | آداپتر ساده دریافت به‌همراه ارسال.                                                                                                                                                                                                                                                                                                                              |

## برنامه مهاجرت

### مرحله ۱: دامنه پیام داخلی

- نوع‌های `src/channels/message/*` را برای پیام‌ها، هدف‌ها، روابط،
  مبدأها، رسیدها، قابلیت‌ها، نیت‌های پایدار، زمینه دریافت، زمینه ارسال،
  زمینه زنده، و کلاس‌های خرابی اضافه کنید.
- `origin?: MessageOrigin` را به نوع بار مفید پل مهاجرت که توسط
  تحویل پاسخ فعلی استفاده می‌شود اضافه کنید، سپس با جایگزین شدن بارهای مفید پاسخ در بازآرایی،
  آن فیلد را به `ChannelMessage` و نوع‌های پیام رندرشده منتقل کنید.
- این شکل را تا وقتی آداپترها و آزمون‌ها آن را اثبات کنند، داخلی نگه دارید.
- آزمون‌های واحد خالص برای گذارهای وضعیت و سریال‌سازی اضافه کنید.

### مرحله ۲: هسته ارسال پایدار

- صف خروجی موجود را از پایداری بار مفید پاسخ به نیت‌های ارسال پیام
  پایدار منتقل کنید.
- اجازه دهید یک نیت ارسال پایدار، آرایه بار مفید طرح‌ریزی‌شده یا برنامه دسته‌ای را حمل کند، نه
  فقط یک بار مفید پاسخ.
- رفتار بازیابی صف فعلی را از طریق تبدیل سازگاری حفظ کنید.
- کاری کنید `deliverOutboundPayloads`، `messages.send` را فراخوانی کند.
- پس از آنکه آداپتر ایمنی پخش دوباره را اعلام کرد، پایداری ارسال نهایی را پیش‌فرض کنید و وقتی نیت پایدار
  در چرخه‌عمر جدید پیام قابل نوشتن نیست، بسته شکست بخورید. مسیرهای سازگاری اجراکننده ورودی و SDK موجود
  در این مرحله به‌طور پیش‌فرض ارسال مستقیم باقی می‌مانند.
- رسیدها را به‌صورت سازگار ثبت کنید.
- رسیدها و نتایج تحویل را به فراخواننده توزیع‌کننده اصلی برگردانید به‌جای آنکه ارسال پایدار
  به‌عنوان یک اثر جانبی پایانی رفتار شود.
- مبدأ پیام را از طریق نیت‌های ارسال پایدار ماندگار کنید تا بازیابی، پخش دوباره، و
  ارسال‌های تکه‌ای منشأ عملیاتی OpenClaw را حفظ کنند.

### مرحله ۳: پل ورودی کانال

- `channel.inbound.run` و `dispatchChannelInboundReply` را روی
  `messages.receive` و `messages.send` دوباره پیاده‌سازی کنید.
- نوع‌های واقعیت فعلی را پایدار نگه دارید.
- رفتار قدیمی را به‌طور پیش‌فرض حفظ کنید. کانال نوبت مونتاژشده فقط وقتی پایدار می‌شود
  که آداپتر آن با یک سیاست پایداری ایمن برای پخش دوباره صریحاً اعلام آمادگی کند.
- `durable: false` را به‌عنوان راه گریز سازگاری برای مسیرهایی نگه دارید که ویرایش‌های بومی را نهایی می‌کنند
  و هنوز نمی‌توانند با ایمنی پخش دوباره شوند، اما برای محافظت از کانال‌های مهاجرت‌نکرده
  به نشانگرهای `false` تکیه نکنید.
- پایداری پیش‌فرض نوبت مونتاژشده را فقط در چرخه‌عمر جدید پیام فعال کنید، پس از آنکه
  نگاشت کانال ثابت کند مسیر ارسال عمومی معناشناسی تحویل کانال قدیمی را حفظ می‌کند.

### مرحله ۴: پل توزیع‌کننده آماده

- `deliverDurableInboundReplyPayload` را با یک پل زمینهٔ ارسال جایگزین کنید.
- helper قدیمی را به‌عنوان wrapper نگه دارید.
- ابتدا Telegram، WhatsApp، Slack، Signal، iMessage، و Discord را منتقل کنید، چون
  آن‌ها از قبل کار نهاییِ پایدار یا مسیرهای ارسال ساده‌تری دارند.
- هر dispatcher آماده‌شده را تا زمانی که صراحتاً به زمینهٔ ارسال opt in نکرده است، بدون پوشش در نظر بگیرید.
  مستندات و ورودی‌های changelog باید بگویند «نوبت‌های کانال مونتاژشده»
  یا مسیرهای کانال مهاجرت‌داده‌شده را نام ببرند، نه اینکه ادعای همهٔ
  پاسخ‌های نهایی خودکار را مطرح کنند.
- `recordInboundSessionAndDispatchReply`، helperهای direct-DM، و helperهای عمومی سازگاری مشابه
  را با حفظ رفتار نگه دارید. آن‌ها می‌توانند بعداً opt-in صریح
  زمینهٔ ارسال را در معرض استفاده قرار دهند، اما نباید قبل از callback تحویلِ متعلق به caller،
  به‌طور خودکار تحویل پایدار عمومی را امتحان کنند.

### فاز ۵: چرخهٔ عمر زندهٔ یکپارچه

- `messages.live` را با دو adapter اثبات بسازید:
  - Telegram برای ارسال، ویرایش، و ارسال نهایی stale.
  - Matrix برای نهایی‌سازی پیش‌نویس و fallback بازپوشانی.
- سپس Discord، Slack، Mattermost، Teams، QQ Bot، و Feishu را مهاجرت دهید.
- کد تکراری نهایی‌سازی preview را فقط بعد از اینکه هر کانال
  تست‌های parity داشته باشد حذف کنید.

### فاز ۶: SDK عمومی

- `openclaw/plugin-sdk/channel-outbound` را اضافه کنید.
- آن را به‌عنوان API ترجیحی Plugin کانال مستند کنید.
- exportهای package، inventory نقطهٔ ورود، baselineهای API تولیدشده، و
  مستندات Plugin SDK را به‌روزرسانی کنید.
- `MessageOrigin`، hookهای encode/decode مبدأ، و predicate مشترک
  `shouldDropOpenClawEcho` را در سطح SDK کانال-outbound وارد کنید.
- wrapperهای سازگاری را برای subpathهای قدیمی نگه دارید.
- helperهای SDK با نام reply را پس از مهاجرت Pluginهای bundled،
  در مستندات deprecated علامت‌گذاری کنید.

### فاز ۷: همهٔ ارسال‌کننده‌ها

همهٔ producerهای outbound غیر-reply را به `messages.send` منتقل کنید:

- اعلان‌های cron و Heartbeat
- تکمیل taskها
- نتایج hook
- promptهای approval و نتایج approval
- ارسال‌های ابزار پیام
- اعلان‌های تکمیل subagent
- ارسال‌های صریح CLI یا Control UI
- مسیرهای automation/broadcast

اینجاست که مدل دیگر «پاسخ‌های agent» نیست و به «OpenClaw پیام
می‌فرستد» تبدیل می‌شود.

### فاز ۸: حذف سازگاری با نام Turn

- wrapperهای با نام inbound/message را به‌عنوان پنجرهٔ سازگاری نگه دارید.
- یادداشت‌های مهاجرت را منتشر کنید.
- تست‌های سازگاری Plugin SDK را در برابر importهای قدیمی اجرا کنید.
- helperهای داخلی قدیمی را فقط بعد از اینکه هیچ Plugin bundled به آن‌ها نیاز نداشت
  و contractهای third-party جایگزین پایداری داشتند، حذف یا پنهان کنید.

## برنامهٔ تست

تست‌های واحد:

- serialization و بازیابی intent ارسال پایدار.
- استفادهٔ مجدد از کلید idempotency و سرکوب duplicate.
- commit رسید و رد کردن replay.
- بازیابی `unknown_after_send` که وقتی adapter از reconciliation پشتیبانی می‌کند،
  پیش از replay آن را reconcile می‌کند.
- سیاست طبقه‌بندی failure.
- توالی سیاست ack دریافت.
- نگاشت relation برای ارسال‌های reply، followup، system، و broadcast.
- factory مبدأ failure مربوط به Gateway و predicate `shouldDropOpenClawEcho`.
- حفظ مبدأ در normalization payload، chunking، serialization صف پایدار،
  و بازیابی.

تست‌های integration:

- adapter سادهٔ `channel.inbound.run` همچنان record می‌کند و می‌فرستد.
- تحویل legacy assembled-event پایدار نمی‌شود مگر اینکه کانال
  صراحتاً opt in کند.
- پل `channel.inbound.runPreparedReply` همچنان record و finalize می‌کند.
- helperهای عمومی سازگاری به‌صورت پیش‌فرض callbackهای تحویلِ متعلق به caller را فراخوانی می‌کنند
  و قبل از آن callbackها generic-send انجام نمی‌دهند.
- تحویل fallback پایدار پس از restart کل آرایهٔ payload projected را replay می‌کند
  و پس از یک crash اولیه نمی‌تواند payloadهای بعدی را ثبت‌نشده باقی بگذارد.
- تحویل پایدار assembled-event شناسه‌های پیام platform را به dispatcher بافرشده
  برمی‌گرداند.
- hookهای تحویل سفارشی وقتی تحویل پایدار disabled یا unavailable است، همچنان
  شناسه‌های پیام platform را برمی‌گردانند.
- reply نهایی بین تکمیل assistant و ارسال platform از restart جان سالم به در می‌برد.
- پیش‌نویس preview وقتی مجاز باشد درجا finalize می‌شود.
- وقتی media/error/reply-target mismatch نیازمند تحویل عادی باشد، پیش‌نویس preview
  cancel یا redact می‌شود.
- streaming بلاک و streaming preview هر دو متن یکسان را تحویل نمی‌دهند.
- رسانه‌ای که زودتر stream شده است در تحویل نهایی duplicate نمی‌شود.

تست‌های کانال:

- reply موضوع Telegram با ack polling که تا watermark تکمیل‌شدهٔ safe
  متعلق به receive context تأخیر دارد.
- بازیابی polling Telegram برای updateهای accepted-but-not-delivered که توسط
  مدل offset safe-completed پایدارشده پوشش داده شده‌اند.
- preview stale در Telegram نهایی تازه می‌فرستد و preview را پاک‌سازی می‌کند.
- fallback silent در Telegram همهٔ payloadهای fallback projected را می‌فرستد.
- پایداری fallback silent در Telegram کل آرایهٔ fallback projected را
  به‌صورت اتمیک ثبت می‌کند، نه یک intent پایدار single-payload در هر iteration حلقه.
- cancel preview در Discord هنگام media/error/reply صریح.
- finalهای dispatcher آماده‌شدهٔ Discord پیش از اینکه docs یا changelog
  ادعای پایداری final-reply در Discord داشته باشند، از مسیر زمینهٔ ارسال عبور می‌کنند.
- ارسال‌های نهایی پایدار iMessage کش echo پیام ارسالیِ monitor را پر می‌کنند.
- مسیرهای تحویل legacy در LINE، Zalo، و Nostr تا زمانی که تست‌های parity adapter آن‌ها وجود نداشته باشد،
  توسط ارسال پایدار عمومی bypass نمی‌شوند.
- تحویل callback در Direct-DM/Nostr authoritative باقی می‌ماند مگر اینکه صراحتاً
  به target پیام کامل و adapter ارسال replay-safe مهاجرت داده شود.
- پیام‌های failure مربوط به Slack tagged OpenClaw gateway در outbound قابل مشاهده می‌مانند،
  echoهای bot-room tagged پیش از `allowBots` drop می‌شوند، و پیام‌های bot بدون tag با
  همان متن قابل مشاهده همچنان authorization عادی bot را دنبال می‌کنند.
- fallback stream بومی Slack به draft preview در DMهای top-level.
- نهایی‌سازی preview و fallback redaction در Matrix.
- echoهای room مربوط به Matrix tagged OpenClaw gateway-failure از accountهای bot پیکربندی‌شده
  پیش از handling `allowBots` drop می‌شوند.
- auditهای cascade مربوط به gateway-failure در room مشترک Discord و Google Chat
  پیش از ادعای حفاظت عمومی در آنجا، modeهای `allowBots` را پوشش می‌دهند.
- نهایی‌سازی draft و fallback fresh-send در Mattermost.
- نهایی‌سازی progress بومی Teams.
- سرکوب final duplicate در Feishu.
- fallback timeout accumulator در QQ Bot.
- ارسال‌های نهایی پایدار Tlon rendering امضای مدل و tracking threadهای participated را حفظ می‌کنند.
- ارسال‌های نهایی پایدار ساده در WhatsApp، Signal، iMessage، Google Chat، LINE، IRC، Nostr، Nextcloud Talk،
  Synology Chat، Tlon، Twitch، Zalo، و Zalo Personal.

اعتبارسنجی:

- فایل‌های هدفمند Vitest هنگام توسعه.
- `pnpm check:changed` در Testbox برای کل سطح تغییرکرده.
- `pnpm check` گسترده‌تر در Testbox پیش از land کردن refactor کامل یا پس از
  تغییرات SDK/export عمومی.
- smoke زنده یا qa-channel برای حداقل یک کانال دارای قابلیت edit و یک
  کانال سادهٔ فقط-ارسال پیش از حذف wrapperهای سازگاری.

## پرسش‌های باز

- اینکه آیا Telegram در نهایت باید source runner مربوط به grammY را با یک
  source polling کاملاً پایدار جایگزین کند که بتواند redelivery سطح platform را کنترل کند، نه
  فقط watermark restart پایدارشدهٔ OpenClaw را.
- اینکه آیا state مربوط به preview زندهٔ پایدار باید در همان record صف
  intent ارسال نهایی ذخیره شود یا در یک store sibling برای live-state.
- wrapperهای سازگاری تا چه مدت پس از ship شدن
  `plugin-sdk/channel-outbound` مستند باقی می‌مانند.
- اینکه آیا Pluginهای third-party باید adapterهای receive را مستقیماً پیاده‌سازی کنند یا فقط
  hookهای normalize/send/live را از طریق `defineChannelMessageAdapter` فراهم کنند.
- کدام fieldهای رسید برای expose شدن در SDK عمومی در برابر state داخلی runtime
  امن هستند.
- اینکه آیا side effectهایی مانند کش‌های self-echo و markerهای participated-thread
  باید به‌صورت hookهای زمینهٔ ارسال، stepهای finalize متعلق به adapter، یا
  subscriberهای رسید مدل شوند.
- کدام کانال‌ها metadata مبدأ بومی دارند، کدام‌یک به registryهای outbound پایدار نیاز دارند،
  و کدام‌یک نمی‌توانند سرکوب قابل‌اعتماد echo بین botها ارائه دهند.

## معیارهای پذیرش

- هر کانال پیام bundled خروجی نهایی قابل مشاهده را از طریق
  `messages.send` می‌فرستد.
- هر کانال پیام inbound از طریق `messages.receive` یا یک
  wrapper سازگاری مستند وارد می‌شود.
- هر کانال preview/edit/stream از `messages.live` برای state draft و
  finalization استفاده می‌کند.
- `channel.inbound` فقط یک wrapper است.
- helperهای SDK با نام reply، exportهای سازگاری هستند، نه مسیر توصیه‌شده.
- بازیابی پایدار می‌تواند ارسال‌های نهایی pending را پس از restart بدون از دست دادن
  پاسخ نهایی یا duplicate کردن ارسال‌های از قبل commit شده replay کند؛ ارسال‌هایی که
  نتیجهٔ platform آن‌ها نامعلوم است پیش از replay reconcile می‌شوند یا برای آن adapter
  به‌صورت at-least-once مستند می‌شوند.
- ارسال‌های نهایی پایدار وقتی intent پایدار قابل نوشتن نیست fail closed می‌شوند،
  مگر اینکه caller صراحتاً یک mode غیرپایدار مستند را انتخاب کرده باشد.
- helperهای سازگاری legacy SDK به‌صورت پیش‌فرض از تحویل مستقیمِ
  متعلق به کانال استفاده می‌کنند؛ ارسال پایدار عمومی فقط opt-in صریح است.
- رسیدها همهٔ شناسه‌های پیام platform را برای تحویل‌های چندبخشی و یک
  شناسهٔ primary را برای سهولت threading/edit حفظ می‌کنند.
- wrapperهای پایدار پیش از جایگزینی callbackهای تحویل مستقیم، side effectهای local کانال را حفظ می‌کنند.
- dispatcherهای آماده‌شده تا زمانی که مسیر تحویل نهایی آن‌ها صراحتاً
  از زمینهٔ ارسال استفاده نکند، پایدار شمرده نمی‌شوند.
- تحویل fallback هر payload projected را مدیریت می‌کند.
- تحویل fallback پایدار هر payload projected را در یک intent قابل replay
  یا batch plan ثبت می‌کند.
- خروجی failure مربوط به Gateway که از OpenClaw نشئت گرفته برای انسان‌ها قابل مشاهده است، اما
  echoهای room نوشته‌شده توسط bot و دارای tag پیش از authorization bot در کانال‌هایی
  که پشتیبانی از contract مبدأ را اعلام می‌کنند drop می‌شوند.
- مستندات send، receive، live، state، رسیدها، relationها، سیاست failure،
  مهاجرت، و پوشش تست را توضیح می‌دهند.

## مرتبط

- [پیام‌ها](/fa/concepts/messages)
- [Streaming و chunking](/fa/concepts/streaming)
- [پیش‌نویس‌های progress](/fa/concepts/progress-drafts)
- [سیاست retry](/fa/concepts/retry)
- [API inbound کانال](/fa/plugins/sdk-channel-inbound)
