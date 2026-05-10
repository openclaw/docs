---
read_when:
    - بازآرایی رفتار ارسال یا دریافت کانال
    - تغییر نوبت کانال، ارسال پاسخ، صف خروجی، پخش جریانی پیش‌نمایش، یا APIهای پیام SDK Plugin
    - طراحی یک Plugin کانال جدید که به ارسال‌های ماندگار، رسیدها، پیش‌نمایش‌ها، ویرایش‌ها یا تلاش‌های مجدد نیاز دارد
summary: طرح طراحی برای چرخهٔ حیات یکپارچه و پایدار دریافت، ارسال، پیش‌نمایش، ویرایش و جریان‌دهی پیام
title: بازآرایی چرخهٔ حیات پیام
x-i18n:
    generated_at: "2026-05-10T19:35:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

این صفحه، طراحی هدف برای جایگزینی کمک‌کننده‌های پراکندهٔ نوبت کانال، ارسال پاسخ،
استریم پیش‌نمایش، و تحویل خروجی با یک چرخهٔ عمر پیام پایدار است.

خلاصهٔ کوتاه:

- بدوی‌های هسته باید **دریافت** و **ارسال** باشند، نه **پاسخ**.
- پاسخ فقط یک رابطه روی یک پیام خروجی است.
- نوبت یک سهولت برای پردازش ورودی است، نه مالک تحویل.
- ارسال باید مبتنی بر زمینه باشد: `begin`، رندر، پیش‌نمایش یا استریم، ارسال نهایی،
  commit، fail.
- دریافت هم باید مبتنی بر زمینه باشد: نرمال‌سازی، حذف تکراری، مسیریابی، ثبت،
  dispatch، تأیید پلتفرم، fail.
- SDK عمومی Plugin باید به یک سطح کوچک پیام کانال فروکاسته شود.

## مشکلات

پشتهٔ کانال فعلی از چند نیاز محلی معتبر رشد کرده است:

- آداپتورهای ورودی ساده از `runtime.channel.turn.run` استفاده می‌کنند.
- آداپتورهای غنی از `runtime.channel.turn.runPrepared` استفاده می‌کنند.
- کمک‌کننده‌های قدیمی از `dispatchInboundReplyWithBase`،
  `recordInboundSessionAndDispatchReply`، کمک‌کننده‌های payload پاسخ، تکه‌بندی پاسخ،
  ارجاع‌های پاسخ، و کمک‌کننده‌های runtime خروجی استفاده می‌کنند.
- استریم پیش‌نمایش در dispatcherهای اختصاصی کانال زندگی می‌کند.
- پایداری تحویل نهایی پیرامون مسیرهای موجود payload پاسخ در حال اضافه شدن است.

این شکل، باگ‌های محلی را رفع می‌کند، اما OpenClaw را با مفاهیم عمومی بیش از حد
و جاهای بیش از حدی باقی می‌گذارد که معناشناسی تحویل می‌تواند در آن‌ها از هم دور شود.

مسئلهٔ قابلیت اطمینانی که این را آشکار کرد این است:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

ناوردای هدف گسترده‌تر از Telegram است: وقتی هسته تصمیم می‌گیرد یک پیام خروجی
قابل مشاهده باید وجود داشته باشد، قصد باید پیش از تلاش برای ارسال پلتفرمی پایدار
شود، و رسید پلتفرم باید پس از موفقیت commit شود. این به OpenClaw بازیابی
حداقل-یک‌بار می‌دهد. رفتار دقیقاً-یک‌بار فقط برای آداپتورهایی وجود دارد که بتوانند
idempotency بومی را اثبات کنند یا تلاش نامشخص-پس-از-ارسال را پیش از بازپخش با وضعیت
پلتفرم تطبیق دهند.

این وضعیت نهایی این بازآرایی است، نه توصیف همهٔ مسیرهای فعلی. در طول مهاجرت،
کمک‌کننده‌های خروجی موجود هنوز می‌توانند وقتی نوشتن صف به صورت بهترین‌تلاش شکست
می‌خورد به ارسال مستقیم سقوط کنند. بازآرایی فقط وقتی کامل است که ارسال‌های نهایی
پایدار به‌صورت بسته شکست بخورند یا با یک سیاست غیرپایدار مستند به‌صراحت opt out کنند.

## اهداف

- یک چرخهٔ عمر هسته برای همهٔ مسیرهای دریافت و ارسال پیام کانال.
- ارسال‌های نهایی پایدار به‌صورت پیش‌فرض در چرخهٔ عمر پیام جدید پس از اینکه یک آداپتور
  رفتار امن برای بازپخش را اعلام کند.
- معناشناسی مشترک برای پیش‌نمایش، ویرایش، استریم، نهایی‌سازی، تلاش مجدد، بازیابی، و رسید.
- سطح کوچک SDK مربوط به Plugin که Pluginهای شخص ثالث بتوانند آن را یاد بگیرند و نگه‌داری کنند.
- سازگاری برای فراخوان‌های موجود `channel.turn` در طول مهاجرت.
- نقاط توسعهٔ روشن برای قابلیت‌های جدید کانال.
- بدون شاخه‌های اختصاصی پلتفرم در هسته.
- بدون پیام‌های کانال token-delta. استریم کانال همچنان پیش‌نمایش پیام،
  ویرایش، الحاق، یا تحویل بلوک کامل‌شده می‌ماند.
- فرادادهٔ ساختاریافته با منشأ OpenClaw برای خروجی عملیاتی/سیستمی تا شکست‌های قابل مشاهدهٔ
  Gateway به‌عنوان promptهای تازه دوباره وارد اتاق‌های مشترک دارای بات نشوند.

## غیرهدف‌ها

- `runtime.channel.turn.*` را در فاز اول حذف نکنید.
- هر کانال را مجبور به رفتار یکسان transport بومی نکنید.
- به هسته موضوعات Telegram، استریم‌های بومی Slack، حذف‌های Matrix،
  کارت‌های Feishu، صدای QQ، یا فعالیت‌های Teams را آموزش ندهید.
- همهٔ کمک‌کننده‌های داخلی مهاجرت را به‌عنوان API پایدار SDK منتشر نکنید.
- تلاش‌های مجدد را وادار به بازپخش عملیات پلتفرمی غیر idempotent کامل‌شده نکنید.

## مدل مرجع

Vercel Chat یک مدل ذهنی عمومی خوب دارد:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- متدهای آداپتور مانند `postMessage`، `editMessage`، `deleteMessage`،
  `stream`، `startTyping`، و دریافت‌های تاریخچه
