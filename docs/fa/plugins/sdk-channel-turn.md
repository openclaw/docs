---
read_when:
    - در حال ساخت یک Plugin کانال هستید و چرخهٔ حیات مشترک نوبت ورودی را می‌خواهید
    - شما در حال مهاجرت یک پایشگر کانال از کد واسط دست‌سازِ ثبت/ارسال هستید
    - باید مراحل پذیرش، دریافت، طبقه‌بندی، پیش‌بررسی، حل‌وفصل، ثبت، ارسال و نهایی‌سازی را درک کنید.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- هستهٔ مشترک نوبت ورودی که Pluginهای کانالِ همراه و شخص ثالث برای ثبت، ارسال و نهایی‌سازی نوبت‌های عامل از آن استفاده می‌کنند
title: هستهٔ نوبت کانال
x-i18n:
    generated_at: "2026-04-30T09:41:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

ماشین حالت ورودی مشترکِ نوبت کانال، رویداد نرمال‌سازی‌شده‌ی پلتفرم را به یک نوبت عامل تبدیل می‌کند. Pluginهای کانال، واقعیت‌های پلتفرم و callback تحویل را فراهم می‌کنند. هسته مالک ارکستراسیون است: دریافت، طبقه‌بندی، پیش‌پرواز، حل، مجوزدهی، سرهم‌سازی، ثبت، dispatch و نهایی‌سازی.

وقتی Plugin شما در مسیر داغ پیام ورودی قرار دارد از این استفاده کنید. برای رویدادهای غیرپیامی (دستورهای slash، modalها، تعامل‌های button، رویدادهای lifecycle، reactionها، وضعیت voice)، آن‌ها را در خود Plugin نگه دارید. kernel فقط مالک رویدادهایی است که ممکن است به یک نوبت متنی عامل تبدیل شوند.

<Info>
  kernel از طریق runtime تزریق‌شده‌ی Plugin و به‌صورت `runtime.channel.turn.*` در دسترس است. نوع runtime مربوط به Plugin از `openclaw/plugin-sdk/core` صادر می‌شود، بنابراین Pluginهای native شخص ثالث می‌توانند از این entry pointها همان‌طور استفاده کنند که Pluginهای کانالِ بسته‌بندی‌شده استفاده می‌کنند.
</Info>

## چرا یک kernel مشترک

Pluginهای کانال همان جریان ورودی را تکرار می‌کنند: نرمال‌سازی، مسیریابی، gate کردن، ساخت context، ثبت metadata نشست، dispatch نوبت عامل، و نهایی‌سازی وضعیت تحویل. بدون kernel مشترک، تغییر در mention gating، پاسخ‌های visible فقط برای ابزار، metadata نشست، تاریخچه‌ی pending، یا نهایی‌سازی dispatch باید برای هر کانال جداگانه اعمال شود.

kernel این چهار مفهوم را عمداً جدا نگه می‌دارد:

- `ConversationFacts`: پیام از کجا آمده است
- `RouteFacts`: کدام عامل و نشست باید آن را پردازش کند
- `ReplyPlanFacts`: پاسخ‌های visible باید کجا بروند
- `MessageFacts`: عامل باید چه بدنه و context تکمیلی‌ای را ببیند

پیام‌های مستقیم Slack، topicهای Telegram، threadهای Matrix، و نشست‌های topic در Feishu همگی در عمل این‌ها را از هم متمایز می‌کنند. یکی گرفتن آن‌ها به‌عنوان یک شناسه، به مرور زمان باعث انحراف می‌شود.

## چرخه‌ی عمر مرحله

kernel بدون توجه به کانال، همان pipeline ثابت را اجرا می‌کند:

1. `ingest` -- adapter یک رویداد خام پلتفرم را به `NormalizedTurnInput` تبدیل می‌کند
2. `classify` -- adapter اعلام می‌کند آیا این رویداد می‌تواند یک نوبت عامل را شروع کند یا نه
3. `preflight` -- adapter کارهای dedupe، self-echo، hydration، debounce، decryption، و پرکردن اولیه‌ی بخشی از factها را انجام می‌دهد
4. `resolve` -- adapter یک نوبت کاملاً سرهم‌شده را برمی‌گرداند (route، reply plan، message، delivery)
5. `authorize` -- سیاست DM، گروه، mention، و command روی factهای سرهم‌شده اعمال می‌شود
6. `assemble` -- `FinalizedMsgContext` از factها و از طریق `buildContext` ساخته می‌شود
7. `record` -- metadata نشست ورودی و آخرین route پایدار می‌شوند
8. `dispatch` -- نوبت عامل از طریق dispatcher بلوکی bufferشده اجرا می‌شود
9. `finalize` -- `onFinalize` مربوط به adapter حتی هنگام خطای dispatch هم اجرا می‌شود