- یک آداپتور وضعیت برای حذف تکراری، قفل‌ها، صف‌ها، و پایداری

OpenClaw باید واژگان را وام بگیرد، نه سطح را کپی کند.

آنچه OpenClaw فراتر از آن مدل نیاز دارد:

- قصدهای ارسال خروجی پایدار پیش از فراخوانی‌های مستقیم transport.
- زمینه‌های ارسال صریح با begin، commit، و fail.
- زمینه‌های دریافت که سیاست تأیید پلتفرم را می‌شناسند.
- رسیدهایی که پس از restart باقی می‌مانند و می‌توانند ویرایش‌ها، حذف‌ها، بازیابی، و
  سرکوب تکراری‌ها را هدایت کنند.
- یک SDK عمومی کوچک‌تر. Pluginهای bundled می‌توانند از کمک‌کننده‌های داخلی runtime استفاده کنند، اما
  Pluginهای شخص ثالث باید یک API منسجم پیام ببینند.
- رفتار اختصاصی عامل: نشست‌ها، transcriptها، استریم بلوک، پیشرفت ابزار،
  approvalها، دستورهای رسانه‌ای، پاسخ‌های بی‌صدا، و تاریخچهٔ اشاره در گروه.

وعده‌های سبک `thread.post()` برای OpenClaw کافی نیستند. آن‌ها مرز تراکنشی را پنهان می‌کنند
که تصمیم می‌گیرد آیا یک ارسال قابل بازیابی است یا نه.

## مدل هسته

دامنهٔ جدید باید زیر یک namespace داخلی هسته مانند
`src/channels/message/*` زندگی کند.

چهار مفهوم دارد:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` مالک چرخهٔ عمر ورودی است.

`send` مالک چرخهٔ عمر خروجی است.

`live` مالک پیش‌نمایش، ویرایش، پیشرفت، و وضعیت استریم است.

`state` مالک ذخیره‌سازی قصد پایدار، رسیدها، idempotency، بازیابی، قفل‌ها، و
حذف تکراری است.

## اصطلاحات پیام

### پیام

یک پیام نرمال‌شده مستقل از پلتفرم است:

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

هدف توصیف می‌کند پیام کجا زندگی می‌کند:

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

پاسخ یک رابطه است، نه ریشهٔ API:

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

این اجازه می‌دهد همان مسیر ارسال، پاسخ‌های عادی، اعلان‌های cron، promptهای approval،
تکمیل task، ارسال‌های message-tool، ارسال‌های CLI یا رابط کاربری کنترل، نتایج subagent،
و ارسال‌های automation را مدیریت کند.

### منشأ

منشأ توضیح می‌دهد چه کسی یک پیام را تولید کرده و OpenClaw باید echoهای آن پیام را چگونه
درمان کند. این از رابطه جداست: یک پیام می‌تواند پاسخ به کاربر باشد
و همچنان خروجی عملیاتی با منشأ OpenClaw باشد.

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

هسته مالک معنای خروجی با منشأ OpenClaw است. کانال‌ها مالک نحوهٔ کدگذاری آن
منشأ در transport خود هستند.

اولین کاربرد لازم، خروجی شکست Gateway است. انسان‌ها همچنان باید پیام‌هایی مانند
"Agent failed before reply" یا "Missing API key" را ببینند، اما خروجی عملیاتی
برچسب‌خوردهٔ OpenClaw نباید وقتی `allowBots` فعال است در اتاق‌های مشترک
به‌عنوان ورودی نوشته‌شده توسط بات پذیرفته شود.

### رسید

رسیدها first-class هستند:

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

رسیدها پل بین قصد پایدار و ویرایش آینده، حذف، نهایی‌سازی پیش‌نمایش،
سرکوب تکراری، و بازیابی هستند.

یک رسید می‌تواند یک پیام پلتفرمی یا یک تحویل چندبخشی را توصیف کند. متن تکه‌بندی‌شده،
رسانه به‌علاوهٔ متن، صدا به‌علاوهٔ متن، و fallbackهای کارت باید همهٔ شناسه‌های پلتفرمی
را حفظ کنند و همچنان یک شناسهٔ اصلی برای threading و ویرایش‌های بعدی ارائه دهند.

## زمینهٔ دریافت

دریافت نباید یک فراخوانی کمک‌کنندهٔ ساده باشد. هسته به زمینه‌ای نیاز دارد که
حذف تکراری، مسیریابی، ثبت نشست، و سیاست تأیید پلتفرم را بشناسد.

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

تأیید یک چیز واحد نیست. قرارداد دریافت باید این سیگنال‌ها را جدا نگه دارد:

- **تأیید transport:** به webhook یا socket پلتفرم می‌گوید که OpenClaw پاکت رویداد را پذیرفته است.
  بعضی پلتفرم‌ها پیش از dispatch به این نیاز دارند.
- **تأیید offset در polling:** یک cursor را جلو می‌برد تا همان رویداد دوباره fetch نشود.
  این نباید از کاری که قابل بازیابی نیست جلوتر برود.
- **تأیید ثبت ورودی:** تأیید می‌کند OpenClaw فرادادهٔ ورودی کافی را برای
  حذف تکراری و مسیریابی یک redelivery پایدار کرده است.
- **رسید قابل مشاهده برای کاربر:** رفتار اختیاری read/status/typing؛ هرگز یک
  مرز پایداری نیست.

`ReceiveAckPolicy` فقط تأیید transport یا polling را کنترل می‌کند. نباید
برای read receiptها یا status reactionها دوباره استفاده شود.

پیش از مجوزدهی بات، وقتی کانال می‌تواند فرادادهٔ منشأ پیام را decode کند،
دریافت باید سیاست echo مشترک OpenClaw را اعمال کند:

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

این drop مبتنی بر برچسب است، نه مبتنی بر متن. یک پیام اتاق نوشته‌شده توسط بات با همان
متن قابل مشاهدهٔ شکست Gateway اما بدون فرادادهٔ منشأ OpenClaw همچنان از مجوزدهی عادی
`allowBots` عبور می‌کند.

سیاست تأیید صریح است:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

اکنون polling در Telegram از سیاست تأیید زمینهٔ دریافت برای watermark پایدار
restart خود استفاده می‌کند. tracker همچنان updateهای grammY را هنگام ورود به زنجیرهٔ
middleware مشاهده می‌کند، اما OpenClaw فقط شناسهٔ update کامل‌شدهٔ امن را پس از
dispatch موفق پایدار می‌کند و updateهای شکست‌خورده یا پایین‌ترِ pending را پس از
restart قابل بازپخش باقی می‌گذارد. offset مربوط به fetch در `getUpdates` بالادستی
Telegram همچنان توسط کتابخانهٔ polling کنترل می‌شود، بنابراین برش عمیق‌تر باقی‌مانده
یک منبع polling کاملاً پایدار است، اگر به redelivery در سطح پلتفرم فراتر از
watermark مربوط به restart در OpenClaw نیاز داشته باشیم. پلتفرم‌های Webhook ممکن است
به تأیید HTTP فوری نیاز داشته باشند، اما همچنان به حذف تکراری ورودی و قصدهای ارسال
خروجی پایدار نیاز دارند، چون webhookها می‌توانند redeliver کنند.

## زمینهٔ ارسال

ارسال هم مبتنی بر زمینه است:

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

این helper به این شکل گسترش می‌یابد:

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

intent باید پیش از I/O انتقال وجود داشته باشد. راه‌اندازی دوباره پس از begin اما پیش از
commit قابل بازیابی است.

مرز خطرناک پس از موفقیت پلتفرم و پیش از commit شدن receipt است. اگر یک
فرایند در آن‌جا از کار بیفتد، OpenClaw نمی‌تواند بداند که آیا پیام پلتفرم وجود دارد یا نه،
مگر این‌که adapter بومی‌بودن idempotency یا مسیر سازش receipt را فراهم کند.
آن تلاش‌ها باید در `unknown_after_send` از سر گرفته شوند، نه این‌که کورکورانه تکرار شوند. کانال‌هایی
که سازش ندارند، فقط زمانی می‌توانند بازپخش at-least-once را انتخاب کنند که پیام‌های
قابل مشاهده تکراری، برای آن کانال و relation، یک مصالحه پذیرفتنی و مستند باشد.
پل سازش فعلی SDK نیاز دارد adapter
`reconcileUnknownSend` را اعلام کند، سپس از `durableFinal.reconcileUnknownSend` می‌خواهد
یک ورودی ناشناخته را به‌عنوان `sent`، `not_sent`، یا `unresolved` طبقه‌بندی کند؛ فقط `not_sent`
اجازه بازپخش می‌دهد، و ورودی‌های unresolved در حالت پایانی می‌مانند یا فقط بررسی
سازش را دوباره تلاش می‌کنند.

سیاست durability باید صریح باشد:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` یعنی core باید وقتی نمی‌تواند durable intent را بنویسد، fail closed کند.
`best_effort` می‌تواند وقتی persistence در دسترس نیست ادامه دهد. `disabled` رفتار قدیمی
ارسال مستقیم را نگه می‌دارد. در طول مهاجرت، wrapperهای قدیمی و helperهای سازگاری عمومی
به‌صورت پیش‌فرض `disabled` هستند؛ آن‌ها نباید از این واقعیت که یک کانال adapter خروجی عمومی دارد،
`required` را استنباط کنند.

Send contextها همچنین مالک اثرات پس از ارسال محلی کانال هستند. مهاجرت ایمن نیست
اگر durable delivery رفتار محلی‌ای را دور بزند که قبلا به مسیر ارسال مستقیم کانال وصل بود.
نمونه‌ها شامل cacheهای سرکوب self-echo،
نشانگرهای مشارکت thread، anchorهای ویرایش بومی، رندر model-signature،
و guardهای تکرار اختصاصی پلتفرم هستند. این اثرات باید یا به
send adapter، render adapter، یا یک hook نام‌دار send-context منتقل شوند، پیش از آن‌که
آن کانال بتواند تحویل نهایی durable عمومی را فعال کند.

Send helperها باید receiptها را تا خود caller برگردانند. wrapperهای durable
نمی‌توانند message idها را نادیده بگیرند یا نتیجه تحویل کانال را با
`undefined` جایگزین کنند؛ dispatcherهای buffered از آن idها برای anchorهای thread، ویرایش‌های بعدی،
نهایی‌سازی preview، و سرکوب تکرار استفاده می‌کنند.

ارسال‌های fallback روی batchها عمل می‌کنند، نه payloadهای تکی. بازنویسی‌های silent-reply،
fallback رسانه، fallback کارت، و projection قطعه همگی می‌توانند بیش از
یک پیام قابل تحویل تولید کنند، بنابراین یک send context باید یا کل
batch پیش‌بینی‌شده را تحویل دهد یا صریحا مستند کند چرا فقط یک payload معتبر است.

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

وقتی چنین fallbackای durable است، کل batch پیش‌بینی‌شده باید با
یک durable send intent یا یک برنامه batch اتمیک دیگر نمایش داده شود. ثبت هر payload
به‌صورت تک‌به‌تک کافی نیست: crash بین payloadها می‌تواند یک fallback قابل مشاهده ناقص
بدون رکورد durable برای payloadهای باقی‌مانده به جا بگذارد. بازیابی باید بداند
کدام unitها از قبل receipt دارند و یا فقط unitهای جاافتاده را بازپخش کند یا
batch را تا زمانی که adapter آن را سازش دهد، به‌عنوان `unknown_after_send` علامت‌گذاری کند.

## زمینه زنده

رفتار preview، ویرایش، progress، و stream باید یک lifecycle opt-in باشد.

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

state زنده به‌اندازه‌ای durable است که تکرارها را بازیابی یا سرکوب کند:

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

- ارسال Telegram به‌همراه ویرایش preview، با final تازه پس از کهنه شدن preview.
- ارسال Discord به‌همراه ویرایش preview، لغو روی رسانه/خطا/پاسخ صریح.
- stream بومی Slack یا draft preview بسته به شکل thread.
- نهایی‌سازی draft post در Mattermost.
- نهایی‌سازی draft event در Matrix یا redaction در صورت mismatch.
- stream پیشرفت بومی Teams.
- stream یا fallback انباشته QQ Bot.

## سطح adapter

هدف SDK عمومی باید یک subpath واحد باشد:

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

پیش از مجوزدهی preflight، core باید predicate echo مشترک OpenClaw را
هر زمان که `origin.decode` metadata با origin مربوط به OpenClaw برگرداند اجرا کند. Receive adapter
واقعیت‌های پلتفرم مانند author بات و شکل room را فراهم می‌کند؛ core مالک تصمیم drop
و ترتیب است تا کانال‌ها فیلترهای متنی را دوباره پیاده‌سازی نکنند.

Origin adapter:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