هر مرحله وقتی callback با نام `log` فراهم شده باشد، یک رویداد log ساختاریافته منتشر می‌کند. [مشاهده‌پذیری](#observability) را ببینید.

## گونه‌های پذیرش

kernel وقتی یک نوبت gate می‌شود exception پرتاب نمی‌کند. یک `ChannelTurnAdmission` برمی‌گرداند:

| نوع           | زمان                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `dispatch`    | نوبت پذیرفته می‌شود. نوبت عامل اجرا می‌شود و مسیر پاسخ visible به کار گرفته می‌شود.                                                       |
| `observeOnly` | نوبت از ابتدا تا انتها اجرا می‌شود اما adapter تحویل هیچ چیز visible نمی‌فرستد. برای عامل‌های ناظر broadcast و جریان‌های passive چندعاملی دیگر استفاده می‌شود. |
| `handled`     | یک رویداد پلتفرم به‌صورت محلی مصرف شده است (lifecycle، reaction، button، modal). kernel از dispatch عبور می‌کند.                         |
| `drop`        | مسیر پرش. به‌صورت اختیاری `recordHistory: true` پیام را در تاریخچه‌ی pending گروه نگه می‌دارد تا mention آینده context داشته باشد.        |

پذیرش می‌تواند از `classify` بیاید (کلاس رویداد گفته است نمی‌تواند یک نوبت را شروع کند)، از `preflight` بیاید (dedupe، self-echo، نبود mention همراه با ثبت تاریخچه)، یا از خود `resolveTurn`.

## Entry pointها

runtime سه entry point ترجیحی را expose می‌کند تا adapterها بتوانند در سطحی opt in کنند که با کانال سازگار است.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

دو helper قدیمی‌تر runtime برای سازگاری با Plugin SDK همچنان در دسترس‌اند:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

وقتی کانال شما می‌تواند جریان ورودی خود را به‌صورت یک `ChannelTurnAdapter<TRaw>` بیان کند، از این استفاده کنید. adapter برای `ingest`، `classify` اختیاری، `preflight` اختیاری، `resolveTurn` اجباری، و `onFinalize` اختیاری callback دارد.

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

`run` زمانی شکل مناسب است که کانال منطق adapter کوچکی دارد و از مالکیت چرخه‌ی عمر از طریق hookها بهره می‌برد.

### runPrepared

وقتی کانال یک dispatcher محلی پیچیده با previewها، retryها، editها، یا thread bootstrap دارد که باید در مالکیت خود کانال بماند، از این استفاده کنید. kernel همچنان نشست ورودی را پیش از dispatch ثبت می‌کند و یک `DispatchedChannelTurnResult` یکنواخت ارائه می‌دهد.

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

کانال‌های rich (Matrix، Mattermost، Microsoft Teams، Feishu، QQ Bot) از `runPrepared` استفاده می‌کنند، چون dispatcher آن‌ها رفتار ویژه‌ی پلتفرم را ارکستره می‌کند که kernel نباید چیزی درباره‌اش بداند.

### buildContext

یک تابع pure که bundleهای fact را به `FinalizedMsgContext` نگاشت می‌کند. وقتی کانال شما بخشی از pipeline را دستی می‌سازد اما شکل context سازگار می‌خواهد، از آن استفاده کنید.

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

`buildContext` همچنین داخل callbackهای `resolveTurn` هنگام سرهم‌سازی یک نوبت برای `run` مفید است.

<Note>
  helperهای منسوخ SDK مانند `dispatchInboundReplyWithBase` همچنان از طریق helper نوبتِ سرهم‌شده bridge می‌شوند. کد جدید Plugin باید از `run` یا `runPrepared` استفاده کند.
</Note>

## انواع fact

factهایی که kernel از adapter شما مصرف می‌کند، مستقل از پلتفرم‌اند. پیش از سپردن objectهای پلتفرم به kernel، آن‌ها را به این شکل‌ها ترجمه کنید.

### NormalizedTurnInput

| فیلد             | هدف                                                                         |
| ----------------- | --------------------------------------------------------------------------- |
| `id`              | شناسه‌ی پایدار پیام که برای dedupe و logها استفاده می‌شود                  |
| `timestamp`       | epoch ms اختیاری                                                            |
| `rawText`         | بدنه همان‌طور که از پلتفرم دریافت شده است                                  |
| `textForAgent`    | بدنه‌ی تمیزشده‌ی اختیاری برای عامل (حذف mention، کوتاه‌سازی typing)        |
| `textForCommands` | بدنه‌ی اختیاری که برای parsing دستور `/command` استفاده می‌شود             |
| `raw`             | ارجاع pass-through اختیاری برای callbackهای adapter که به اصل نیاز دارند    |

### ChannelEventClass

| فیلد                   | هدف                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| `kind`                 | `message`، `command`، `interaction`، `reaction`، `lifecycle`، `unknown` |
| `canStartAgentTurn`    | اگر false باشد kernel مقدار `{ kind: "handled" }` را برمی‌گرداند       |
| `requiresImmediateAck` | راهنمایی برای adapterهایی که باید پیش از dispatch کردن ACK بدهند       |

### SenderFacts

| فیلد           | هدف                                                               |
| -------------- | ----------------------------------------------------------------- |
| `id`           | شناسه‌ی پایدار فرستنده در پلتفرم                                  |
| `name`         | نام نمایشی                                                        |
| `username`     | handle اگر از `name` متمایز باشد                                  |
| `tag`          | discriminator به سبک Discord یا tag پلتفرم                        |
| `roles`        | شناسه‌های نقش، برای تطبیق allowlist نقش عضو استفاده می‌شود        |
| `isBot`        | وقتی فرستنده یک bot شناخته‌شده باشد true است (kernel برای drop کردن استفاده می‌کند) |
| `isSelf`       | وقتی فرستنده خود عامل پیکربندی‌شده باشد true است                  |
| `displayLabel` | label از پیش renderشده برای متن envelope                           |

### ConversationFacts

| فیلد              | هدف                                                                    |
| ----------------- | ---------------------------------------------------------------------- |
| `kind`            | `direct`، `group`، یا `channel`                                        |
| `id`              | شناسه‌ی مکالمه که برای مسیریابی استفاده می‌شود                        |
| `label`           | label انسانی برای envelope                                            |
| `spaceId`         | شناسه‌ی اختیاری فضای بیرونی (workspace در Slack، homeserver در Matrix) |
| `parentId`        | شناسه‌ی مکالمه‌ی بیرونی وقتی این یک thread است                        |
| `threadId`        | شناسه‌ی thread وقتی این پیام داخل یک thread است                       |
| `nativeChannelId` | شناسه‌ی native کانال در پلتفرم وقتی با شناسه‌ی مسیریابی متفاوت است    |
| `routePeer`       | peer استفاده‌شده برای lookup در `resolveAgentRoute`                   |

### RouteFacts

| فیلد                    | هدف                                                               |
| ----------------------- | ----------------------------------------------------------------- |
| `agentId`               | عاملی که باید این نوبت را handle کند                              |
| `accountId`             | override اختیاری (کانال‌های چندحسابی)                             |
| `routeSessionKey`       | کلید نشست استفاده‌شده برای مسیریابی                               |
| `dispatchSessionKey`    | کلید نشست استفاده‌شده در dispatch وقتی با کلید route متفاوت است   |
| `persistedSessionKey`   | کلید نشست نوشته‌شده در metadata نشست پایدارشده                    |
| `parentSessionKey`      | والد برای نشست‌های شاخه‌ای/threaded                               |
| `modelParentSessionKey` | والد سمت مدل برای نشست‌های شاخه‌ای                                |
| `mainSessionKey`        | pin مالک DM اصلی برای مکالمات مستقیم                              |
| `createIfMissing`       | به مرحله‌ی record اجازه می‌دهد یک ردیف نشستِ موجودنبودنی بسازد    |

### ReplyPlanFacts

| فیلد                     | هدف                                                 |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | مقصد منطقی پاسخ که در زمینه `To` نوشته می‌شود          |
| `originatingTo`           | مقصد زمینه آغازکننده (`OriginatingTo`)            |
| `nativeChannelId`         | شناسه کانال بومی پلتفرم برای تحویل                 |
| `replyTarget`             | مقصد نهایی پاسخ قابل‌مشاهده، اگر با `to` متفاوت باشد |
| `deliveryTarget`          | بازنویسی تحویل در سطح پایین‌تر                           |
| `replyToId`               | شناسه پیام نقل‌قول‌شده/لنگرشده                              |
| `replyToIdFull`           | شناسه نقل‌قول‌شده با فرم کامل وقتی پلتفرم هر دو را دارد          |
| `messageThreadId`         | شناسه رشته در زمان تحویل                              |
| `threadParentId`          | شناسه پیام والد رشته                         |
| `sourceReplyDeliveryMode` | `thread`، `reply`، `channel`، `direct`، یا `none`       |

### AccessFacts

`AccessFacts` بولی‌هایی را حمل می‌کند که مرحله authorize به آن‌ها نیاز دارد. تطبیق هویت در کانال باقی می‌ماند: کرنل فقط نتیجه را مصرف می‌کند.

| فیلد      | هدف                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | تصمیم اجازه/جفت‌سازی/رد DM و فهرست `allowFrom`                       |
| `group`    | خط‌مشی گروه، اجازه مسیر، اجازه فرستنده، فهرست مجاز، الزام اشاره   |
| `commands` | مجوزدهی فرمان در میان مجوزدهنده‌های پیکربندی‌شده                       |
| `mentions` | اینکه تشخیص اشاره ممکن است یا نه و اینکه به عامل اشاره شده است یا نه |

### MessageFacts

| فیلد            | هدف                                                        |
| ---------------- | -------------------------------------------------------------- |
| `body`           | بدنه نهایی پاکت (قالب‌بندی‌شده)                                |
| `rawBody`        | بدنه خام ورودی                                               |
| `bodyForAgent`   | بدنه‌ای که عامل می‌بیند                                            |
| `commandBody`    | بدنه‌ای که برای تجزیه فرمان استفاده می‌شود                                  |
| `envelopeFrom`   | برچسب فرستنده ازپیش‌رندرشده برای پاکت                     |
| `senderLabel`    | بازنویسی اختیاری برای فرستنده رندرشده                      |
| `preview`        | پیش‌نمایش کوتاه و ویرایش‌شده برای لاگ‌ها                                |
| `inboundHistory` | ورودی‌های اخیر تاریخچه ورودی وقتی کانال یک بافر نگه می‌دارد |

### SupplementalContextFacts

زمینه تکمیلی زمینه نقل‌قول، بازارسال‌شده، و راه‌اندازی رشته را پوشش می‌دهد. کرنل خط‌مشی پیکربندی‌شده `contextVisibility` را اعمال می‌کند. آداپتر کانال فقط facts و پرچم‌های `senderAllowed` را فراهم می‌کند تا خط‌مشی میان‌کانالی سازگار بماند.

### InboundMediaFacts

رسانه به شکل fact است. دانلود پلتفرم، احراز هویت، خط‌مشی SSRF، قوانین CDN، و رمزگشایی محلیِ کانال باقی می‌مانند. کرنل facts را به `MediaPath`، `MediaUrl`، `MediaType`، `MediaPaths`، `MediaUrls`، `MediaTypes`، و `MediaTranscribedIndexes` نگاشت می‌کند.

## قرارداد آداپتر

برای `run` کامل، شکل آداپتر چنین است:

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

`resolveTurn` یک `ChannelTurnResolved` برمی‌گرداند، که یک `AssembledChannelTurn` با گونه پذیرش اختیاری است. برگرداندن `{ admission: { kind: "observeOnly" } }` نوبت را بدون تولید خروجی قابل‌مشاهده اجرا می‌کند. آداپتر همچنان مالک callback تحویل است؛ فقط برای آن نوبت به یک عملیات بدون اثر تبدیل می‌شود.

`onFinalize` روی هر نتیجه اجرا می‌شود، از جمله خطاهای dispatch. از آن برای پاک‌کردن تاریخچه گروه در انتظار، حذف واکنش‌های ack، متوقف‌کردن نشانگرهای وضعیت، و flush کردن وضعیت محلی استفاده کنید.

## آداپتر تحویل

کرنل مستقیما پلتفرم را فراخوانی نمی‌کند. کانال یک `ChannelTurnDeliveryAdapter` به کرنل می‌دهد:

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

`deliver` برای هر قطعه پاسخ بافرشده یک‌بار فراخوانی می‌شود. وقتی کانال شناسه‌های پیام پلتفرم را دارد، آن‌ها را برگردانید تا dispatcher بتواند لنگرهای رشته را حفظ کند و قطعه‌های بعدی را ویرایش کند. برای نوبت‌های فقط مشاهده، `{ visibleReplySent: false }` را برگردانید یا از `createNoopChannelTurnDeliveryAdapter()` استفاده کنید.

## گزینه‌های رکورد

مرحله رکورد `recordInboundSession` را دربرمی‌گیرد. بیشتر کانال‌ها می‌توانند از پیش‌فرض‌ها استفاده کنند. از طریق `record` بازنویسی کنید:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

dispatcher منتظر مرحله رکورد می‌ماند. اگر رکورد خطا بدهد، کرنل `onPreDispatchFailure` را اجرا می‌کند (وقتی به `runPrepared` داده شده باشد) و دوباره خطا را پرتاب می‌کند.

## مشاهده‌پذیری

وقتی callback `log` فراهم شده باشد، هر مرحله یک رویداد ساخت‌یافته منتشر می‌کند:

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

مراحل ثبت‌شده در لاگ: `ingest`، `classify`، `preflight`، `resolve`، `authorize`، `assemble`، `record`، `dispatch`، `finalize`. از لاگ‌کردن بدنه‌های خام پرهیز کنید؛ برای پیش‌نمایش‌های کوتاه و ویرایش‌شده از `MessageFacts.preview` استفاده کنید.

## آنچه محلیِ کانال باقی می‌ماند

کرنل مالک هماهنگ‌سازی است. کانال همچنان مالک این موارد است:

- انتقال‌های پلتفرم (gateway، REST، websocket، polling، webhooks)
- حل هویت و تطبیق نام نمایشی
- فرمان‌های بومی، فرمان‌های slash، autocomplete، modalها، دکمه‌ها، وضعیت صوتی
- رندر کارت، modal، و adaptive-card
- احراز هویت رسانه، قوانین CDN، رسانه رمزگذاری‌شده، رونویسی
- APIهای ویرایش، واکنش، ویرایش محرمانه، و حضور
- backfill و دریافت تاریخچه سمت پلتفرم
- جریان‌های جفت‌سازی که به راستی‌آزمایی ویژه پلتفرم نیاز دارند

اگر دو کانال برای یکی از این‌ها به helper یکسانی نیاز پیدا کردند، به‌جای هل‌دادن آن به کرنل، یک helper مشترک SDK استخراج کنید.

## پایداری

`runtime.channel.turn.*` بخشی از سطح عمومی runtime Plugin است. نوع‌های fact (`SenderFacts`، `ConversationFacts`، `RouteFacts`، `ReplyPlanFacts`، `AccessFacts`، `MessageFacts`، `SupplementalContextFacts`، `InboundMediaFacts`) و شکل‌های پذیرش (`ChannelTurnAdmission`، `ChannelEventClass`) از طریق `PluginRuntime` از `openclaw/plugin-sdk/core` قابل دسترسی هستند.

قواعد سازگاری با نسخه‌های قبلی اعمال می‌شوند: فیلدهای fact جدید افزایشی هستند، گونه‌های پذیرش تغییر نام داده نمی‌شوند، و نام‌های نقطه ورود پایدار می‌مانند. نیازهای جدید کانال که به تغییری غیرافزایشی نیاز دارند باید از فرایند مهاجرت SDK مربوط به Plugin عبور کنند.

## مرتبط

- [ساخت Pluginهای کانال](/fa/plugins/sdk-channel-plugins) برای قرارداد گسترده‌تر Plugin کانال
- [helperهای runtime مربوط به Plugin](/fa/plugins/sdk-runtime) برای سطح‌های دیگر `runtime.*`
- [جزئیات داخلی Plugin](/fa/plugins/architecture-internals) برای pipeline بارگذاری و مکانیک رجیستری