Core مقدار `MessageOrigin` را تنظیم می‌کند. کانال‌ها فقط آن را به metadata انتقال بومی و از آن
ترجمه می‌کنند. Slack این را به `chat.postMessage({ metadata })` و
`message.metadata` ورودی map می‌کند؛ Matrix می‌تواند آن را به محتوای اضافی event map کند؛ کانال‌هایی
که metadata بومی ندارند می‌توانند از registry مربوط به receipt/outbound استفاده کنند، وقتی که این
بهترین تقریب موجود باشد.

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
- helperهای موردی lifecycle مربوط به draft stream

Subpathهای سازگاری می‌توانند به‌عنوان wrapper باقی بمانند، اما Pluginهای شخص ثالث جدید
نباید به آن‌ها نیاز داشته باشند.

Pluginهای همراه ممکن است در طول مهاجرت importهای helper داخلی را از طریق subpathهای runtime
رزرو‌شده نگه دارند. مستندات عمومی باید نویسندگان Plugin را پس از ایجاد شدن
`plugin-sdk/channel-message` به آن هدایت کند.

## ارتباط با turn کانال

`runtime.channel.turn.*` باید در طول مهاجرت باقی بماند.

باید به یک adapter سازگاری تبدیل شود:

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

پس از آن‌که همه Pluginهای همراه و مسیرهای سازگاری شناخته‌شده شخص ثالث bridge شدند،
`channel.turn` می‌تواند منسوخ شود. نباید حذف شود تا زمانی که یک مسیر مهاجرت SDK
منتشرشده و contract testهایی وجود داشته باشند که ثابت کنند Pluginهای قدیمی همچنان کار می‌کنند
یا با یک خطای نسخه روشن fail می‌شوند.

## guardrailهای سازگاری

در طول مهاجرت، تحویل durable عمومی برای هر کانالی که callback تحویل موجودش
اثرات جانبی فراتر از «این payload را بفرست» دارد opt-in است.

نقاط ورود قدیمی به‌صورت پیش‌فرض non-durable هستند:

- `channel.turn.run` و `dispatchAssembledChannelTurn` از callback
  تحویل کانال استفاده می‌کنند مگر این‌که آن کانال صریحا یک شیء سیاست/گزینه‌های durable
  audit‌شده فراهم کند.
- `channel.turn.runPrepared` تا زمانی که dispatcher آماده
  صریحا send context را فراخوانی کند، تحت مالکیت کانال می‌ماند.
- helperهای سازگاری عمومی مانند `recordInboundSessionAndDispatchReply`،
  `dispatchInboundReplyWithBase`، و helperهای direct-DM هرگز پیش از callback
  `deliver` یا `reply` فراهم‌شده توسط caller، تحویل durable عمومی را تزریق نمی‌کنند.

برای typeهای پل مهاجرت، `durable: undefined` یعنی «durable نیست». مسیر
durable فقط با یک مقدار سیاست/گزینه‌های صریح فعال می‌شود. `durable:
false` می‌تواند به‌عنوان نگارش سازگاری باقی بماند، اما پیاده‌سازی نباید
هر کانال مهاجرت‌نکرده را ملزم کند آن را اضافه کند.

کد bridge فعلی باید تصمیم durability را صریح نگه دارد:

- تحویل نهایی ماندگار یک وضعیت تمایزیافته برمی‌گرداند. `handled_visible` و
  `handled_no_send` پایانی هستند؛ `unsupported` و `not_applicable` ممکن است به
  تحویل تحت مالکیت کانال بازگردند؛ `failed` شکست ارسال را منتشر می‌کند.
- تحویل نهایی ماندگار عمومی با قابلیت‌های آداپتور مانند تحویل بی‌صدا،
  حفظ هدف پاسخ، حفظ نقل‌قول بومی، و هوک‌های ارسال پیام محدود می‌شود. در صورت
  نبود برابری، باید تحویل تحت مالکیت کانال انتخاب شود، نه ارسال عمومی‌ای که
  رفتار قابل مشاهده برای کاربر را تغییر می‌دهد.
- ارسال‌های ماندگارِ مبتنی بر صف، یک ارجاع قصد تحویل آشکار می‌کنند. فیلدهای
  نشست موجود `pendingFinalDelivery*` می‌توانند در طول گذار شناسه قصد را حمل کنند؛
  وضعیت نهایی یک ذخیره‌گاه `MessageSendIntent` است، نه متن پاسخ منجمد به‌همراه
  فیلدهای زمینه موردی.

مسیر ماندگار عمومی را برای یک کانال فعال نکنید مگر اینکه همه این موارد
درست باشند:

- آداپتور ارسال عمومی همان رفتار رندر و انتقال مسیر مستقیم قدیمی را اجرا می‌کند.
- اثرات جانبی محلی پس از ارسال از طریق زمینه ارسال حفظ می‌شوند.
- آداپتور رسیدها یا نتایج تحویل را با همه شناسه‌های پیام پلتفرم برمی‌گرداند.
- مسیرهای توزیع‌کننده آماده یا زمینه ارسال جدید را فراخوانی می‌کنند یا مستند می‌مانند
  که خارج از تضمین ماندگار هستند.
- تحویل جایگزین هر payload پیش‌بینی‌شده را مدیریت می‌کند، نه فقط اولین مورد را.
- تحویل جایگزین ماندگار کل آرایه payload پیش‌بینی‌شده را به‌عنوان یک قصد قابل
  بازپخش یا برنامه دسته‌ای ثبت می‌کند.

خطرهای مهاجرت مشخصی که باید حفظ شوند:

- تحویل پایشگر iMessage پس از ارسال موفق، پیام‌های ارسال‌شده را در یک کش echo
  ثبت می‌کند. ارسال‌های نهایی ماندگار همچنان باید آن کش را پر کنند، وگرنه
  OpenClaw می‌تواند پاسخ‌های نهایی خودش را دوباره به‌عنوان پیام‌های ورودی کاربر
  دریافت کند.
- Tlon یک امضای اختیاری مدل اضافه می‌کند و پس از پاسخ‌های گروهی، رشته‌های
  مشارکت‌شده را ثبت می‌کند. تحویل ماندگار عمومی نباید این اثرات را دور بزند؛
  یا آن‌ها را به آداپتورهای رندر/ارسال/نهایی‌سازی Tlon منتقل کنید یا Tlon را روی
  مسیر تحت مالکیت کانال نگه دارید.
- Discord و سایر توزیع‌کننده‌های آماده، از قبل مالک تحویل مستقیم و رفتار پیش‌نمایش
  هستند. تا زمانی که توزیع‌کننده‌های آماده آن‌ها صراحتا پیام‌های نهایی را از طریق
  زمینه ارسال مسیریابی نکنند، تحت پوشش تضمین ماندگار نوبت مونتاژشده نیستند.
- تحویل جایگزین بی‌صدای Telegram باید کل آرایه payload پیش‌بینی‌شده را تحویل دهد.
  یک میان‌بر تک-payload می‌تواند payloadهای جایگزین اضافی را پس از projection حذف کند.
- LINE، Zalo، Nostr، و سایر مسیرهای مونتاژشده/کمکی موجود ممکن است
  مدیریت توکن پاسخ، پراکسی‌کردن رسانه، کش‌های پیام ارسال‌شده، پاک‌سازی
  بارگذاری/وضعیت، یا هدف‌های فقط-callback داشته باشند. آن‌ها تا زمانی که این
  معناشناسی‌ها توسط آداپتور ارسال نمایش داده شوند و با آزمون‌ها راستی‌آزمایی شوند،
  روی تحویل تحت مالکیت کانال می‌مانند.
- کمک‌کننده‌های Direct-DM ممکن است callback پاسخ داشته باشند که تنها هدف انتقال
  درست است. خروجی عمومی نباید از `OriginatingTo` یا `To` حدس بزند و آن callback را
  نادیده بگیرد.
- خروجی شکست Gateway OpenClaw باید برای انسان‌ها قابل مشاهده بماند، اما echoهای
  اتاقِ نوشته‌شده توسط ربات و برچسب‌خورده باید پیش از مجوزدهی `allowBots` حذف شوند.
  کانال‌ها نباید این را با فیلترهای پیشوند متن قابل مشاهده پیاده‌سازی کنند، مگر به‌عنوان
  راهکار اضطراری کوتاه‌مدت؛ قرارداد ماندگار، فراداده مبدا ساختاریافته است.

## ذخیره‌سازی داخلی

صف ماندگار باید قصدهای ارسال پیام را ذخیره کند، نه payloadهای پاسخ.

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

صف باید هویت کافی را نگه دارد تا پس از راه‌اندازی دوباره، از همان حساب،
رشته، هدف، سیاست قالب‌بندی، و قواعد رسانه بازپخش شود.

## دسته‌های شکست

آداپتورهای کانال، شکست‌های انتقال را در دسته‌های بسته طبقه‌بندی می‌کنند:

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
- `auth` یا `permission` را تا زمانی که پیکربندی تغییر کند دوباره تلاش نکنید.
- برای `not_found`، اجازه دهید نهایی‌سازی زنده از ویرایش به ارسال تازه بازگردد، زمانی
  که کانال اعلام کند این کار ایمن است.
- برای `conflict`، از قواعد رسید/همانندسازی برای تصمیم‌گیری درباره اینکه آیا پیام
  از قبل وجود دارد استفاده کنید.
- هر خطایی پس از اینکه آداپتور ممکن است I/O پلتفرم را کامل کرده باشد اما پیش از
  commit رسید رخ دهد، به `unknown_after_send` تبدیل می‌شود، مگر اینکه آداپتور بتواند
  ثابت کند عملیات پلتفرم اتفاق نیفتاده است.

## نگاشت کانال

| کانال | مهاجرت هدف |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | سیاست تأیید دریافت به‌علاوه ارسال‌های نهایی پایدار را دریافت کند. آداپتر زنده مالک ارسال به‌همراه ویرایش پیش‌نمایش، ارسال نهایی پیش‌نمایش منقضی‌شده، موضوعات، رد کردن پیش‌نمایش پاسخِ نقل‌قولی، fallback رسانه، و مدیریت retry-after است. |
| Discord | آداپتر ارسال، تحویل payload پایدار موجود را دربر می‌گیرد. آداپتر زنده مالک ویرایش پیش‌نویس، پیش‌نویس پیشرفت، لغو پیش‌نمایش رسانه/خطا، حفظ هدف پاسخ، و رسیدهای شناسه پیام است. بازتاب‌های خرابی Gateway که توسط ربات در اتاق‌های مشترک نوشته شده‌اند را ممیزی کنید؛ اگر Discord نتواند metadata مبدا را روی پیام‌های عادی حمل کند، از یک رجیستری خروجی یا معادل بومی دیگر استفاده کنید. |
| Slack | آداپتر ارسال، پست‌های چت عادی را مدیریت می‌کند. آداپتر زنده وقتی شکل thread آن را پشتیبانی کند stream بومی را انتخاب می‌کند، وگرنه پیش‌نمایش پیش‌نویس را. رسیدها timestampهای thread را حفظ می‌کنند. آداپتر مبدا خرابی‌های Gateway OpenClaw را به `chat.postMessage.metadata` در Slack نگاشت می‌کند و پیش از مجوزدهی `allowBots`، بازتاب‌های برچسب‌خورده اتاق ربات را حذف می‌کند. |
| WhatsApp | آداپتر ارسال مالک ارسال متن/رسانه با intentهای نهایی پایدار است. آداپتر دریافت، mention گروه و هویت فرستنده را مدیریت می‌کند. زنده می‌تواند تا زمانی که WhatsApp یک انتقال قابل ویرایش داشته باشد غایب بماند. |
| Matrix | آداپتر زنده مالک ویرایش‌های رویداد پیش‌نویس، نهایی‌سازی، redaction، محدودیت‌های رسانه رمزگذاری‌شده، و fallback عدم تطابق هدف پاسخ است. آداپتر دریافت مالک hydrate کردن و dedupe رویداد رمزگذاری‌شده است. آداپتر مبدا باید مبدا خرابی Gateway OpenClaw را در محتوای رویداد Matrix کدگذاری کند و پیش از مدیریت `allowBots`، بازتاب‌های اتاق ربات پیکربندی‌شده را حذف کند. |
| Mattermost | آداپتر زنده مالک یک پست پیش‌نویس، تا کردن پیشرفت/ابزار، نهایی‌سازی درجا، و fallback ارسال تازه است. |
| Microsoft Teams | آداپتر زنده مالک پیشرفت بومی و رفتار stream بلوکی است. آداپتر ارسال مالک activityها و رسیدهای پیوست/کارت است. |
| Feishu | آداپتر رندر مالک رندر کردن متن/کارت/raw است. آداپتر زنده مالک کارت‌های streaming و جلوگیری از نهایی تکراری است. آداپتر ارسال مالک کامنت‌ها، نشست‌های موضوعی، رسانه، و جلوگیری از voice است. |
| QQ Bot | آداپتر زنده مالک streaming C2C، timeout انباشت‌گر، و ارسال نهایی fallback است. آداپتر رندر مالک تگ‌های رسانه و متن-به‌عنوان-voice است. |
| Signal | آداپتر دریافت ساده به‌همراه آداپتر ارسال. آداپتر زنده وجود ندارد مگر اینکه signal-cli پشتیبانی قابل‌اعتماد از ویرایش اضافه کند. |
| iMessage | آداپتر دریافت ساده به‌همراه آداپتر ارسال. ارسال iMessage باید پر شدن echo-cache مانیتور را حفظ کند، پیش از آنکه نهایی‌های پایدار بتوانند تحویل مانیتور را دور بزنند. |
| Google Chat | آداپتر دریافت ساده به‌همراه آداپتر ارسال، با نگاشت رابطه thread به spaceها و شناسه‌های thread. رفتار اتاق `allowBots=true` را برای بازتاب‌های برچسب‌خورده خرابی Gateway OpenClaw ممیزی کنید. |
| LINE | آداپتر دریافت ساده به‌همراه آداپتر ارسال، با مدل‌سازی محدودیت‌های reply-token به‌عنوان قابلیت هدف/رابطه. |
| Nextcloud Talk | پل دریافت SDK به‌همراه آداپتر ارسال. |
| IRC | آداپتر دریافت ساده به‌همراه آداپتر ارسال، بدون رسیدهای ویرایش پایدار. |
| Nostr | آداپتر دریافت به‌همراه آداپتر ارسال برای DMهای رمزگذاری‌شده؛ رسیدها شناسه‌های رویداد هستند. |
| QA Channel | آداپتر تست قرارداد برای رفتار دریافت، ارسال، زنده، retry، و recovery. |
| Synology Chat | آداپتر دریافت ساده به‌همراه آداپتر ارسال. |
| Tlon | پیش از فعال شدن تحویل نهایی پایدار عمومی، آداپتر ارسال باید رندر کردن model-signature و ردیابی threadهای مشارکت‌شده را حفظ کند. |
| Twitch | آداپتر دریافت ساده به‌همراه آداپتر ارسال با طبقه‌بندی rate-limit. |
| Zalo | آداپتر دریافت ساده به‌همراه آداپتر ارسال. |
| Zalo Personal | آداپتر دریافت ساده به‌همراه آداپتر ارسال. |

## برنامه مهاجرت

### فاز ۱: دامنه پیام داخلی

- نوع‌های `src/channels/message/*` را برای پیام‌ها، هدف‌ها، رابطه‌ها،
  مبداها، رسیدها، قابلیت‌ها، intentهای پایدار، context دریافت، context ارسال،
  context زنده، و کلاس‌های خرابی اضافه کنید.
- `origin?: MessageOrigin` را به نوع payload پل مهاجرت که تحویل پاسخ فعلی از آن
  استفاده می‌کند اضافه کنید، سپس با جایگزین شدن payloadهای پاسخ توسط refactor،
  آن فیلد را به نوع‌های `ChannelMessage` و پیام رندرشده منتقل کنید.
- این را تا زمانی که آداپترها و تست‌ها شکل را اثبات کنند داخلی نگه دارید.
- تست‌های واحد خالص برای گذارهای state و serialization اضافه کنید.

### فاز ۲: هسته ارسال پایدار

- صف خروجی موجود را از پایداری reply-payload به intentهای پایدار ارسال پیام
  منتقل کنید.
- بگذارید یک intent ارسال پایدار، آرایه payload پیش‌بینی‌شده یا برنامه batch را
  حمل کند، نه فقط یک reply payload.
- رفتار recovery فعلی صف را از طریق تبدیل سازگاری حفظ کنید.
- کاری کنید `deliverOutboundPayloads`، `messages.send` را فراخوانی کند.
- پس از اینکه آداپتر ایمنی replay را اعلام کرد، پایداری ارسال نهایی را default
  کنید و وقتی intent پایدار در lifecycle پیام جدید قابل نوشتن نیست، fail closed
  انجام دهید. مسیرهای سازگاری channel-turn و SDK موجود در این فاز به‌صورت default
  همچنان direct-send می‌مانند.
- رسیدها را به‌صورت یکنواخت ثبت کنید.
- رسیدها و نتایج تحویل را به caller اصلی dispatcher برگردانید، به‌جای اینکه
  ارسال پایدار را یک side effect پایانی در نظر بگیرید.
- مبدا پیام را از طریق intentهای ارسال پایدار persist کنید تا recovery، replay،
  و ارسال‌های chunked، منشأ عملیاتی OpenClaw را حفظ کنند.

### فاز ۳: پل Channel Turn

- `channel.turn.run` و `dispatchAssembledChannelTurn` را روی پایه
  `messages.receive` و `messages.send` دوباره پیاده‌سازی کنید.
- نوع‌های fact فعلی را پایدار نگه دارید.
- رفتار legacy را به‌صورت default حفظ کنید. یک کانال assembled-turn فقط وقتی
  پایدار می‌شود که آداپتر آن صراحتا با یک سیاست پایداری replay-safe opt in کند.
- `durable: false` را به‌عنوان یک راه فرار سازگاری برای مسیرهایی نگه دارید که
  ویرایش‌های بومی را نهایی می‌کنند و هنوز نمی‌توانند با ایمنی replay شوند، اما
  برای محافظت از کانال‌های مهاجرت‌نکرده به markerهای `false` تکیه نکنید.
- پایداری assembled-turn را فقط در lifecycle پیام جدید default کنید، پس از آنکه
  نگاشت کانال ثابت کند مسیر ارسال عمومی semantics تحویل کانال قدیمی را حفظ می‌کند.

### فاز ۴: پل Dispatcher آماده

- `deliverDurableInboundReplyPayload` را با یک پل send-context جایگزین کنید.
- helper قدیمی را به‌عنوان wrapper نگه دارید.
- ابتدا Telegram، WhatsApp، Slack، Signal، iMessage و Discord را منتقل کنید، زیرا
  آن‌ها از قبل کار durable-final یا مسیرهای ارسال ساده‌تری دارند.
- هر prepared dispatcher را تا زمانی که صریحا به send context وارد نشده است، بدون پوشش در نظر بگیرید.
  مستندات و ورودی‌های changelog باید بگویند «نوبت‌های کانال مونتاژشده»
  یا مسیرهای کانال مهاجرت‌داده‌شده را نام ببرند، نه اینکه ادعای همه replyهای نهایی خودکار را مطرح کنند.
- `recordInboundSessionAndDispatchReply`، helperهای direct-DM و helperهای سازگاری عمومی مشابه را
  با حفظ رفتار نگه دارید. آن‌ها ممکن است بعدا یک opt-in صریح برای send-context ارائه کنند،
  اما نباید پیش از callback تحویلِ متعلق به caller به‌صورت خودکار تلاش کنند تحویل durable عمومی انجام دهند.

### فاز ۵: چرخه عمر Live یکپارچه

- `messages.live` را با دو adapter اثبات بسازید:
  - Telegram برای ارسال به‌همراه ویرایش و ارسال نهایی stale.
  - Matrix برای نهایی‌سازی draft به‌همراه fallback حذف.
- سپس Discord، Slack، Mattermost، Teams، QQ Bot و Feishu را مهاجرت دهید.
- کد تکراری نهایی‌سازی preview را فقط پس از آن حذف کنید که هر کانال
  تست‌های برابری داشته باشد.

### فاز ۶: SDK عمومی

- `openclaw/plugin-sdk/channel-message` را اضافه کنید.
- آن را به‌عنوان API ترجیحی Plugin کانال مستند کنید.
- exports بسته، inventory نقطه ورود، baselineهای API تولیدشده، و
  مستندات SDK مربوط به Plugin را به‌روزرسانی کنید.
- `MessageOrigin`، hookهای encode/decode مبدا، و predicate مشترک
  `shouldDropOpenClawEcho` را در سطح SDK مربوط به channel-message قرار دهید.
- wrapperهای سازگاری را برای subpathهای قدیمی نگه دارید.
- پس از مهاجرت Pluginهای bundled، helperهای SDK با نام reply را در مستندات
  deprecated علامت‌گذاری کنید.

### فاز ۷: همه فرستنده‌ها

همه تولیدکننده‌های outbound غیر-reply را به `messages.send` منتقل کنید:

- اعلان‌های cron و Heartbeat
- تکمیل taskها
- نتایج hook
- promptهای approval و نتایج approval
- ارسال‌های ابزار پیام
- اعلان‌های تکمیل subagent
- ارسال‌های صریح CLI یا Control UI
- مسیرهای automation/broadcast

اینجاست که مدل از «replyهای agent» فاصله می‌گیرد و به «OpenClaw پیام‌ها را
ارسال می‌کند» تبدیل می‌شود.

### فاز ۸: منسوخ‌کردن Turn

- `channel.turn` را حداقل برای یک بازه سازگاری به‌عنوان wrapper نگه دارید.
- یادداشت‌های مهاجرت را منتشر کنید.
- تست‌های سازگاری SDK مربوط به Plugin را در برابر importهای قدیمی اجرا کنید.
- helperهای داخلی قدیمی را فقط پس از آن حذف یا پنهان کنید که هیچ Plugin bundled به آن‌ها نیاز نداشته باشد
  و قراردادهای third-party جایگزین پایداری داشته باشند.

## برنامه تست

تست‌های unit:

- serialization و recovery برای intent ارسال durable.
- استفاده دوباره از idempotency key و سرکوب duplicate.
- commit receipt و رد کردن replay.
- recovery مربوط به `unknown_after_send` که وقتی adapter از reconciliation پشتیبانی می‌کند،
  پیش از replay سازگاری را انجام می‌دهد.
- سیاست classification شکست.
- ترتیب‌دهی سیاست ack دریافت.
- نگاشت relation برای ارسال‌های reply، followup، system و broadcast.
- factory مبدا برای شکست Gateway و predicate مربوط به `shouldDropOpenClawEcho`.
- حفظ origin در طول normalization payload، chunking، serialization صف durable، و recovery.

تست‌های integration:

- adapter ساده `channel.turn.run` همچنان record و send می‌کند.
- تحویل legacy assembled-turn durable نمی‌شود مگر اینکه کانال
  صریحا opt in کرده باشد.
- پل `channel.turn.runPrepared` همچنان record و finalize می‌کند.
- helperهای سازگاری عمومی به‌صورت پیش‌فرض callbackهای تحویل متعلق به caller را صدا می‌زنند
  و پیش از آن callbackها generic-send انجام نمی‌دهند.
- تحویل fallback durable پس از restart کل آرایه projected payload را replay می‌کند
  و نمی‌تواند پس از یک crash زودهنگام، payloadهای بعدی را ثبت‌نشده باقی بگذارد.
- تحویل durable assembled-turn، شناسه‌های پیام platform را به dispatcher بافرشده برمی‌گرداند.
- hookهای تحویل سفارشی همچنان وقتی تحویل durable غیرفعال یا ناموجود است
  شناسه‌های پیام platform را برمی‌گردانند.
- reply نهایی از restart بین تکمیل assistant و ارسال platform جان سالم به در می‌برد.
- preview draft وقتی مجاز باشد درجا finalize می‌شود.
- preview draft وقتی media/error/reply-target mismatch نیازمند تحویل عادی است
  لغو یا redact می‌شود.
- block streaming و preview streaming هر دو متن یکسان را تحویل نمی‌دهند.
- media که زود stream شده است در تحویل نهایی تکرار نمی‌شود.

تست‌های کانال:

- reply موضوعی Telegram با ack polling که تا safe completed watermark مربوط به receive context به تأخیر می‌افتد.
- recovery polling در Telegram برای updateهای accepted-but-not-delivered که با
  مدل offset persisted safe-completed پوشش داده می‌شود.
- preview stale در Telegram final تازه ارسال می‌کند و preview را پاک‌سازی می‌کند.
- fallback بی‌صدای Telegram هر payload fallback projected را ارسال می‌کند.
- دوام fallback بی‌صدای Telegram کل آرایه fallback projected را به‌صورت atomic ثبت می‌کند،
  نه یک durable intent تک‌payload در هر تکرار loop.
- لغو preview در Discord هنگام media/error/reply صریح.
- finalهای prepared dispatcher در Discord پیش از آنکه مستندات یا changelog ادعای دوام final-reply در Discord کنند،
  از طریق send context route می‌شوند.
- ارسال‌های نهایی durable در iMessage، cache echo پیام ارسال‌شده monitor را پر می‌کنند.
- مسیرهای تحویل legacy در LINE، Zalo و Nostr تا زمانی که تست‌های برابری adapter آن‌ها وجود نداشته باشد
  توسط ارسال durable عمومی دور زده نمی‌شوند.
- تحویل callback مربوط به Direct-DM/Nostr مقتدر باقی می‌ماند مگر اینکه صریحا به
  message target کامل و adapter ارسال replay-safe مهاجرت داده شود.
- پیام‌های شکست Gateway در Slack که با OpenClaw tag شده‌اند outbound قابل مشاهده می‌مانند، echoهای bot-room tagشده
  پیش از `allowBots` حذف می‌شوند، و پیام‌های bot بدون tag با همان متن قابل مشاهده
  همچنان authorization عادی bot را دنبال می‌کنند.
- fallback استریم native در Slack به draft preview در DMهای top-level.
- نهایی‌سازی preview و fallback redaction در Matrix.
- echoهای اتاق مربوط به شکست Gateway در Matrix که با OpenClaw tag شده‌اند و از حساب‌های bot پیکربندی‌شده می‌آیند،
  پیش از رسیدگی `allowBots` حذف می‌شوند.
- auditهای cascade شکست Gateway در اتاق مشترک Discord و Google Chat، پیش از ادعای
  حفاظت generic در آنجا، modeهای `allowBots` را پوشش می‌دهند.
- نهایی‌سازی draft و fallback ارسال تازه در Mattermost.
- نهایی‌سازی progress native در Teams.
- سرکوب final تکراری در Feishu.
- fallback timeout برای accumulator در QQ Bot.
- ارسال‌های نهایی durable در Tlon، رندر model-signature و tracking رشته مشارکت‌کرده را حفظ می‌کنند.
- ارسال‌های نهایی durable ساده در WhatsApp، Signal، iMessage، Google Chat، LINE، IRC، Nostr، Nextcloud Talk،
  Synology Chat، Tlon، Twitch، Zalo و Zalo Personal.

اعتبارسنجی:

- فایل‌های Vitest هدفمند در زمان توسعه.
- `pnpm check:changed` در Testbox برای کل سطح تغییرکرده.
- `pnpm check` گسترده‌تر در Testbox پیش از landing کل refactor یا پس از
  تغییرات SDK/export عمومی.
- smoke مربوط به Live یا qa-channel برای حداقل یک کانال edit-capable و یک
  کانال ساده send-only پیش از حذف wrapperهای سازگاری.

## پرسش‌های باز

- اینکه آیا Telegram در نهایت باید منبع runner مربوط به grammY را با یک
  منبع polling کاملا durable جایگزین کند که بتواند redelivery سطح platform را کنترل کند،
  نه فقط watermark restart persisted مربوط به OpenClaw را.
- اینکه آیا وضعیت preview live durable باید در همان رکورد صف
  مثل intent ارسال نهایی ذخیره شود یا در یک sibling live-state store.
- اینکه wrapperهای سازگاری پس از انتشار `plugin-sdk/channel-message`
  تا چه مدت مستند باقی بمانند.
- اینکه Pluginهای third-party باید receive adapterها را مستقیما پیاده‌سازی کنند یا فقط
  hookهای normalize/send/live را از طریق `defineChannelMessageAdapter` ارائه دهند.
- اینکه کدام fieldهای receipt برای نمایش در SDK عمومی در برابر وضعیت runtime داخلی امن هستند.
- اینکه side effectهایی مانند cacheهای self-echo و markerهای participated-thread باید
  به‌عنوان hookهای send-context، گام‌های finalize متعلق به adapter، یا
  subscriberهای receipt مدل شوند.
- اینکه کدام کانال‌ها metadata origin بومی دارند، کدام‌ها به registryهای outbound persisted نیاز دارند،
  و کدام‌ها نمی‌توانند سرکوب echo بین-bot قابل اعتماد ارائه دهند.

## معیارهای پذیرش

- هر کانال پیام bundled خروجی نهایی قابل مشاهده را از طریق
  `messages.send` ارسال می‌کند.
- هر کانال پیام inbound از طریق `messages.receive` یا یک
  wrapper سازگاری مستند وارد می‌شود.
- هر کانال preview/edit/stream از `messages.live` برای وضعیت draft و
  نهایی‌سازی استفاده می‌کند.
- `channel.turn` فقط یک wrapper است.
- helperهای SDK با نام reply، exportهای سازگاری هستند، نه مسیر توصیه‌شده.
- recovery durable می‌تواند ارسال‌های نهایی pending را پس از restart بدون از دست دادن
  پاسخ نهایی یا duplicate کردن ارسال‌های از قبل commitشده replay کند؛ ارسال‌هایی که
  نتیجه platform آن‌ها نامعلوم است پیش از replay reconcile می‌شوند یا برای آن adapter
  به‌عنوان at-least-once مستند می‌شوند.
- ارسال‌های نهایی durable وقتی durable intent قابل نوشتن نیست fail closed می‌شوند،
  مگر اینکه caller صریحا یک mode غیر-durable مستند را انتخاب کرده باشد.
- helperهای سازگاری legacy channel-turn و SDK به‌صورت پیش‌فرض تحویل مستقیم
  متعلق به کانال را انجام می‌دهند؛ ارسال durable عمومی فقط opt-in صریح است.
- receiptها همه شناسه‌های پیام platform را برای تحویل‌های چندبخشی و یک
  شناسه primary را برای سهولت threading/edit حفظ می‌کنند.
- wrapperهای durable پیش از جایگزینی callbackهای تحویل مستقیم، side effectهای محلی کانال را حفظ می‌کنند.
- prepared dispatcherها تا زمانی که مسیر تحویل نهایی‌شان صریحا از send context استفاده نکند،
  durable شمرده نمی‌شوند.
- تحویل fallback هر payload projected را مدیریت می‌کند.
- تحویل fallback durable هر payload projected را در یک intent یا batch plan قابل replay ثبت می‌کند.
- خروجی شکست Gateway که از OpenClaw منشأ گرفته است برای انسان‌ها قابل مشاهده است، اما
  echoهای اتاقی tagشده و bot-authored پیش از authorization bot در کانال‌هایی که
  پشتیبانی از قرارداد origin را اعلام می‌کنند حذف می‌شوند.
- مستندات send، receive، live، state، receiptها، relationها، سیاست failure،
  migration، و پوشش test را توضیح می‌دهند.

## مرتبط

- [پیام‌ها](/fa/concepts/messages)
- [Streaming و chunking](/fa/concepts/streaming)
- [draftهای progress](/fa/concepts/progress-drafts)
- [سیاست retry](/fa/concepts/retry)
- [kernel نوبت کانال](/fa/plugins/sdk-channel-turn)
